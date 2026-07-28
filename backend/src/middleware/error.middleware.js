const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');
const logger = require('../utils/logger');

// Centralized error handler. Any error passed to next(err), or thrown in an
// async handler wrapped with asyncHandler, ends up here.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`;
    errors = [];
  }

  // Multer upload errors (file too large, too many files, etc.)
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed size (10MB)'
        : `Upload error: ${err.message}`;
    errors = [];
  }

  if (!(err instanceof ApiError)) {
    logger.error(err.message || 'Unhandled error', {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else if (statusCode >= 500) {
    logger.error(err.message, { path: req.originalUrl, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(nodeEnv !== 'production' && !(err instanceof ApiError) ? { stack: err.stack } : {}),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, errors: [] });
};

module.exports = { errorHandler, notFoundHandler };
