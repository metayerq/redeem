const { CONFIG, sb, today, checkPin } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  if (!checkPin(req, res)) return;

  let code = String((req.body || {}).code || '').trim().toUpperCase().replace(/\s/g, '');
  if (code && !code.startsWith('GB-')) code = 'GB-' + code.replace(/^GB/, '');

  try {
    const v = (await sb('GET', `vouchers?code=eq.${encodeURIComponent(code)}&select=*`))[0];
    if (!v) return res.status(200).json({ status: 'unknown' });
    if (v.redeemed_at) return res.status(200).json({ status: 'already_redeemed', redeemedAt: v.redeemed_at });
    if (today() < CONFIG.validFrom) return res.status(200).json({ status: 'not_yet_valid', validFrom: CONFIG.validFrom });
    if (today() > CONFIG.validUntil) return res.status(200).json({ status: 'expired', validUntil: CONFIG.validUntil });

    // le filtre redeemed_at=is.null rend l'opération atomique :
    // deux validations simultanées → une seule passe
    const updated = await sb('PATCH', `vouchers?code=eq.${encodeURIComponent(v.code)}&redeemed_at=is.null`, {
      body: { redeemed_at: new Date().toISOString() },
      headers: { Prefer: 'return=representation' },
    });
    if (!updated.length) return res.status(200).json({ status: 'already_redeemed', redeemedAt: new Date().toISOString() });

    res.status(200).json({ status: 'redeemed', firstName: v.first_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
