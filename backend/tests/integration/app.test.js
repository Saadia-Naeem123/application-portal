require('../setup-env');
const request = require('supertest');

// The DB is mocked at the module boundary so these integration tests never
// need a real PostgreSQL instance — app.js and its routers still load and
// wire up exactly as they do in production.
jest.mock('../../src/config/db', () => ({
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  $disconnect: jest.fn(),
}));

const app = require('../../src/app');

describe('app wiring', () => {
  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'OK' });
  });

  it('sets core security headers via helmet', async () => {
    const res = await request(app).get('/health');
    // A representative sample of helmet's default header set.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined(); // helmet hides Express fingerprint
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('rejects a request body over the configured size limit', async () => {
    const bigPayload = { data: 'x'.repeat(2 * 1024 * 1024) }; // > 1mb limit
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(bigPayload)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(413);
  });

  it('rejects registration with an invalid email and weak password (input validation)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Test User',
      email: 'not-an-email',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects registration missing a required field (fullName)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.edu',
      password: 'validpass1',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app).get('/api/v1/applications');
    expect(res.status).toBe(401);
  });

  it('rejects a request with a malformed Authorization header', async () => {
    const res = await request(app).get('/api/v1/applications').set('Authorization', 'not-a-bearer-token');
    expect(res.status).toBe(401);
  });

  it('rejects a request with a forged/garbage JWT', async () => {
    const res = await request(app).get('/api/v1/applications').set('Authorization', 'Bearer totally.invalid.token');
    expect(res.status).toBe(401);
  });
});
