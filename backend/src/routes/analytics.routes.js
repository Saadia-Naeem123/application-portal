const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const analyticsController = require('../controllers/analytics.controller');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticate);

// Every role gets a scoped overview (their own applications, their
// supervised applications, their department, or system-wide — see
// analytics.service.js#overviewScope) so this powers dashboard widgets for
// everyone, not just admins.
router.get('/overview', analyticsController.getOverview);

// Department/supervisor performance reports and exports are an
// administrative reporting feature — restricted accordingly.
router.get(
  '/departments',
  requireRole(ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER),
  analyticsController.getDepartmentReport
);

// Dean Portal dashboard aggregate — Dean/Admin only (Phase 10).
router.get('/dean-overview', requireRole(ROLES.ADMIN, ROLES.DEAN), analyticsController.getDeanOverview);

// Administrator Portal dashboard aggregate — Admin only.
router.get('/admin-overview', requireRole(ROLES.ADMIN), analyticsController.getAdminOverview);
router.get(
  '/supervisors',
  requireRole(ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER),
  analyticsController.getSupervisorReport
);
router.get(
  '/export',
  requireRole(ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER),
  analyticsController.exportReport
);

module.exports = router;
