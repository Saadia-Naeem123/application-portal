const prisma = require('../config/db');
const { addWorkingHours, workingHoursElapsed, toDateKey } = require('../utils/workingHours');

// Loads the full active calendar (all holidays + active semester breaks)
// once per calculation rather than re-querying per date check. The dataset
// is small (a university's holiday list), so no caching layer is needed —
// each deadline/elapsed calculation just reads it fresh, which also means
// a newly-added holiday takes effect immediately for future calculations,
// per the "no code changes required to update holidays" requirement.
async function loadCalendar() {
  const [holidays, semesterBreaks, workingSaturdays] = await Promise.all([
    prisma.holiday.findMany({ select: { date: true } }),
    prisma.semesterBreak.findMany({ where: { isActive: true }, select: { startDate: true, endDate: true } }),
    prisma.workingSaturday.findMany({ select: { date: true } }),
  ]);

  const holidayDateKeys = new Set(holidays.map((h) => toDateKey(h.date)));
  const breaks = semesterBreaks.map((b) => ({ startDate: b.startDate, endDate: b.endDate }));
  const workingSaturdayDateKeys = new Set(workingSaturdays.map((w) => toDateKey(w.date)));

  return { holidayDateKeys, breaks, workingSaturdayDateKeys };
}

async function computeDeadline(start, hours) {
  const { holidayDateKeys, breaks, workingSaturdayDateKeys } = await loadCalendar();
  return addWorkingHours(start, hours, holidayDateKeys, breaks, workingSaturdayDateKeys);
}

async function computeElapsedWorkingHours(start, end = new Date()) {
  const { holidayDateKeys, breaks, workingSaturdayDateKeys } = await loadCalendar();
  return workingHoursElapsed(start, end, holidayDateKeys, breaks, workingSaturdayDateKeys);
}

module.exports = { loadCalendar, computeDeadline, computeElapsedWorkingHours };
