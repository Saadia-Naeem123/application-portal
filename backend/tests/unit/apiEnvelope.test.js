const ApiError = require('../../src/utils/ApiError');
const ApiResponse = require('../../src/utils/ApiResponse');

describe('ApiError', () => {
  it('carries statusCode, message, and errors', () => {
    const err = new ApiError(400, 'Bad input', [{ field: 'email', message: 'invalid' }]);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err.success).toBe(false);
    expect(err.errors).toEqual([{ field: 'email', message: 'invalid' }]);
  });

  it('defaults errors to an empty array', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.errors).toEqual([]);
  });

  it('is a real Error instance with a stack trace', () => {
    const err = new ApiError(500, 'Boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.stack).toBeDefined();
  });
});

describe('ApiResponse', () => {
  it('marks success=true for 2xx/3xx status codes', () => {
    expect(new ApiResponse(200, 'OK').success).toBe(true);
    expect(new ApiResponse(201, 'Created').success).toBe(true);
    expect(new ApiResponse(299, 'Edge').success).toBe(true);
  });

  it('marks success=false for 4xx/5xx status codes', () => {
    expect(new ApiResponse(400, 'Bad').success).toBe(false);
    expect(new ApiResponse(500, 'Error').success).toBe(false);
  });

  it('defaults data to null when omitted', () => {
    const res = new ApiResponse(200, 'OK');
    expect(res.data).toBeNull();
  });

  it('carries through the provided data payload', () => {
    const res = new ApiResponse(200, 'OK', { id: 1 });
    expect(res.data).toEqual({ id: 1 });
  });
});
