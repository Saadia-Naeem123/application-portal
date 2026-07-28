const reminderService = require('../services/reminder.service');

// Wrapped so the cron entrypoint (and the admin "run now" endpoint) share
// the exact same logging/error-handling behavior.
async function runReminderJob() {
  const results = await reminderService.runReminderSweep();
  if (results.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[jobs:reminder] Sent ${results.length} reminder(s).`);
  }
  return results;
}

module.exports = { runReminderJob };
