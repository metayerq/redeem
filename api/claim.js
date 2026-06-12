const { CONFIG, sb, newCode, normEmail, isEmail, sendVoucherEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const body = req.body || {};
  const email = normEmail(body.email);
  if (!isEmail(email)) return res.status(400).json({ error: 'Email invalide' });

  try {
    // 1 email = 1 bon : on renvoie l'existant s'il y en a un
    let voucher = (await sb('GET', `vouchers?email=eq.${encodeURIComponent(email)}&select=*`))[0];
    let alreadyExisted = Boolean(voucher);
    let emailSent = false;

    if (!voucher) {
      const row = {
        code: newCode(),
        email,
        phone: String(body.phone || '').trim().slice(0, 30),
        first_name: String(body.firstName || '').trim().slice(0, 60),
        marketing_opt_in: Boolean(body.marketingOptIn),
      };
      for (let attempt = 0; ; attempt++) {
        try {
          voucher = (await sb('POST', 'vouchers', {
            body: row,
            headers: { Prefer: 'return=representation' },
          }))[0];
          break;
        } catch (e) {
          if (e.status !== 409) throw e;
          // conflit : soit l'email vient d'être inscrit en parallèle…
          const existing = (await sb('GET', `vouchers?email=eq.${encodeURIComponent(email)}&select=*`))[0];
          if (existing) { voucher = existing; alreadyExisted = true; break; }
          // … soit collision de code : on en tire un autre
          if (attempt >= 3) throw e;
          row.code = newCode();
        }
      }
      if (!alreadyExisted) {
        emailSent = await sendVoucherEmail({ email, firstName: row.first_name, code: voucher.code });
      }
    }

    res.status(200).json({
      code: voucher.code,
      validFrom: CONFIG.validFrom,
      validUntil: CONFIG.validUntil,
      alreadyExisted,
      emailSent,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
