const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../utils/validators');
const { body } = require('express-validator');

const router = express.Router();

// Narrower limit on the login endpoint alone, keyed by the submitted email
// address (in addition to the app-wide, IP-scoped authLimiter mounted in
// app.js) — this specifically slows down credential-stuffing / password
// guessing against a single account even when attempts are spread across
// many source IPs.
const loginAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.body && req.body.email ? String(req.body.email).toLowerCase() : req.ip),
  message: {
    success: false,
    message: 'Too many login attempts for this account. Please try again later.',
    errors: [],
  },
});

router.post('/register', registerValidator, validate, authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('A valid email is required')],
  validate,
  authController.resendVerification
);
router.post('/login', loginAttemptLimiter, loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, validate, authController.resetPassword);

module.exports = router;
