const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const GEMINI_MODEL = 'gemini-2.5-flash';
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const KNOWLEDGE_MAX_CHARS = Number(process.env.KNOWLEDGE_MAX_CHARS || 90000);
const REPORT_MAX_CHARS = Number(process.env.REPORT_MAX_CHARS || 30000);

let knowledgeCache = {
  loadedAt: 0,
  text: '',
};

const sanitizeText = (value, maxChars) => {
  if (typeof value !== 'string') {
    return '';
  }
  const normalized = value.replace(/\u0000/g, ' ').replace(/\s+\n/g, '\n').trim();
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

const loadKnowledgeText = async () => {
  let entries = [];

  try {
    entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
  } catch (_error) {
    return '';
  }

  const chunks = [];
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
      let text = '';

      if (lower.endsWith('.pdf')) {
        text = await extractTextFromPdfBuffer(buffer);
      } else {
        text = await extractTextFromDocxBuffer(buffer);
      }

      if (text) {
        chunks.push(`### BRON: ${fileName}\n${text}`);
      }
    } catch (error) {
      console.error(`Kon kennisbestand niet lezen (${fileName}):`, error.message || error);
    }
  }

  return sanitizeText(chunks.join('\n\n'), KNOWLEDGE_MAX_CHARS);
};

const getKnowledgeText = async () => {
  const now = Date.now();
  const cacheAge = now - knowledgeCache.loadedAt;

  if (knowledgeCache.text && cacheAge < 10 * 60 * 1000) {
    return knowledgeCache.text;
  }

  knowledgeCache.text = await loadKnowledgeText();
  knowledgeCache.loadedAt = now;
  return knowledgeCache.text;
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

  const knowledgeBase = await getKnowledgeText();
  const reportText = await getReportText(body);
  const historyText = safeHistory.map((item) => `${item.role}: ${item.text}`).join('\n');

  const systemPrompt = [
    'ROL: Je bent een expert sportfysioloog van SportMetrics.',
    '',
    'BRONMATERIAAL:',
    'Je hebt toegang tot specifieke literatuur over trainingsleer (zie hieronder).',
    'Gebruik DEZE INFORMATIE als de absolute waarheid.',
    '',
    '=== START LITERATUUR ===',
    knowledgeBase || 'Er is op dit moment nog geen literatuur geladen uit de knowledge-map.',
    '=== EINDE LITERATUUR ===',
    '',
    'BELANGRIJKE REGELS:',
    '1. SportMetrics doet GEEN lactaatmetingen (prikken), alleen ademgasanalyse.',
    '2. Gebruik de principes (zoals Seiler zones) zoals beschreven in de geuploade literatuur.',
    '3. Reader staat altijd bovenaan in prioriteit als bron.',
    '4. Wees praktisch, enthousiast en gebruik bulletpoints.',
    '5. Geen medisch advies.',
    '6. Geef altijd props aan de sporter voor de test en bedank dat hij/zij deze bij SportMetrics heeft gedaan.',
  ].join('\n');

  const reportContext = reportText
    ? `HIER IS HET RAPPORT VAN DE KLANT (${reportName || 'zonder bestandsnaam'}):\n${reportText}`
    : reportName
      ? `Er is een rapport geupload met bestandsnaam: ${reportName}.`
      : 'Er is nog geen rapport geupload.';

  const prompt = [
    systemPrompt,
    '',
    reportContext,
    historyText ? `Context uit dit gesprek:\n${historyText}` : '',
    `Nieuwe vraag van de klant: ${question}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
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
            temperature: 0.5,
            maxOutputTokens: 900,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ error: 'Gemini request failed', detail: detail.slice(0, 400) });
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim() || '';

    if (!answer) {
      return res.status(502).json({ error: 'No answer from Gemini' });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: String(error.message || error) });
  }
};
