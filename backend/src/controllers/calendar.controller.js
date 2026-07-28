const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const holidayService = require('../services/holiday.service');
const semesterBreakService = require('../services/semesterBreak.service');

// Powers the "Calendar Dashboard" deliverable: a single call that returns
// everything the university calendar needs to render (holidays + semester
// breaks), instead of the frontend juggling two separate fetches.
const getCalendar = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const [holidays, semesterBreaks] = await Promise.all([
    holidayService.listHolidays({ from, to }),
    semesterBreakService.listSemesterBreaks({ includeInactive: false }),
  ]);

  res.status(200).json(new ApiResponse(200, 'Calendar fetched', { holidays, semesterBreaks }));
});

module.exports = { getCalendar };
