require('../setup-env');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const mockPrisma = {
  user: { findUnique: jest.fn() },
  refreshToken: { create: jest.fn(), findFirst: jest.fn() },
  $disconnect: jest.fn(),
};

jest.mock('../../src/config/db', () => mockPrisma);

const app = require('../../src/app');

const PASSWORD = 'correct-password1';

async function seedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4); // low cost factor: tests only
  return {
    id: 'user-1',
    fullName: 'Jane Student',
    email: 'jane@example.edu',
    passwordHash,
    role: 'STUDENT',
    isActive: true,
    isEmailVerified: true,
    ...overrides,
  };
}

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.refreshToken.create.mockResolvedValue({});
  });

  it('logs in successfully with correct credentials', async () => {
    const user = await seedUser();
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined(); // never leak the hash
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i); // cookie not readable by JS
  });

  it('rejects a wrong password with a generic message', async () => {
    const user = await seedUser();
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'totally-wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('gives the same error/status for a non-existent account as for a wrong password (no account enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.edu', password: 'whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('blocks login for a deactivated account even with the correct password', async () => {
    const user = await seedUser({ isActive: false });
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(403);
  });

  it('blocks login for an unverified email even with the correct password', async () => {
    const user = await seedUser({ isEmailVerified: false });
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const res = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(403);
  });

  it('rejects a login request missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@example.edu' });
    expect(res.status).toBe(400);
  });

  it('throttles repeated failed attempts against the same account', async () => {
    const user = await seedUser();
    mockPrisma.user.findUnique.mockResolvedValue(user);

    let lastStatus;
    // The per-account limiter allows 10 attempts per 15-minute window; the
    // 11th should be throttled regardless of the (still-wrong) credentials.
    for (let i = 0; i < 11; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrong-every-time' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
