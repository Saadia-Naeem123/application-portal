const cron = require('node-cron');
const { nodeEnv, scheduler } = require('../config/env');
const { runReminderJob } = require('./reminder.job');
const { runEscalationJob } = require('./escalation.job');

// "Every Hour → Check Pending Applications" per the Reminder Service /
// Escalation Engine tech flow. Escalation runs first so a just-escalated
// application doesn't also get an overdue reminder in the same tick; the
// reminder job only ever looks at applications that still have time left.
async function runHourlySweep() {
  try {
    await runEscalationJob();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[jobs:scheduler] Escalation sweep failed:', err);
  }
  try {
    await runReminderJob();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[jobs:scheduler] Reminder sweep failed:', err);
  }
}

let task = null;

function startSchedulers() {
  if (!scheduler.enabled) {
    // eslint-disable-next-line no-console
    console.log('[jobs:scheduler] Disabled via SCHEDULER_ENABLED — skipping cron registration.');
    return;
  }
  if (nodeEnv === 'test') return;

  task = cron.schedule(scheduler.cronExpression, runHourlySweep);
  // eslint-disable-next-line no-console
  console.log(`[jobs:scheduler] Reminder/escalation sweep scheduled (${scheduler.cronExpression}).`);
}

function stopSchedulers() {
  if (task) task.stop();
}

module.exports = { startSchedulers, stopSchedulers, runHourlySweep };
