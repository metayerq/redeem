// Helpers partagés par toutes les fonctions serverless.
// Les fichiers préfixés par "_" ne sont pas exposés comme endpoints par Vercel.

const CONFIG = {
  cafeName: process.env.CAFE_NAME || 'Estudantina',
  instagramHandle: process.env.INSTAGRAM_HANDLE || 'estudantina.cafe',
  validFrom: process.env.VALID_FROM || '2026-06-19', // lendemain de l'opening party (18 juin)
  validUntil: process.env.VALID_UNTIL || '2026-07-19', // J+30
};

// ── Supabase (API REST, clé secrète côté serveur uniquement) ──
async function sb(method, path, { body, headers } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    const e = new Error('SUPABASE_URL / SUPABASE_SECRET_KEY manquants dans les variables d\'environnement Vercel');
    e.status = 500;
    throw e;
  }
  const r = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    const e = new Error(`Supabase ${r.status}: ${text}`);
    e.status = r.status;
    throw e;
  }
  return text ? JSON.parse(text) : null;
}

// ── codes courts sans caractères ambigus (pas de O/0, I/1) ──
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  const { randomBytes } = require('node:crypto');
  return 'GB-' + Array.from(randomBytes(4)).map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

const normEmail = (e) => String(e || '').trim().toLowerCase();
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const today = () => new Date().toISOString().slice(0, 10);

function checkPin(req, res) {
  const pin = process.env.STAFF_PIN;
  if (!pin) {
    res.status(500).json({ error: 'STAFF_PIN non configuré sur Vercel' });
    return false;
  }
  if (String((req.body || {}).pin || '') !== pin) {
    res.status(401).json({ error: 'PIN incorrect' });
    return false;
  }
  return true;
}

// ── Brevo : envoi du bon par email (best effort, jamais bloquant) ──
async function sendVoucherEmail({ email, firstName, code }) {
  const apiKey = process.env.BREVO_API_KEY; // clé API REST (xkeysib-...), PAS la clé SMTP
  const sender = process.env.BREVO_SENDER_EMAIL; // expéditeur validé dans Brevo
  if (!apiKey || !sender) return false;

  const fmt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: CONFIG.cafeName, email: sender },
        to: [{ email }],
        subject: `Votre ginger beer offerte — ${CONFIG.cafeName}`,
        htmlContent: `
          <div style="background:#f6f1e3;padding:32px 16px">
            <div style="font-family:-apple-system,'Segoe UI','Helvetica Neue',Arial,sans-serif;max-width:440px;margin:auto;color:#232a24;background:#fffdf6;border:1px solid #e2dbc6;border-radius:12px;padding:32px 28px">
              <div style="font-size:13px;font-weight:700;letter-spacing:5px;color:#1c5e3c;text-align:center;margin-bottom:24px">ESTUDANTINA</div>
              <p style="margin:0 0 8px;font-size:17px;font-weight:600">Bonjour${firstName ? ' ' + firstName : ''},</p>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#7c7a6c">Merci d'être passé pour l'inauguration. Voici votre bon pour une ginger beer offerte, à présenter au comptoir lors de votre prochain passage.</p>
              <div style="border:1.5px dashed #1c5e3c;border-radius:10px;padding:24px 16px;text-align:center">
                <div style="font-size:11px;font-weight:600;letter-spacing:2px;color:#1c5e3c;text-transform:uppercase">Une ginger beer offerte</div>
                <div style="font-size:28px;font-weight:700;letter-spacing:4px;color:#154a2f;font-family:'SF Mono',Menlo,monospace;margin:12px 0 10px">${code}</div>
                <div style="font-size:12px;color:#7c7a6c">Valable du ${fmt(CONFIG.validFrom)} au ${fmt(CONFIG.validUntil)} — usage unique</div>
              </div>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#7c7a6c">À bientôt,<br>${CONFIG.cafeName} — <a href="https://instagram.com/${CONFIG.instagramHandle}" style="color:#1c5e3c">@${CONFIG.instagramHandle}</a></p>
            </div>
          </div>`,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

module.exports = { CONFIG, sb, newCode, normEmail, isEmail, today, checkPin, sendVoucherEmail };
