const GEMINI_MODEL = 'gemini-2.0-flash';

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.text === 'string')
    .slice(-6)
    .map((item) => ({
      role: item.role === 'assistant' ? 'Assistent' : 'Gebruiker',
      text: item.text.slice(0, 1200),
    }));
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

  const historyText = safeHistory.map((item) => `${item.role}: ${item.text}`).join('\n');
  const reportContext = reportName
    ? `Er is een rapport geupload met bestandsnaam: ${reportName}.`
    : 'Er is nog geen rapport geupload.';

  const prompt = [
    'Je bent een sportfysioloog van Sportmetrics.',
    'Geef praktische, korte antwoorden in het Nederlands met direct toepasbare tips.',
    'Geen medisch advies geven.',
    reportContext,
    historyText ? `Context uit dit gesprek:\n${historyText}` : '',
    `Nieuwe vraag: ${question}`,
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
            maxOutputTokens: 700,
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
