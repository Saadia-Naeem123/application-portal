const ApiError = require('../utils/ApiError');
const prisma = require('../config/db');
const { verifyAccessToken } = require('../services/token.service');

// Verifies the JWT access token from the Authorization header and attaches
// the current user (minus sensitive fields) to req.user for downstream
// handlers and the RBAC middleware.
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) {
    return next(new ApiError(401, 'Account is no longer active'));
  }

  req.user = user;
  next();
}

module.exports = authenticate;
