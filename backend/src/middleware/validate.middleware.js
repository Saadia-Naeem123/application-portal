const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an express-validator chain; turns collected errors into a
// single ApiError so every validation failure has the same response shape.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(400, 'Validation failed', formatted));
};

module.exports = validate;
