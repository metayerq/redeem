const { sb, checkPin } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  if (!checkPin(req, res)) return;

  try {
    const rows = await sb('GET', 'vouchers?select=*&order=created_at.asc');
    const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const csv = [
      ['email', 'telephone', 'prenom', 'optin_marketing', 'code', 'cree_le', 'utilise_le'],
      ...rows.map((v) => [v.email, v.phone, v.first_name, v.marketing_opt_in ? 'oui' : 'non', v.code, v.created_at, v.redeemed_at || '']),
    ].map((r) => r.map(esc).join(';')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts-cafe.csv"');
    res.status(200).send('﻿' + csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
