const crypto = require('crypto');

function generateId(prefix = '') {
  const random = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}_${random}` : random;
}

module.exports = { generateId };
