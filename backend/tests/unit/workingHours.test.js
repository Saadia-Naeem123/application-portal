const { isWorkingDay, addWorkingHours, workingHoursElapsed, toDateKey } = require('../../src/utils/workingHours');

describe('workingHours utils', () => {
  describe('toDateKey', () => {
    it('formats a date as Y-M-D, zero-padded', () => {
      expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(toDateKey(new Date(2026, 10, 30))).toBe('2026-11-30');
    });
  });

  describe('isWorkingDay', () => {
    const noHolidays = new Set();
    const noBreaks = [];

    it('rejects Saturdays and Sundays', () => {
      // 2026-07-25 is a Saturday, 2026-07-26 a Sunday.
      expect(isWorkingDay(new Date(2026, 6, 25), noHolidays, noBreaks)).toBe(false);
      expect(isWorkingDay(new Date(2026, 6, 26), noHolidays, noBreaks)).toBe(false);
    });

    it('accepts an ordinary weekday', () => {
      // 2026-07-24 is a Friday.
      expect(isWorkingDay(new Date(2026, 6, 24), noHolidays, noBreaks)).toBe(true);
    });

    it('rejects a date that is a registered holiday', () => {
      const holidays = new Set(['2026-07-24']);
      expect(isWorkingDay(new Date(2026, 6, 24), holidays, noBreaks)).toBe(false);
    });

    it('rejects a date within a semester break', () => {
      const breaks = [{ startDate: new Date(2026, 6, 20), endDate: new Date(2026, 6, 30) }];
      expect(isWorkingDay(new Date(2026, 6, 24), noHolidays, breaks)).toBe(false);
    });
  });

  describe('addWorkingHours', () => {
    it('adds hours within a single working day without skipping', () => {
      // Friday 9am + 3 working hours -> Friday 12pm.
      const start = new Date(2026, 6, 24, 9, 0, 0);
      const result = addWorkingHours(start, 3, new Set(), []);
      expect(result.getDay()).toBe(5); // still Friday
      expect(result.getHours()).toBe(12);
    });

    it('skips the weekend when the deadline would otherwise fall on it', () => {
      // Friday 9am + 16 working hours should land on Monday, not Sat/Sun.
      const start = new Date(2026, 6, 24, 9, 0, 0);
      const result = addWorkingHours(start, 16, new Set(), []);
      expect(result.getDay()).not.toBe(0);
      expect(result.getDay()).not.toBe(6);
    });

    it('skips a configured holiday entirely', () => {
      const start = new Date(2026, 6, 23, 9, 0, 0); // Thursday
      const holidays = new Set(['2026-07-24']); // Friday is a holiday
      const withoutHoliday = addWorkingHours(start, 10, new Set(), []);
      const withHoliday = addWorkingHours(start, 10, holidays, []);
      // Because Friday is skipped, the with-holiday result must land later
      // in wall-clock time than the without-holiday result.
      expect(withHoliday.getTime()).toBeGreaterThan(withoutHoliday.getTime());
    });

    it('terminates instead of looping forever on a pathological calendar', () => {
      // Simulate "every day is a holiday" by using a predicate that never
      // returns a working day — addWorkingHours has no such hook, so we
      // approximate by giving it a huge hour count and confirming it still
      // returns (bounded by MAX_ITERATIONS) rather than hanging the test.
      const start = new Date(2026, 6, 24, 9, 0, 0);
      const result = addWorkingHours(start, 100000, new Set(), []);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('workingHoursElapsed', () => {
    it('returns 0 when end is not after start', () => {
      const t = new Date(2026, 6, 24, 9, 0, 0);
      expect(workingHoursElapsed(t, t, new Set(), [])).toBe(0);
      expect(workingHoursElapsed(t, new Date(t.getTime() - 1000), new Set(), [])).toBe(0);
    });

    it('counts only working hours between two timestamps', () => {
      // Friday 9am -> Friday 5pm = 8 working hours, no weekend involved.
      const start = new Date(2026, 6, 24, 9, 0, 0);
      const end = new Date(2026, 6, 24, 17, 0, 0);
      expect(workingHoursElapsed(start, end, new Set(), [])).toBe(8);
    });

    it('excludes weekend hours from the elapsed count', () => {
      // Friday 9am -> Monday 9am should be less than the 72 raw hours,
      // since Sat/Sun don't count.
      const start = new Date(2026, 6, 24, 9, 0, 0);
      const end = new Date(2026, 6, 27, 9, 0, 0);
      const elapsed = workingHoursElapsed(start, end, new Set(), []);
      expect(elapsed).toBeLessThan(72);
      expect(elapsed).toBe(24); // just the Friday, weekend excluded
    });
  });
});
