require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    const msg = `[config] Environment variable ${key} is not set.`;
    if (nodeEnv === 'production') {
      // A missing secret in production isn't recoverable — better to crash
      // at boot than to run with an undefined JWT secret (which would sign
      // every access token with the literal string "undefined").
      // eslint-disable-next-line no-console
      console.error(msg + ' Refusing to start in production.');
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.warn(msg);
  }
}

if (
  nodeEnv === 'production' &&
  process.env.JWT_ACCESS_SECRET &&
  process.env.JWT_REFRESH_SECRET &&
  (process.env.JWT_ACCESS_SECRET.length < 32 ||
    process.env.JWT_REFRESH_SECRET.length < 32 ||
    process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET)
) {
  // eslint-disable-next-line no-console
  console.error(
    '[config] JWT_ACCESS_SECRET/JWT_REFRESH_SECRET must be distinct, high-entropy strings ' +
      '(32+ chars) in production. Refusing to start.'
  );
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv,
  // CLIENT_URL supports a comma-separated list (e.g. your production Vercel
  // domain plus Vercel preview-deployment URLs) so CORS isn't limited to a
  // single origin. Whitespace around entries is trimmed.
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  // Dev/test-only escape hatch: when true, newly registered accounts are
  // auto-verified and can log in immediately, skipping the "click the link
  // we emailed you" step. Handy for seeding dummy accounts across roles
  // without a working mail server. Hard-blocked in production below.
  skipEmailVerification: nodeEnv !== 'production' && process.env.SKIP_EMAIL_VERIFICATION === 'true',

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'University System <no-reply@university.edu>',
  },

  tokens: {
    emailVerificationExpiresHours: Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS) || 24,
    passwordResetExpiresHours: Number(process.env.PASSWORD_RESET_EXPIRES_HOURS) || 1,
  },

  // Phase 7 — Communication & Notification System (SMS channel).
  // Provider-agnostic: any HTTP SMS API that accepts a bearer token and a
  // {to, from, body} JSON payload works here. If left unconfigured, SMS
  // messages are logged to the console instead of sent — same "dev mode"
  // pattern as the email service — so the rest of the flow (preferences,
  // muting, notification creation) can be exercised without a real account.
  sms: {
    apiUrl: process.env.SMS_API_URL,
    apiKey: process.env.SMS_API_KEY,
    from: process.env.SMS_FROM,
  },

  // Phase 6 — Deadline, Reminder & Escalation Engine
  scheduler: {
    // Runs the "check pending applications" sweep on this cron schedule —
    // defaults to once an hour, per the tech flow ("Every Hour ↓ Check
    // Pending Applications"). Set SCHEDULER_ENABLED=false to disable
    // entirely (e.g. when running multiple API instances behind a load
    // balancer — only one process should run the scheduler).
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    cronExpression: process.env.SCHEDULER_CRON || '0 * * * *',
  },
};
