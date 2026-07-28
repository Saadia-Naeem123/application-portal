const { generateApplicationNumber } = require('../../src/utils/applicationNumber');

describe('generateApplicationNumber', () => {
  it('matches the APP-YYYYMM-XXXXXX format', () => {
    const num = generateApplicationNumber(new Date(2026, 6, 24));
    expect(num).toMatch(/^APP-202607-[0-9A-F]{6}$/);
  });

  it('encodes the given year and month', () => {
    expect(generateApplicationNumber(new Date(2026, 0, 1))).toMatch(/^APP-202601-/);
    expect(generateApplicationNumber(new Date(2025, 11, 1))).toMatch(/^APP-202512-/);
  });

  it('generates distinct suffixes across calls (collision resistance)', () => {
    const date = new Date(2026, 6, 24);
    const numbers = new Set(Array.from({ length: 200 }, () => generateApplicationNumber(date)));
    // Astronomically unlikely to collide in 200 draws from a 16.7M keyspace.
    expect(numbers.size).toBe(200);
  });
});
