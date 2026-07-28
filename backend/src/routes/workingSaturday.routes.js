const express = require('express');
const workingSaturdayController = require('../controllers/workingSaturday.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createWorkingSaturdayValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, workingSaturdayController.listWorkingSaturdays);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  createWorkingSaturdayValidator,
  validate,
  workingSaturdayController.createWorkingSaturday
);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), workingSaturdayController.deleteWorkingSaturday);

module.exports = router;
