const { CONFIG } = require('./_lib');

module.exports = async (req, res) => {
  res.status(200).json({
    cafeName: CONFIG.cafeName,
    instagramHandle: CONFIG.instagramHandle,
    validFrom: CONFIG.validFrom,
    validUntil: CONFIG.validUntil,
  });
};
