require('../setup-env');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRawToken,
  hashToken,
} = require('../../src/services/token.service');

const user = { id: 'user-123', role: 'STUDENT' };

describe('token.service', () => {
  it('signs an access token that verifies back to the same subject and role', () => {
    const token = signAccessToken(user);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(user.id);
    expect(decoded.role).toBe(user.role);
  });

  it('signs a refresh token carrying only the subject', () => {
    const token = signRefreshToken(user);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(user.id);
    expect(decoded.role).toBeUndefined();
  });

  it('rejects a token signed with the wrong secret', () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: user.id, role: 'ADMIN' }, 'wrong-secret');
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('rejects an access token when verified as a refresh token (different secrets)', () => {
    const accessToken = signAccessToken(user);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('generates a sufficiently long, unpredictable raw token', () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(64); // 32 bytes hex-encoded
  });

  it('hashes a raw token deterministically (same input -> same hash)', () => {
    const raw = 'some-raw-token-value';
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it('produces a hash that never equals the raw token (nothing usable stored in plaintext)', () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).not.toBe(raw);
  });
});
