const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const ASSET_ADEMGAS_GUIDE = path.join(process.cwd(), 'assets', 'ademgasanalyse-o2-only-drempelbepaling-2.pdf');

const KNOWLEDGE_MAX_CHARS = Number(process.env.KNOWLEDGE_MAX_CHARS || 120000);
const REPORT_MAX_CHARS = Number(process.env.REPORT_MAX_CHARS || 50000);
const LITERATURE_CONTEXT_MAX_CHARS = Number(process.env.LITERATURE_CONTEXT_MAX_CHARS || 22000);
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 2800);
const CONTINUATION_TOKENS = Number(process.env.GEMINI_CONTINUATION_TOKENS || 1400);
const MAX_CONTINUATION_PASSES = Number(process.env.GEMINI_MAX_CONTINUATION_PASSES || 3);
const LITERATURE_NOTE =
  'Mijn antwoord is op basis van mijn aangeleverde literatuur die komt vanuit SportMetrics. Hiermee zorg ik ervoor dat ik altijd zo goed mogelijk bij de theorie blijf en juiste antwoorden geef.';

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

const loadKnowledgeFileFromPath = async (fullPath, explicitFileName = '') => {
  const fileName = explicitFileName || path.basename(fullPath);
  const lower = fileName.toLowerCase();

  if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
    return null;
  }

  const buffer = await fs.readFile(fullPath);
  const text = lower.endsWith('.pdf') ? await extractTextFromPdfBuffer(buffer) : await extractTextFromDocxBuffer(buffer);

  if (!text) {
    return null;
  }

  return {
    fileName,
    text,
    isReader: lower.includes('reader'),
    isGasGuide: /(ademgasanalyse|o2-only|lactaat|drempelbepaling|gasanalyse)/i.test(lower),
  };
};

const loadKnowledgeDocuments = async () => {
  let entries = [];

  try {
    entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
  } catch (_error) {
    entries = [];
  }

  const docs = [];
  const orderedFiles = prioritizeKnowledgeFiles(entries);
  const docKeys = new Set();

  for (const file of orderedFiles) {
    const fileName = file.name;
    const lower = fileName.toLowerCase();

    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      continue;
    }

    try {
      const fullPath = path.join(KNOWLEDGE_DIR, fileName);
      const doc = await loadKnowledgeFileFromPath(fullPath, fileName);
      if (doc) {
        docs.push(doc);
        docKeys.add(doc.fileName.toLowerCase());
      }
    } catch (error) {
      console.error(`Kon kennisbestand niet lezen (${fileName}):`, error.message || error);
    }
  }

  // Extra prioritaire bron in assets: O2-only drempelbepaling.
  try {
    const extraDoc = await loadKnowledgeFileFromPath(ASSET_ADEMGAS_GUIDE);
    if (extraDoc && !docKeys.has(extraDoc.fileName.toLowerCase())) {
      docs.push(extraDoc);
    }
  } catch (_error) {
    // Optioneel bestand; geen fout nodig als dit ontbreekt.
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

  const gasTopic = /(ademgas|gasanalyse|lactaat|o2|drempel|vt1|vt2|ventilatie|teugvolume)/i.test(`${question}\n${reportText}`);
  const queryTokens = new Set(tokenize(`${question}\n${reportText}`));
  const scored = [];

  for (const doc of documents) {
    const segments = splitIntoSegments(doc.text);

    for (const segment of segments) {
      const segmentLower = segment.toLowerCase();
      let score = doc.isReader ? 8 : 2;
      if (doc.isGasGuide) {
        score += gasTopic ? 10 : 2;
      }

      queryTokens.forEach((token) => {
        if (segmentLower.includes(token)) {
          score += 3;
        }
      });

      if (segmentLower.includes('seiler') || segmentLower.includes('zone')) {
        score += 2;
      }

      if (gasTopic && /(ademgas|gasanalyse|o2|ventil|teugvolume|lactaat|drempel)/.test(segmentLower)) {
        score += 6;
      }

      scored.push({
        fileName: doc.fileName,
        text: segment,
        score,
        isReader: doc.isReader,
        isGasGuide: !!doc.isGasGuide,
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
    if (gasTopic) {
      if (a.isGasGuide && !b.isGasGuide) {
        return -1;
      }
      if (!a.isGasGuide && b.isGasGuide) {
        return 1;
      }
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

const buildSystemPrompt = ({ hasReport }) => {
  const lines = [
    '1) ROL EN IDENTITEIT',
    'Je opereert expliciet als expert sportfysioloog van SportMetrics (focus: wielrennen/hardlopen, inspanningstesten, zones, drempels, trainingsinterpretatie en praktische toepassing).',
    'Je schrijft in duidelijke leken-taal (B1), professioneel, enthousiast en direct toepasbaar.',
    'Je geeft geen medische diagnostiek.',
    '',
    '2) BRONMATERIAAL ALS ABSOLUTE WAARHEID',
    hasReport
      ? 'Gebruik eerst het geuploade rapport van de gebruiker, daarna de aangeleverde SportMetrics-literatuur.'
      : 'Gebruik de aangeleverde SportMetrics-literatuur als primaire kennisbasis.',
    'Behandel de inhoud uit deze context als leidende waarheid.',
    'Als info ontbreekt: benoem dat expliciet en verzin niets.',
    '',
    '3) INHOUDELIJKE REGELS EN GRENZEN',
    '- SportMetrics doet GEEN lactaatmetingen; alleen ademgasanalyse + vermogen + hartslag.',
    '- Trainingsprincipes volgen de SportMetrics-literatuur (o.a. zone-/drempelmodel in die bronnen).',
    '- Bij vragen over ademgasanalyse of waarom we geen lactaatmeting doen: leg O2-only drempelbepaling duidelijk uit en koppel dit aan ons protocol zonder prikken.',
    '- Geef geen medisch advies of diagnose.',
    '- Rond alle zinnen af; nooit afkappen.',
    '- Gebruik Markdown-opmaak met duidelijke kopjes, bullets en korte alinea’s.',
    '- Noem concrete waarden met eenheid als ze in het rapport staan (bijv. W, bpm, ml/kg/min).',
    '- Verzin geen waarden die niet in de context staan.',
    '- Noem GEEN losse bronbestandsnamen in je antwoord.',
    '',
    '4) ANTWOORDSTIJL',
    '- Praktisch, enthousiast en overzichtelijk.',
    '- Gebruik korte alinea’s en bullets i.p.v. lange academische lappen tekst.',
    '- Vertaal theorie altijd naar "wat moet ik nu doen?"',
    '',
    '5) KLANTBELEVING EN TONE OF VOICE',
    '- Als iemand een test/rapport deelt: geef altijd props en bedank voor het doen/delen van de test bij SportMetrics.',
    '- Bij algemene vraag zonder rapport: vriendelijk en coachend, zonder geforceerde bedankzin.',
    '',
    '6) OUTPUTVORM',
    '- Bij inhoudelijke vragen altijd duidelijke kopjes (##) en bullets.',
    '- Bij korte begroeting ("hoi", "hallo"): kort antwoord van 3-5 zinnen.',
    '- Bij inhoudelijke vraag zonder rapport: geef uitgebreide maar scanbare uitleg in deze volgorde:',
  ];

  if (hasReport) {
    lines.push('## Korte conclusie');
    lines.push('## Wat ik letterlijk uit jouw rapport haal');
    lines.push('## Wat betekent dit voor jouw training?');
    lines.push('## Waarom dit fysiologisch klopt');
    lines.push('## Hoe wij dit bij SportMetrics meten');
    lines.push('- Zet in "Hoe wij dit meten" expliciet: ademgasanalyse + vermogen + hartslag, geen prikken.');
    lines.push('- Voeg korte props + bedankzin toe bovenaan.');
  } else {
    lines.push('## Wat is dit precies?');
    lines.push('## Waarom is dit belangrijk?');
    lines.push('## Hoe pas je dit praktisch toe?');
    lines.push('## Hoe meten wij dit bij SportMetrics?');
    lines.push('- In "Hoe meten wij dit bij SportMetrics?" benoem je expliciet: ademgasanalyse + vermogen + hartslag, en dat we niet prikken.');
  }

  lines.push('');
  lines.push('7) VASTE AFSLUITING');
  lines.push(`- Sluit altijd af met exact deze zin: "${LITERATURE_NOTE}"`);
  lines.push('- Eindig daarna altijd met: "Disclaimer: dit is geen medisch advies."');

  return lines.join('\n');
};

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
  const historyText = safeHistory.map((item) => `${item.role}: ${item.text}`).join('\n');

  const hasReport = !!reportText;
  const systemPrompt = buildSystemPrompt({ hasReport });

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
    let finishReason = firstPass.finishReason;

    for (let pass = 0; pass < MAX_CONTINUATION_PASSES; pass += 1) {
      const needsContinuation =
        !!answer && (finishReason === 'MAX_TOKENS' || (answer.length > 260 && looksIncomplete(answer)));

      if (!needsContinuation) {
        break;
      }

      const continuationPrompt = [
        systemPrompt,
        '',
        'Je vorige antwoord is afgekapt.',
        'Ga alleen verder met het ontbrekende slot en herhaal geen vorige zinnen.',
        'Maak de laatste lopende zin eerst netjes af, en werk daarna de resterende punten af.',
        '',
        `Laatste deel van eerder antwoord:\n${answer.slice(-2200)}`,
      ].join('\n');

      const continuation = await callGemini(apiKey, continuationPrompt, CONTINUATION_TOKENS);
      if (!continuation.answer) {
        break;
      }

      answer = `${answer}\n${continuation.answer}`.trim();
      finishReason = continuation.finishReason;
    }

    if (!answer) {
      return res.status(502).json({ error: 'No answer from Gemini' });
    }

    answer = answer
      .replace(/\n{0,2}Bronnen gebruikt:[\s\S]*?(?=\n+Disclaimer:|$)/gi, '\n')
      .replace(/^\s*-\s*(Rapport|Literatuur):.*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!answer.includes(LITERATURE_NOTE)) {
      answer = `${answer}\n\n${LITERATURE_NOTE}`;
    }

    if (!/disclaimer:\s*dit is geen medisch advies\./i.test(answer)) {
      answer = `${answer}\n\nDisclaimer: dit is geen medisch advies.`;
    }

    return res.status(200).json({ answer: sanitizeText(answer, 18000) });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: String(error.message || error) });
  }
};
