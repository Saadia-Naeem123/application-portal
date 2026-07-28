const { body, param } = require('express-validator');
const { ALL_ROLES } = require('../constants/roles');
const { ALL_PRIORITIES } = require('../constants/priority');
const { ALL_HOLIDAY_TYPES } = require('../constants/holidayType');
const { ALL_NOTIFICATION_TYPES } = require('../constants/notificationType');

// Self-registration only ever collects basic details — no role and no
// supervisor selection. Role defaults to STUDENT server-side; an admin
// assigns the real role afterwards (see updateUserRole), and the user picks
// their own supervisor/authority later from their profile (see
// updateMySupervisorValidator below).
const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('A valid university email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('phoneNumber').optional({ checkFalsy: true }).trim(),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  param('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

const updateProfileValidator = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phoneNumber').optional({ checkFalsy: true }).trim(),
  body('department').optional({ checkFalsy: true }).trim(),
  body('program').optional({ checkFalsy: true }).trim(),
  body('semester').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }),
];

// Any authenticated user picks their own supervisor/reviewing authority by
// entering that person's registered portal email — an empty string clears
// the current selection.
const updateMySupervisorValidator = [
  body('supervisorEmail')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Enter the registered email address of a valid user')
    .normalizeEmail(),
];

// --- Phase 3: Administration & Master Data ---

const createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required'),
  body('description').optional({ checkFalsy: true }).trim(),
];

const updateDepartmentValidator = [
  param('id').isUUID().withMessage('Invalid department id'),
  body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Department code cannot be empty'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const createApplicationTypeValidator = [
  body('name').trim().notEmpty().withMessage('Application type name is required'),
  body('code').trim().notEmpty().withMessage('Application type code is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('departmentId').isUUID().withMessage('A valid departmentId is required'),
  body('requiresSupervisorApproval').optional().isBoolean(),
  body('defaultPriority').optional().isIn(ALL_PRIORITIES).withMessage('Invalid priority'),
  body('slaWorkingHours').optional().isInt({ min: 1 }).withMessage('slaWorkingHours must be a positive integer'),
];

const updateApplicationTypeValidator = [
  param('id').isUUID().withMessage('Invalid application type id'),
  body('name').optional().trim().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('description').optional({ checkFalsy: true }).trim(),
  body('departmentId').optional().isUUID().withMessage('Invalid departmentId'),
  body('requiresSupervisorApproval').optional().isBoolean(),
  body('defaultPriority').optional().isIn(ALL_PRIORITIES).withMessage('Invalid priority'),
  body('slaWorkingHours').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
];

const updateRoutingRuleValidator = [
  param('applicationTypeId').isUUID().withMessage('Invalid application type id'),
  body('departmentId').optional().isUUID().withMessage('Invalid departmentId'),
  body('requiresSupervisorApproval').optional().isBoolean(),
];

const createHolidayValidator = [
  body('name').trim().notEmpty().withMessage('Holiday name is required'),
  body('date').isISO8601().withMessage('A valid date is required'),
  body('type').optional().isIn(ALL_HOLIDAY_TYPES).withMessage('Invalid holiday type'),
];

const updateHolidayValidator = [
  param('id').isUUID().withMessage('Invalid holiday id'),
  body('name').optional().trim().notEmpty(),
  body('date').optional().isISO8601().withMessage('A valid date is required'),
  body('type').optional().isIn(ALL_HOLIDAY_TYPES).withMessage('Invalid holiday type'),
];

const createWorkingSaturdayValidator = [
  body('date').isISO8601().withMessage('A valid date is required'),
  body('reason').optional({ checkFalsy: true }).trim(),
];

const updateSystemSettingsValidator = [
  body('reminderThresholdHours').optional().isArray().withMessage('reminderThresholdHours must be an array of hours'),
  body('reminderThresholdHours.*').optional().isInt({ min: 1 }).withMessage('Each reminder threshold must be a positive number of hours'),
  body('finalWarningMarginHours').optional().isInt({ min: 1 }).withMessage('finalWarningMarginHours must be a positive number'),
  body('workingDayStartHour').optional().isInt({ min: 0, max: 23 }),
  body('workingDayEndHour').optional().isInt({ min: 0, max: 23 }),
  body('maxUploadSizeMb').optional().isInt({ min: 1, max: 100 }),
  body('universityName').optional({ checkFalsy: true }).trim(),
  body('universityContactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email'),
  body('supportPhone').optional({ checkFalsy: true }).trim(),
  body('passwordMinLength').optional().isInt({ min: 6, max: 32 }),
  body('sessionTimeoutMinutes').optional().isInt({ min: 5, max: 1440 }),
  body('backupFrequency').optional().isIn(['HOURLY', 'DAILY', 'WEEKLY']).withMessage('Invalid backup frequency'),
  body('backupRetentionDays').optional().isInt({ min: 1, max: 3650 }),
];

const createSemesterBreakValidator = [
  body('name').trim().notEmpty().withMessage('Semester break name is required'),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
  body('endDate').isISO8601().withMessage('A valid end date is required'),
];

const updateSemesterBreakValidator = [
  param('id').isUUID().withMessage('Invalid semester break id'),
  body('name').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isActive').optional().isBoolean(),
];

const setPermissionValidator = [
  param('role').isIn(ALL_ROLES).withMessage('Invalid role'),
  param('resource').trim().notEmpty().withMessage('Resource is required'),
  body('canView').optional().isBoolean(),
  body('canEdit').optional().isBoolean(),
];

const adminCreateUserValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').isIn(ALL_ROLES).withMessage('Invalid role'),
  body('registrationNumber').optional({ checkFalsy: true }).trim(),
  body('employeeId').optional({ checkFalsy: true }).trim(),
  body('department').optional({ checkFalsy: true }).trim(),
  body('program').optional({ checkFalsy: true }).trim(),
  body('semester').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }),
  body('phoneNumber').optional({ checkFalsy: true }).trim(),
  body('supervisorId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid supervisor selection'),
  body('isActiveSupervisor').optional().isBoolean(),
];

const adminUpdateUserValidator = [
  param('id').isUUID().withMessage('Invalid user id'),
  body('fullName').optional().trim().notEmpty(),
  body('phoneNumber').optional({ checkFalsy: true }).trim(),
  body('department').optional({ checkFalsy: true }).trim(),
  body('program').optional({ checkFalsy: true }).trim(),
  body('semester').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }),
  body('employeeId').optional({ checkFalsy: true }).trim(),
  body('registrationNumber').optional({ checkFalsy: true }).trim(),
];

// --- Phase 4: Application Submission ---

const createApplicationValidator = [
  body('applicationTypeId').isUUID().withMessage('A valid applicationTypeId is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(ALL_PRIORITIES).withMessage('Invalid priority'),
  body('saveAsDraft').optional().isBoolean(),
];

const updateApplicationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('applicationTypeId').optional().isUUID().withMessage('Invalid applicationTypeId'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('priority').optional().isIn(ALL_PRIORITIES).withMessage('Invalid priority'),
];

// --- Phase 5: Workflow & Routing Engine ---

const approveApplicationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').optional({ checkFalsy: true }).trim(),
];

const rejectApplicationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').trim().notEmpty().withMessage('A reason is required to reject an application'),
];

const requestInfoValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').trim().notEmpty().withMessage('Please specify what additional information is required'),
];

const provideInfoValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').optional({ checkFalsy: true }).trim(),
];

const forwardApplicationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('toUserId').isUUID().withMessage('A valid toUserId is required'),
  body('remarks').optional({ checkFalsy: true }).trim(),
];

// Phase 10 — Dean Portal
const returnToDepartmentValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').trim().notEmpty().withMessage('Please explain why this application is being returned'),
];

const requestInvestigationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('remarks').trim().notEmpty().withMessage('Please specify what needs to be investigated'),
];

const addCommentValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('message').trim().notEmpty().withMessage('Comment message is required'),
];

// Phase 7 — Communication & Notification System
const updateNotificationPreferencesValidator = [
  body('emailEnabled').optional().isBoolean().withMessage('emailEnabled must be true or false'),
  body('inAppEnabled').optional().isBoolean().withMessage('inAppEnabled must be true or false'),
  body('smsEnabled').optional().isBoolean().withMessage('smsEnabled must be true or false'),
  body('mutedTypes').optional().isArray().withMessage('mutedTypes must be an array of notification types'),
  body('mutedTypes.*').optional().isIn(ALL_NOTIFICATION_TYPES).withMessage('Unknown notification type in mutedTypes'),
];

const escalateApplicationValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('reason').optional({ checkFalsy: true }).trim(),
];

const updateDepartmentHeadFlagValidator = [
  param('id').isUUID().withMessage('Invalid user id'),
  body('isDepartmentHead').isBoolean().withMessage('isDepartmentHead must be a boolean'),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  updateMySupervisorValidator,
  createDepartmentValidator,
  updateDepartmentValidator,
  createApplicationTypeValidator,
  updateApplicationTypeValidator,
  updateRoutingRuleValidator,
  createHolidayValidator,
  updateHolidayValidator,
  createWorkingSaturdayValidator,
  updateSystemSettingsValidator,
  createSemesterBreakValidator,
  updateSemesterBreakValidator,
  setPermissionValidator,
  adminCreateUserValidator,
  adminUpdateUserValidator,
  createApplicationValidator,
  updateApplicationValidator,
  approveApplicationValidator,
  rejectApplicationValidator,
  requestInfoValidator,
  provideInfoValidator,
  forwardApplicationValidator,
  returnToDepartmentValidator,
  requestInvestigationValidator,
  addCommentValidator,
  escalateApplicationValidator,
  updateDepartmentHeadFlagValidator,
  updateNotificationPreferencesValidator,
};
