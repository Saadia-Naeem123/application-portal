const express = require('express');
const auditLogController = require('../controllers/auditLog.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.ADMIN), auditLogController.listAuditLogs);

module.exports = router;
