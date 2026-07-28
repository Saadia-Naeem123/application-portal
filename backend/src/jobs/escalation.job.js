const escalationService = require('../services/escalation.service');

async function runEscalationJob() {
  const results = await escalationService.runEscalationSweep();
  if (results.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[jobs:escalation] Processed ${results.length} overdue application(s).`);
  }
  return results;
}

module.exports = { runEscalationJob };
