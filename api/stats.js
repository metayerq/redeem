const { sb, checkPin } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  if (!checkPin(req, res)) return;

  try {
    const rows = await sb('GET', 'vouchers?select=email,phone,first_name,marketing_opt_in,code,created_at,redeemed_at&order=created_at.desc');
    res.status(200).json({
      issued: rows.length,
      redeemed: rows.filter((v) => v.redeemed_at).length,
      optIns: rows.filter((v) => v.marketing_opt_in).length,
      contacts: rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
