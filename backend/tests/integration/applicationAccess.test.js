require('../setup-env');
const request = require('supertest');

const mockPrisma = {
  user: { findUnique: jest.fn() },
  application: { findUnique: jest.fn() },
  $disconnect: jest.fn(),
};

jest.mock('../../src/config/db', () => mockPrisma);

const app = require('../../src/app');
const { signAccessToken } = require('../../src/services/token.service');

const owner = { id: 'owner-1', role: 'STUDENT', isActive: true };
const otherStudent = { id: 'stranger-1', role: 'STUDENT', isActive: true };
const admin = { id: 'admin-1', role: 'ADMIN', isActive: true };

const application = {
  id: 'app-1',
  applicantId: owner.id,
  supervisorId: null,
  status: 'UNDER_DEPARTMENT_REVIEW',
  attachments: [],
};

function tokenFor(user) {
  return signAccessToken(user);
}

describe('GET /api/v1/applications/:id — authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.application.findUnique.mockResolvedValue(application);
  });

  it('allows the owning applicant to view their own application', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(owner);
    const res = await request(app)
      .get('/api/v1/applications/app-1')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);
    expect(res.status).toBe(200);
  });

  it('allows an admin to view any application', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(admin);
    const res = await request(app)
      .get('/api/v1/applications/app-1')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
  });

  it("returns 404 (not 403) when a different student requests someone else's application", async () => {
    // Deliberately 404, not 403 — so a stranger probing IDs can't learn
    // that a given application ID exists at all (see assertCanView).
    mockPrisma.user.findUnique.mockResolvedValue(otherStudent);
    const res = await request(app)
      .get('/api/v1/applications/app-1')
      .set('Authorization', `Bearer ${tokenFor(otherStudent)}`);
    expect(res.status).toBe(404);
  });

  it('rejects the request outright with no valid token', async () => {
    const res = await request(app).get('/api/v1/applications/app-1');
    expect(res.status).toBe(401);
  });

  it('rejects a token for a since-deactivated user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...owner, isActive: false });
    const res = await request(app)
      .get('/api/v1/applications/app-1')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/applications/:id/escalate — role restriction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a non-admin attempting the admin-only manual escalation route', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(owner);
    const res = await request(app)
      .patch('/api/v1/applications/app-1/escalate')
      .set('Authorization', `Bearer ${tokenFor(owner)}`)
      .send({ reason: 'test' });
    expect(res.status).toBe(403);
  });
});
