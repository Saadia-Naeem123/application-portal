const express = require('express');
const departmentController = require('../controllers/department.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createDepartmentValidator, updateDepartmentValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Authenticated users need the active list to populate application forms;
// only ADMIN can see inactive departments or mutate the master data.
router.get('/', authenticate, departmentController.listDepartments);
router.get('/:id', authenticate, departmentController.getDepartment);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  createDepartmentValidator,
  validate,
  departmentController.createDepartment
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateDepartmentValidator,
  validate,
  departmentController.updateDepartment
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  departmentController.deactivateDepartment
);

module.exports = router;
