const express = require('express');
const jobController = require('../controllers/job.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Lets an administrator run the hourly reminder/escalation sweep on demand —
// handy for testing and demos without waiting for the cron schedule to tick.
router.post('/reminders/run', authenticate, requireRole(ROLES.ADMIN), jobController.runReminders);
router.post('/escalations/run', authenticate, requireRole(ROLES.ADMIN), jobController.runEscalations);

module.exports = router;
