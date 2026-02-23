const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

const KNOWLEDGE_MAX_CHARS = Number(process.env.KNOWLEDGE_MAX_CHARS || 120000);
const REPORT_MAX_CHARS = Number(process.env.REPORT_MAX_CHARS || 50000);
const LITERATURE_CONTEXT_MAX_CHARS = Number(process.env.LITERATURE_CONTEXT_MAX_CHARS || 22000);
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 1800);
const CONTINUATION_TOKENS = Number(process.env.GEMINI_CONTINUATION_TOKENS || 900);

let knowledgeCache = {
  loadedAt: 0,
  documents: [],
};

const sanitizeText = (value, maxChars) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized.slice(0, maxChars);
};

const prioritizeKnowledgeFiles = (entries) => {
  const files = entries.filter((entry) => entry.isFile());

  return files.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aIsReader = aName.includes('reader');
    const bIsReader = bName.includes('reader');

    if (aIsReader && !bIsReader) {
      return -1;
    }
    if (!aIsReader && bIsReader) {
      return 1;
    }
    return aName.localeCompare(bName, 'nl');
  });
};

const extractTextFromPdfBuffer = async (buffer) => {
  const parsed = await pdfParse(buffer);
  return sanitizeText(parsed?.text || '', KNOWLEDGE_MAX_CHARS);
};

const extractTextFromDocxBuffer = async (buffer) => {
  const parsed = await mammoth.extractRawText({ buffer });
  return sanitizeText(parsed?.value || '', KNOWLEDGE_MAX_CHARS);
};

const loadKnowledgeDocuments = async () => {
  let entries = [];

  try {
    entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
  } catch (_error) {
    return [];
  }

  const docs = [];
  const orderedFiles = prioritizeKnowledgeFiles(entries);

  for (const file of orderedFiles) {
    const fileName = file.name;
    const lower = fileName.toLowerCase();

    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      continue;
    }

    const fullPath = path.join(KNOWLEDGE_DIR, fileName);

    try {
      const buffer = await fs.readFile(fullPath);
      const text = lower.endsWith('.pdf')
        ? await extractTextFromPdfBuffer(buffer)
        : await extractTextFromDocxBuffer(buffer);

      if (text) {
        docs.push({
          fileName,
          text,
          isReader: lower.includes('reader'),
        });
      }
    } catch (error) {
      console.error(`Kon kennisbestand niet lezen (${fileName}):`, error.message || error);
    }
  }

  return docs;
};

const getKnowledgeDocuments = async () => {
  const now = Date.now();
  const age = now - knowledgeCache.loadedAt;

  if (knowledgeCache.documents.length && age < 10 * 60 * 1000) {
    return knowledgeCache.documents;
  }

  knowledgeCache.documents = await loadKnowledgeDocuments();
  knowledgeCache.loadedAt = now;
  return knowledgeCache.documents;
};

const splitIntoSegments = (text) => {
  const roughSegments = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 80);

  if (roughSegments.length) {
    return roughSegments;
  }

  return text
    .split('\n')
    .map((part) => part.trim())
    .filter((part) => part.length > 80);
};

const tokenize = (text) => {
  const stopWords = new Set([
    'de',
    'het',
    'een',
    'en',
    'van',
    'op',
    'in',
    'met',
    'voor',
    'dat',
    'als',
    'bij',
    'aan',
    'is',
    'te',
    'ik',
    'je',
    'jij',
    'wij',
    'over',
    'door',
    'naar',
    'of',
    'the',
    'and',
    'for',
    'with',
  ]);

  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9à-ÿ]+/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
};

const selectLiteratureContext = (documents, question, reportText) => {
  if (!documents.length) {
    return '';
  }

  const queryTokens = new Set(tokenize(`${question}\n${reportText}`));
  const scored = [];

  for (const doc of documents) {
    const segments = splitIntoSegments(doc.text);

    for (const segment of segments) {
      const segmentLower = segment.toLowerCase();
      let score = doc.isReader ? 8 : 2;

      queryTokens.forEach((token) => {
        if (segmentLower.includes(token)) {
          score += 3;
        }
      });

      if (segmentLower.includes('seiler') || segmentLower.includes('zone')) {
        score += 2;
      }

      scored.push({
        fileName: doc.fileName,
        text: segment,
        score,
        isReader: doc.isReader,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.isReader && !b.isReader) {
      return -1;
    }
    if (!a.isReader && b.isReader) {
      return 1;
    }
    return a.fileName.localeCompare(b.fileName, 'nl');
  });

  const selected = [];
  const usedFingerprints = new Set();
  let totalChars = 0;

  for (const item of scored) {
    if (totalChars >= LITERATURE_CONTEXT_MAX_CHARS || selected.length >= 12) {
      break;
    }

    const clipped = sanitizeText(item.text, 1200);
    if (!clipped) {
      continue;
    }

    const fingerprint = `${item.fileName}:${clipped.slice(0, 120)}`;
    if (usedFingerprints.has(fingerprint)) {
      continue;
    }

    if (item.score <= 0 && selected.length >= 5) {
      continue;
    }

    usedFingerprints.add(fingerprint);
    selected.push(`[BRON: ${item.fileName}]\n${clipped}`);
    totalChars += clipped.length;
  }

  if (!selected.length) {
    return sanitizeText(
      documents
        .slice(0, 3)
        .map((doc) => `[BRON: ${doc.fileName}]\n${sanitizeText(doc.text, 1200)}`)
        .join('\n\n'),
      LITERATURE_CONTEXT_MAX_CHARS,
    );
  }

  return sanitizeText(selected.join('\n\n'), LITERATURE_CONTEXT_MAX_CHARS);
};

const extractReportHighlights = (reportText) => {
  if (!reportText) {
    return '';
  }

  const lines = reportText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const keywords = [
    'vo2',
    'vt1',
    'vt2',
    'drempel',
    'watt',
    'vermogen',
    'hartslag',
    'bpm',
    'zone',
    'critical power',
    'cp',
    'ml',
    'kg',
  ];

  const matched = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(line);
    }
    if (matched.length >= 28) {
      break;
    }
  }

  const source = matched.length ? matched : lines.slice(0, 16);
  return sanitizeText(source.join('\n'), 4200);
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.text === 'string')
    .slice(-6)
    .map((item) => ({
      role: item.role === 'assistant' ? 'Assistent' : 'Gebruiker',
      text: sanitizeText(item.text, 1200),
    }));
};

const getReportText = async (body) => {
  if (typeof body.reportText === 'string' && body.reportText.trim()) {
    return sanitizeText(body.reportText, REPORT_MAX_CHARS);
  }

  if (typeof body.reportPdfBase64 !== 'string' || !body.reportPdfBase64.trim()) {
    return '';
  }

  try {
    const buffer = Buffer.from(body.reportPdfBase64, 'base64');
    const text = await extractTextFromPdfBuffer(buffer);
    return sanitizeText(text, REPORT_MAX_CHARS);
  } catch (error) {
    console.error('Kon geuploade rapport-PDF niet lezen:', error.message || error);
    return '';
  }
};

const getCandidateData = (data) => {
  const candidate = data?.candidates?.[0] || {};
  const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
  const answer = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();

  const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : '';
  return { answer, finishReason };
};

const callGemini = async (apiKey, prompt, maxOutputTokens) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens,
          topP: 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  return getCandidateData(data);
};

const looksIncomplete = (text) => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return true;
  }
  return !/[.!?…]["')\]]?$/.test(trimmed);
};

const buildSystemPrompt = ({ sourceFiles }) =>
  [
    'ROL',
    'Je bent een inspanningsfysioloog van SportMetrics.',
    'Je schrijft in duidelijke leken-taal (B1), concreet en praktisch.',
    '',
    'WAARHEIDSBRONNEN',
    '1) Eerst het geuploade rapport van de sporter.',
    '2) Daarna de aangeleverde literatuurfragmenten.',
    'Gebruik alleen deze context. Als informatie ontbreekt, zeg dat expliciet.',
    '',
    'HARD RULES',
    '- SportMetrics doet GEEN lactaatmetingen; alleen ademgasanalyse + vermogen + hartslag.',
    '- Bedank de sporter kort voor het delen van het rapport.',
    '- Geen medisch advies of diagnose.',
    '- Rond alle zinnen af; nooit afkappen.',
    '- Gebruik bulletpoints en korte alinea’s.',
    '- Noem concrete waarden met eenheid als ze in het rapport staan (bijv. W, bpm, ml/kg/min).',
    '- Verzin geen waarden die niet in de context staan.',
    '',
    'VERPLICHTE ANTWOORDSTRUCTUUR',
    '1) Korte conclusie (max 2 zinnen).',
    '2) Wat ik letterlijk uit jouw rapport haal (bulletpoints).',
    '3) Vertaling naar training (3-5 acties).',
    '4) Onderbouwing uit literatuur (2-4 bullets, met bronnaam).',
    '5) Bronnen gebruikt (altijd):',
    '   - Rapport: <bestandsnaam of "niet beschikbaar">',
    ...sourceFiles.map((name) => `   - Literatuur: ${name}`),
    '6) Sluit af met: "Disclaimer: dit is geen medisch advies."',
  ].join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (_error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const reportName = typeof body.reportName === 'string' ? body.reportName.trim() : '';
  const safeHistory = sanitizeHistory(body.history);

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const knowledgeDocuments = await getKnowledgeDocuments();
  const reportText = await getReportText(body);
  const reportHighlights = extractReportHighlights(reportText);
  const literatureContext = selectLiteratureContext(knowledgeDocuments, question, reportText);
  const sourceFiles = knowledgeDocuments.map((doc) => doc.fileName);
  const historyText = safeHistory.map((item) => `${item.role}: ${item.text}`).join('\n');

  const systemPrompt = buildSystemPrompt({ sourceFiles });

  const reportContext = reportText
    ? `=== RAPPORT (bestand: ${reportName || 'onbekend'}) ===\n${reportText}`
    : reportName
      ? `=== RAPPORT ===\nBestandsnaam ontvangen: ${reportName}\nInhoud kon niet uitgelezen worden.`
      : '=== RAPPORT ===\nGeen rapport ontvangen.';

  const prompt = [
    systemPrompt,
    '',
    reportContext,
    '',
    reportHighlights ? `=== RAPPORT-HIGHLIGHTS ===\n${reportHighlights}` : '=== RAPPORT-HIGHLIGHTS ===\nGeen highlights beschikbaar.',
    '',
    literatureContext
      ? `=== LITERATUURCONTEXT (fragmenten) ===\n${literatureContext}`
      : '=== LITERATUURCONTEXT ===\nGeen literatuurfragmenten beschikbaar.',
    '',
    historyText ? `=== CONTEXT GESPREK ===\n${historyText}` : '',
    `=== NIEUWE VRAAG ===\n${question}`,
    '',
    'Belangrijk: als de vraag expliciet om rapportanalyse vraagt en er is geen bruikbare rapportinhoud, benoem dat direct in punt 1 en vraag om een beter leesbare PDF.',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const firstPass = await callGemini(apiKey, prompt, MAX_OUTPUT_TOKENS);
    let answer = firstPass.answer;

    const needsContinuation =
      !!answer &&
      (firstPass.finishReason === 'MAX_TOKENS' || (answer.length > 260 && looksIncomplete(answer)));

    if (needsContinuation) {
      const continuationPrompt = [
        systemPrompt,
        '',
        'Je vorige antwoord is afgekapt.',
        'Ga alleen verder met het ontbrekende slot en herhaal geen vorige zinnen.',
        '',
        `Laatste deel van eerder antwoord:\n${answer.slice(-1600)}`,
      ].join('\n');

      const continuation = await callGemini(apiKey, continuationPrompt, CONTINUATION_TOKENS);
      if (continuation.answer) {
        answer = `${answer}\n${continuation.answer}`.trim();
      }
    }

    if (!answer) {
      return res.status(502).json({ error: 'No answer from Gemini' });
    }

    if (!/bronnen gebruikt/i.test(answer)) {
      const sourcesBlock = [
        'Bronnen gebruikt:',
        `- Rapport: ${reportName || (reportText ? 'geupload rapport' : 'niet beschikbaar')}`,
        ...sourceFiles.slice(0, 6).map((name) => `- Literatuur: ${name}`),
      ].join('\n');
      answer = `${answer}\n\n${sourcesBlock}`;
    }

    if (!/disclaimer:\s*dit is geen medisch advies\./i.test(answer)) {
      answer = `${answer}\n\nDisclaimer: dit is geen medisch advies.`;
    }

    return res.status(200).json({ answer: sanitizeText(answer, 12000) });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: String(error.message || error) });
  }
};
