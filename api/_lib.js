// Helpers partagés par toutes les fonctions serverless.
// Les fichiers préfixés par "_" ne sont pas exposés comme endpoints par Vercel.

const CONFIG = {
  cafeName: process.env.CAFE_NAME || 'Mon Café',
  instagramHandle: process.env.INSTAGRAM_HANDLE || 'moncafe',
  validFrom: process.env.VALID_FROM || '2026-06-13', // lendemain de l'inauguration
  validUntil: process.env.VALID_UNTIL || '2026-07-13', // J+30
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
        subject: `🫚 Ton bon pour une ginger beer offerte — ${CONFIG.cafeName}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;color:#3a2a1a">
            <h2>Salut${firstName ? ' ' + firstName : ''} 👋</h2>
            <p>Merci d'être passé·e pour notre inauguration ! Voici ton bon pour
            <b>une ginger beer offerte</b> lors de ton prochain passage :</p>
            <div style="border:3px dashed #c9701a;border-radius:14px;padding:20px;text-align:center;background:#fdf6ec">
              <div style="font-size:30px;font-weight:800;letter-spacing:3px;color:#9a5210;font-family:monospace">${code}</div>
              <div style="font-size:13px;color:#7a6650;margin-top:6px">
                Valable du ${fmt(CONFIG.validFrom)} au ${fmt(CONFIG.validUntil)} · usage unique
              </div>
            </div>
            <p>Montre ce code au comptoir, et c'est tout. À très vite !</p>
            <p>— L'équipe ${CONFIG.cafeName} · <a href="https://instagram.com/${CONFIG.instagramHandle}">@${CONFIG.instagramHandle}</a></p>
          </div>`,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

module.exports = { CONFIG, sb, newCode, normEmail, isEmail, today, checkPin, sendVoucherEmail };
