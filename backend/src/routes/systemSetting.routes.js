const express = require('express');
const systemSettingController = require('../controllers/systemSetting.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { updateSystemSettingsValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.ADMIN), systemSettingController.getSettings);
router.patch(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateSystemSettingsValidator,
  validate,
  systemSettingController.updateSettings
);

module.exports = router;
