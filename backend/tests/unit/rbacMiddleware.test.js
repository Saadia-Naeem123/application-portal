const requireRole = require('../../src/middleware/rbac.middleware');
const ApiError = require('../../src/utils/ApiError');

function mockRes() {
  return {};
}

describe('requireRole middleware', () => {
  it('calls next with a 401 ApiError when req.user is missing', () => {
    const middleware = requireRole('ADMIN');
    const next = jest.fn();
    middleware({ user: undefined }, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with a 403 ApiError when the user role is not allowed', () => {
    const middleware = requireRole('ADMIN', 'DEAN');
    const next = jest.fn();
    middleware({ user: { id: 'u1', role: 'STUDENT' }, originalUrl: '/x', method: 'GET' }, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it('calls next with no error when the role is allowed', () => {
    const middleware = requireRole('ADMIN', 'DEAN');
    const next = jest.fn();
    middleware({ user: { id: 'u1', role: 'DEAN' } }, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('accepts any one of several allowed roles', () => {
    const middleware = requireRole('ADMIN', 'DEAN', 'DEPARTMENT_OFFICER');
    const next = jest.fn();
    middleware({ user: { id: 'u2', role: 'DEPARTMENT_OFFICER' } }, mockRes(), next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
