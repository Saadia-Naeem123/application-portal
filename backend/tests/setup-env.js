// Runs before the test framework is set up (jest `setupFiles`), before any
// test file is required. Provides deterministic env vars so tests never
// depend on a developer's local .env — and never touch a real database or
// send real email/SMS.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-production-xxxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-production-yyyy';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.SCHEDULER_ENABLED = 'false';
