const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Usage: router.get('/admin-only', authenticate, requireRole('ADMIN'), handler)
// Must run after `authenticate` so req.user is populated.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.audit('authorization_denied', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method,
      });
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = requireRole;
