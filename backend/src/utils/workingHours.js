// Working-Day Deadline Calculation (Phase 6).
//
// "72 working hours" means: walk the clock forward one hour at a time, but
// only count hours that fall on a working day — Saturdays, Sundays,
// university holidays, and (if configured) semester breaks are skipped
// entirely rather than merely shifting the finish line by a fixed offset.
// This keeps the logic simple and correct for any SLA size without needing
// a calendar library, at the cost of an hour-by-hour loop — perfectly fine
// for SLA windows measured in days, not months.
//
// These functions are pure (no DB access) so they're easy to unit test;
// callers load the holiday/semester-break data once via
// services/workingHours.service.js and pass it in.

function toDateKey(date) {
  // Local calendar date (Y-M-D), independent of time-of-day, used to check
  // holiday membership regardless of what time a holiday record was stored at.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

const EMPTY_SET = new Set();

function isWithinBreak(date, breaks) {
  return breaks.some((b) => date >= b.startDate && date <= b.endDate);
}

/**
 * @param {Date} date
 * @param {Set<string>} holidayDateKeys - Y-M-D strings
 * @param {{startDate: Date, endDate: Date}[]} breaks
 * @param {Set<string>} [workingSaturdayDateKeys] - Y-M-D strings for Saturdays
 *   an admin has specifically marked as working days (Holiday Calendar's
 *   "Working Saturdays"). Only ever overrides the Saturday-is-a-weekend
 *   default — Sundays and holidays are never overridden.
 */
function isWorkingDay(date, holidayDateKeys, breaks, workingSaturdayDateKeys = EMPTY_SET) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) return false;
  if (day === 6 && !workingSaturdayDateKeys.has(toDateKey(date))) return false;
  if (holidayDateKeys.has(toDateKey(date))) return false;
  if (isWithinBreak(date, breaks)) return false;
  return true;
}

/**
 * Advances `start` by `hours` working hours, skipping non-working days.
 * @returns {Date}
 */
function addWorkingHours(start, hours, holidayDateKeys, breaks, workingSaturdayDateKeys = EMPTY_SET) {
  let current = new Date(start.getTime());
  let remaining = hours;
  // Safety cap so a misconfigured calendar (e.g. every day marked a holiday)
  // can't spin this loop forever.
  let iterations = 0;
  const MAX_ITERATIONS = hours * 24 + 24 * 400;

  while (remaining > 0 && iterations < MAX_ITERATIONS) {
    current = new Date(current.getTime() + 60 * 60 * 1000);
    if (isWorkingDay(current, holidayDateKeys, breaks, workingSaturdayDateKeys)) {
      remaining -= 1;
    }
    iterations += 1;
  }
  return current;
}

/**
 * Counts how many working hours have elapsed between `start` and `end`
 * (end defaults to now). Used by the reminder scheduler to check thresholds.
 * @returns {number}
 */
function workingHoursElapsed(start, end, holidayDateKeys, breaks, workingSaturdayDateKeys = EMPTY_SET) {
  if (end <= start) return 0;
  let current = new Date(start.getTime());
  let elapsed = 0;
  let iterations = 0;
  const totalHours = Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000));
  const MAX_ITERATIONS = totalHours + 24 * 400;

  while (current < end && iterations < MAX_ITERATIONS) {
    const next = new Date(current.getTime() + 60 * 60 * 1000);
    if (isWorkingDay(next, holidayDateKeys, breaks, workingSaturdayDateKeys)) {
      elapsed += 1;
    }
    current = next;
    iterations += 1;
  }
  return elapsed;
}

module.exports = { isWorkingDay, addWorkingHours, workingHoursElapsed, toDateKey };
