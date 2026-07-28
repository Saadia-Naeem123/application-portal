const express = require('express');
const permissionController = require('../controllers/permission.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { setPermissionValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.ADMIN), permissionController.listPermissions);
router.put(
  '/:role/:resource',
  authenticate,
  requireRole(ROLES.ADMIN),
  setPermissionValidator,
  validate,
  permissionController.setPermission
);

module.exports = router;
