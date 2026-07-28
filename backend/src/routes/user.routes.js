const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const {
  changePasswordValidator,
  updateProfileValidator,
  updateMySupervisorValidator,
  adminCreateUserValidator,
  adminUpdateUserValidator,
  updateDepartmentHeadFlagValidator,
} = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Public — powers the registration form's supervisor dropdown.
router.get('/supervisors', userController.listSupervisors);

// Authenticated — self-service profile management.
router.get('/me', authenticate, userController.getMe);

// Academic Supervisor Portal — assigned students, before /:id-style admin
// routes so it can't be mistaken for a user id lookup. Admin also has
// "View Assigned Students" per the role permission matrix (system-wide,
// or scoped to one supervisor via ?supervisorId=).
router.get(
  '/my-students',
  authenticate,
  requireRole(ROLES.ACADEMIC_SUPERVISOR, ROLES.ADMIN),
  userController.listMyStudents
);
router.patch('/me', authenticate, updateProfileValidator, validate, userController.updateMe);
router.patch('/me/password', authenticate, changePasswordValidator, validate, userController.changeMyPassword);
// Self-service — any role picks their own supervisor/authority by email.
router.patch(
  '/me/supervisor',
  authenticate,
  updateMySupervisorValidator,
  validate,
  userController.updateMySupervisor
);

// Admin-only — user management.
router.get('/', authenticate, requireRole(ROLES.ADMIN), userController.listUsers);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  adminCreateUserValidator,
  validate,
  userController.adminCreateUser
);
// Bulk action bar on the user table — registered before '/:id' so
// 'bulk-status' is never mistaken for a user id.
router.patch('/bulk-status', authenticate, requireRole(ROLES.ADMIN), userController.bulkUpdateStatus);
// Single-user detail page — registered after '/me' and '/my-students' above,
// so those aren't swallowed by this ':id' pattern.
router.get('/:id', authenticate, requireRole(ROLES.ADMIN), userController.getUserDetail);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  adminUpdateUserValidator,
  validate,
  userController.adminUpdateUser
);
router.patch('/:id/role', authenticate, requireRole(ROLES.ADMIN), userController.updateUserRole);
router.patch('/:id/status', authenticate, requireRole(ROLES.ADMIN), userController.updateUserStatus);
router.patch(
  '/:id/supervisor-flag',
  authenticate,
  requireRole(ROLES.ADMIN),
  userController.updateSupervisorFlag
);
router.post(
  '/:id/reset-password',
  authenticate,
  requireRole(ROLES.ADMIN),
  userController.adminResetPassword
);
router.patch(
  '/:id/department-head-flag',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateDepartmentHeadFlagValidator,
  validate,
  userController.updateDepartmentHeadFlag
);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), userController.removeUser);

module.exports = router;
