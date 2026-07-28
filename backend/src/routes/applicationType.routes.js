const express = require('express');
const applicationTypeController = require('../controllers/applicationType.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createApplicationTypeValidator,
  updateApplicationTypeValidator,
} = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Authenticated users need the active list to populate the "Application Type"
// dropdown on the submission form; only ADMIN can mutate the master data.
router.get('/', authenticate, applicationTypeController.listApplicationTypes);
router.get('/:id', authenticate, applicationTypeController.getApplicationType);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  createApplicationTypeValidator,
  validate,
  applicationTypeController.createApplicationType
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateApplicationTypeValidator,
  validate,
  applicationTypeController.updateApplicationType
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  applicationTypeController.deactivateApplicationType
);

module.exports = router;
