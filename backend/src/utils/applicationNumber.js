const crypto = require('crypto');

// Produces e.g. "APP-202607-A1B2C3" — sortable-ish by month, with a random
// suffix so we don't need a shared sequence counter (and therefore no extra
// contention/locking on a hot table at submission time). Collisions are
// astronomically unlikely; the caller still has a unique DB constraint as a
// backstop and should retry on the rare P2002 conflict.
function generateApplicationNumber(date = new Date()) {
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `APP-${yearMonth}-${suffix}`;
}

module.exports = { generateApplicationNumber };
