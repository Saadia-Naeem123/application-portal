const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { runReminderJob } = require('../jobs/reminder.job');
const { runEscalationJob } = require('../jobs/escalation.job');

const runReminders = asyncHandler(async (req, res) => {
  const results = await runReminderJob();
  res.status(200).json(new ApiResponse(200, 'Reminder sweep completed', { results }));
});

const runEscalations = asyncHandler(async (req, res) => {
  const results = await runEscalationJob();
  res.status(200).json(new ApiResponse(200, 'Escalation sweep completed', { results }));
});

module.exports = { runReminders, runEscalations };
