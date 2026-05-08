const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@sportmetrics.nl';
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Sportmetrics <info@sportmetrics.nl>';
const RESEND_API_URL = 'https://api.resend.com/emails';

const FIELD_LABELS = {
  sport: 'Sport',
  name: 'Naam',
  birthdate: 'Geboortedatum',
  email: 'E-mailadres',
  sex: 'Seks',
  weight: 'Gewicht',
  height: 'Lengte',
  goal: 'Doel',
  event_date: 'Wedstrijddatum',
  run_paces: "Geschatte tempo's / pace",
  run_hr_zones: 'Geschatte hartslagzones',
  run_km_week: 'Kilometers per week',
  run_test: 'Voorkeur hardlooptest',
  bike_goal: 'Fietsdoel',
  level_hours: 'Fietsuren per week',
  axle: 'As fiets',
  bike_test: 'Voorkeur fietstest',
  location: 'Locatie',
  notes: 'Opmerking / vraag',
  source: 'Pagina',
};

const SPORT_LABELS = {
  run: 'Hardlopen',
  bike: 'Wielrennen',
};

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cleanValue = (value, maxLength = 1500) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .replace(/\u0000/g, '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
    .slice(0, maxLength);
};

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const formatSubmission = (submission) =>
  Object.entries(FIELD_LABELS)
    .map(([key, label]) => {
      const value = key === 'sport' ? SPORT_LABELS[submission[key]] || submission[key] : submission[key];
      return [label, cleanValue(value)];
    })
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));

const fieldsToHtml = (fields) =>
  fields
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #dbe6f5;color:#426180;font-weight:700;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #dbe6f5;color:#12233d;white-space:pre-line;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join('');

const fieldsToText = (fields) => fields.map(({ label, value }) => `${label}: ${value}`).join('\n');

const sendEmail = async ({ to, replyTo, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY ontbreekt');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to,
      reply_to: replyTo,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend fout ${response.status}: ${detail}`);
  }

  return response.json();
};

const buildInternalEmail = (fields, submission) => {
  const sportLabel = SPORT_LABELS[submission.sport] || 'Nieuwe aanvraag';
  const name = cleanValue(submission.name) || 'Onbekende sporter';

  return {
    subject: `Nieuwe Sportmetrics aanvraag: ${sportLabel} - ${name}`,
    text: `Er is een nieuwe aanvraag binnengekomen via het contactformulier.\n\n${fieldsToText(fields)}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f8ff;padding:24px;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dbe6f5;border-radius:18px;overflow:hidden;">
          <div style="background:#12233d;color:#ffffff;padding:22px 24px;">
            <p style="margin:0 0 8px;color:#9dbaf0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Sportmetrics contactformulier</p>
            <h1 style="margin:0;font-size:24px;">Nieuwe aanvraag: ${escapeHtml(sportLabel)}</h1>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:15px;">${fieldsToHtml(fields)}</table>
        </div>
      </div>
    `,
  };
};

const buildConfirmationEmail = (fields, submission) => {
  const name = cleanValue(submission.name).split(/\s+/)[0] || 'daar';

  return {
    subject: 'Je aanvraag bij Sportmetrics is ontvangen',
    text: `Hoi ${name},\n\nDank voor je aanvraag bij Sportmetrics. We hebben je gegevens ontvangen en nemen zo snel mogelijk contact met je op met een passend voorstel.\n\nSamenvatting van je aanvraag:\n${fieldsToText(fields)}\n\nSportmetrics\ninfo@sportmetrics.nl`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f8ff;padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe6f5;border-radius:18px;overflow:hidden;">
          <div style="background:#12233d;color:#ffffff;padding:22px 24px;">
            <p style="margin:0 0 8px;color:#9dbaf0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Sportmetrics</p>
            <h1 style="margin:0;font-size:24px;">Je aanvraag is ontvangen</h1>
          </div>
          <div style="padding:22px 24px;color:#243b5a;font-size:15px;line-height:1.6;">
            <p>Hoi ${escapeHtml(name)},</p>
            <p>Dank voor je aanvraag. We hebben je gegevens ontvangen en nemen zo snel mogelijk contact met je op met een passend voorstel voor tijd, locatie en testvorm.</p>
            <p style="margin-top:20px;font-weight:700;color:#12233d;">Samenvatting van je aanvraag</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:15px;">${fieldsToHtml(fields)}</table>
          <div style="padding:18px 24px;color:#4d6381;font-size:14px;line-height:1.6;">
            <p style="margin:0;">Heb je in de tussentijd vragen? Reageer op deze mail of stuur een WhatsApp-bericht.</p>
          </div>
        </div>
      </div>
    `,
  };
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Methode niet toegestaan' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const submission = Object.fromEntries(
      Object.keys(FIELD_LABELS).map((key) => [key, cleanValue(body[key])]),
    );

    if (!submission.name || !submission.email || !submission.sport || !submission.goal) {
      json(res, 400, { error: 'Naam, e-mailadres, sport en doel zijn verplicht.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
      json(res, 400, { error: 'Vul een geldig e-mailadres in.' });
      return;
    }

    const fields = formatSubmission(submission);
    const internalEmail = buildInternalEmail(fields, submission);
    const confirmationEmail = buildConfirmationEmail(fields, submission);

    try {
      await sendEmail({
        to: [CONTACT_TO_EMAIL],
        replyTo: submission.email,
        ...internalEmail,
      });
    } catch (error) {
      console.error('Contactformulier interne mail mislukt:', error);
      json(res, 500, {
        error:
          'De mailservice is nog niet goed ingesteld. Stuur ons direct een WhatsApp-bericht of mail naar info@sportmetrics.nl.',
      });
      return;
    }

    try {
      await sendEmail({
        to: [submission.email],
        replyTo: CONTACT_TO_EMAIL,
        ...confirmationEmail,
      });
    } catch (error) {
      console.error('Contactformulier bevestigingsmail mislukt:', error);
      json(res, 200, {
        ok: true,
        confirmationSent: false,
        message:
          'Dank! Je aanvraag is ontvangen. De automatische bevestigingsmail kon mogelijk niet worden verstuurd.',
      });
      return;
    }

    json(res, 200, { ok: true, confirmationSent: true });
  } catch (error) {
    console.error('Contactformulier fout:', error);
    json(res, 500, {
      error:
        'Je aanvraag kon niet automatisch worden verstuurd. Stuur ons direct een WhatsApp-bericht of mail naar info@sportmetrics.nl.',
    });
  }
};
