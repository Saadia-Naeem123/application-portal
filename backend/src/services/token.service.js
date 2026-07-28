const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig } = require('../config/env');

/** Sign a short-lived access token carrying id + role for RBAC checks. */
function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
}

/** Sign a longer-lived refresh token. Only the id is needed here. */
function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

/** Generate a random URL-safe token (for email verification / password reset links). */
function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Hash a raw token before storing it — DB should never hold usable plaintext tokens. */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRawToken,
  hashToken,
};
