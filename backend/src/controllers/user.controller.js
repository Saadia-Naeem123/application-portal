const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const auditLogService = require('../services/auditLog.service');
const { ROLES } = require('../constants/roles');

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...authService.PUBLIC_USER_FIELDS,
      supervisor: { select: { id: true, fullName: true, email: true } },
    },
  });
  res.status(200).json(new ApiResponse(200, 'Profile fetched', { user }));
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, department, program, semester } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fullName, phoneNumber, department, program, semester },
    select: authService.PUBLIC_USER_FIELDS,
  });

  res.status(200).json(new ApiResponse(200, 'Profile updated', { user }));
});

const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, 'Password changed successfully'));
});

// Self-service — any role can set/change/clear who reviews their
// applications by entering that person's registered portal email, instead
// of it being fixed at registration or admin-only. Everything downstream
// (routing, SLAs, approvals) keeps reading this same supervisorId field, so
// the rest of the application flow is unaffected.
const updateMySupervisor = asyncHandler(async (req, res) => {
  const { supervisorEmail } = req.body;
  const user = await authService.updateMySupervisor(req.user.id, supervisorEmail || null);

  await auditLogService.record(req, {
    category: 'USER',
    action: 'SUPERVISOR_SELF_ASSIGNED',
    targetType: 'User',
    targetId: user.id,
    details: supervisorEmail
      ? `Set reviewing authority to ${supervisorEmail}`
      : 'Cleared reviewing authority',
  });

  res.status(200).json(new ApiResponse(200, 'Reviewing authority updated', { user }));
});

// Public: powers the "Academic Supervisor" dropdown on the registration form.
const listSupervisors = asyncHandler(async (req, res) => {
  const supervisors = await prisma.user.findMany({
    where: { role: ROLES.ACADEMIC_SUPERVISOR, isActiveSupervisor: true, isActive: true },
    select: { id: true, fullName: true, department: true },
    orderBy: { fullName: 'asc' },
  });
  res.status(200).json(new ApiResponse(200, 'Active supervisors fetched', { supervisors }));
});

// Academic Supervisor Portal — "Students" tab: the students who selected
// this supervisor at registration, plus how many applications each of them
// has routed through this supervisor. Read-only: a supervisor can view
// their students but never edit student data (that stays admin-only via
// adminUpdateUser).
//
// Admin also has "View Assigned Students" per the role permission matrix,
// scoped to "complete" (system-wide) rather than "assigned" like a
// supervisor — so an admin hitting this route with no filter sees every
// student that has a supervisor, and can narrow to one supervisor's
// caseload via ?supervisorId=. A non-admin may only ever see their own.
const listMyStudents = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const { supervisorId: requestedSupervisorId } = req.query;

  if (!isAdmin && requestedSupervisorId && requestedSupervisorId !== req.user.id) {
    throw new ApiError(403, "You do not have permission to view another supervisor's students");
  }

  // Supervisors are always scoped to themselves; admins may scope to a
  // specific supervisor or, if omitted, see everyone's assigned students.
  const targetSupervisorId = isAdmin ? requestedSupervisorId || undefined : req.user.id;
  const scopedToAll = isAdmin && !targetSupervisorId;

  const students = await prisma.user.findMany({
    where: {
      role: ROLES.STUDENT,
      supervisorId: scopedToAll ? { not: null } : targetSupervisorId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      registrationNumber: true,
      department: true,
      program: true,
      semester: true,
      phoneNumber: true,
      isActive: true,
      createdAt: true,
      ...(scopedToAll
        ? { supervisor: { select: { id: true, fullName: true, email: true } } }
        : {}),
    },
    orderBy: { fullName: 'asc' },
  });

  const counts = await prisma.application.groupBy({
    by: ['applicantId'],
    where: {
      applicantId: { in: students.map((s) => s.id) },
      ...(scopedToAll ? {} : { supervisorId: targetSupervisorId }),
    },
    _count: { _all: true },
  });
  const countByStudentId = Object.fromEntries(counts.map((c) => [c.applicantId, c._count._all]));

  const withCounts = students.map((s) => ({ ...s, applicationsCount: countByStudentId[s.id] || 0 }));

  res.status(200).json(new ApiResponse(200, 'Assigned students fetched', { students: withCounts }));
});

// --- Admin-only user management ---

const listUsers = asyncHandler(async (req, res) => {
  const { role, department, search, status, sortBy, sortDir, page = 1, pageSize = 20 } = req.query;
  const where = {
    ...(role ? { role } : {}),
    ...(department ? { department } : {}),
    ...(status === 'active' ? { isActive: true } : status === 'locked' ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { employeeId: { contains: search, mode: 'insensitive' } },
            { registrationNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const ALLOWED_SORT_FIELDS = ['createdAt', 'fullName', 'email', 'role'];
  const orderField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortDir === 'asc' ? 'asc' : 'desc';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: authService.PUBLIC_USER_FIELDS,
      orderBy: { [orderField]: orderDirection },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json(new ApiResponse(200, 'Users fetched', { users, total, page: Number(page), pageSize: Number(pageSize) }));
});

// Admin — single user detail (profile card + quick facts for the detail page).
const getUserDetail = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...authService.PUBLIC_USER_FIELDS,
      supervisor: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.status(200).json(new ApiResponse(200, 'User fetched', { user }));
});

// Admin — bulk activate/deactivate, used by the user table's bulk-action bar.
const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || typeof isActive !== 'boolean') {
    throw new ApiError(400, 'ids (array) and isActive (boolean) are required');
  }
  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { isActive } });
  await auditLogService.record(req, {
    category: 'USER',
    action: isActive ? 'USER_BULK_ACTIVATED' : 'USER_BULK_DEACTIVATED',
    targetType: 'User',
    targetId: ids.join(','),
    details: `${ids.length} user(s) ${isActive ? 'activated' : 'locked'} in bulk`,
  });
  res.status(200).json(new ApiResponse(200, 'Users updated', { updated: ids.length }));
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: authService.PUBLIC_USER_FIELDS,
  });
  await auditLogService.record(req, {
    category: 'USER',
    action: 'USER_ROLE_CHANGED',
    targetType: 'User',
    targetId: user.id,
    details: `Role changed to ${role} for ${user.email}`,
  });
  res.status(200).json(new ApiResponse(200, 'User role updated', { user }));
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) },
    select: authService.PUBLIC_USER_FIELDS,
  });
  await auditLogService.record(req, {
    category: 'USER',
    action: isActive ? 'USER_ACTIVATED' : 'USER_LOCKED',
    targetType: 'User',
    targetId: user.id,
    details: `${user.email} ${isActive ? 'activated' : 'locked/deactivated'}`,
  });
  res.status(200).json(new ApiResponse(200, `User ${isActive ? 'activated' : 'deactivated'}`, { user }));
});

const updateSupervisorFlag = asyncHandler(async (req, res) => {
  const { isActiveSupervisor } = req.body;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.role !== ROLES.ACADEMIC_SUPERVISOR) {
    throw new ApiError(400, 'Target user is not an Academic Supervisor');
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActiveSupervisor: Boolean(isActiveSupervisor) },
    select: authService.PUBLIC_USER_FIELDS,
  });
  await auditLogService.record(req, {
    category: 'USER',
    action: isActiveSupervisor ? 'SUPERVISOR_ACTIVATED' : 'SUPERVISOR_DEACTIVATED',
    targetType: 'User',
    targetId: user.id,
    details: `${user.email} ${isActiveSupervisor ? 'activated' : 'deactivated'} as a supervisor`,
  });
  res.status(200).json(new ApiResponse(200, 'Supervisor status updated', { user }));
});

// Marks/unmarks a Department Officer as their department's head — the
// authorized reviewer for the DEPARTMENT_HEAD escalation stage (Phase 6).
const updateDepartmentHeadFlag = asyncHandler(async (req, res) => {
  const { isDepartmentHead } = req.body;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.role !== ROLES.DEPARTMENT_OFFICER) {
    throw new ApiError(400, 'Target user is not a Department Officer');
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isDepartmentHead: Boolean(isDepartmentHead) },
    select: authService.PUBLIC_USER_FIELDS,
  });
  res.status(200).json(new ApiResponse(200, 'Department head status updated', { user }));
});

// Admin-created accounts (staff, supervisors, department officers, deans, or
// additional admins) skip email verification and self-registration — the
// admin vouches for the account directly. A temporary password is generated
// and returned once so the admin can hand it to the user; it is never
// stored or emailed in plaintext.
const adminCreateUser = asyncHandler(async (req, res) => {
  const { user, temporaryPassword } = await authService.adminCreateUser(req.body);
  await auditLogService.record(req, {
    category: 'USER',
    action: 'USER_CREATED',
    targetType: 'User',
    targetId: user.id,
    details: `Created ${user.email} as ${user.role}`,
  });
  res
    .status(201)
    .json(new ApiResponse(201, 'User created', { user, temporaryPassword }));
});

const adminUpdateUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    phoneNumber,
    department,
    program,
    semester,
    employeeId,
    registrationNumber,
  } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { fullName, phoneNumber, department, program, semester, employeeId, registrationNumber },
    select: authService.PUBLIC_USER_FIELDS,
  });
  await auditLogService.record(req, {
    category: 'USER',
    action: 'USER_UPDATED',
    targetType: 'User',
    targetId: user.id,
    details: `Updated profile fields for ${user.email}`,
  });
  res.status(200).json(new ApiResponse(200, 'User updated', { user }));
});

// Admin Portal — "Reset passwords". Returns the new temporary password once;
// like account creation, it's never stored or emailed in plaintext.
const adminResetPassword = asyncHandler(async (req, res) => {
  const { user, temporaryPassword } = await authService.adminResetPassword(req.params.id);
  await auditLogService.record(req, {
    category: 'USER',
    action: 'USER_PASSWORD_RESET',
    targetType: 'User',
    targetId: user.id,
    details: `Password reset for ${user.email}`,
  });
  res.status(200).json(new ApiResponse(200, 'Password reset', { user, temporaryPassword }));
});

// Users are soft-deleted (isActive: false) rather than hard-deleted, since
// applications, comments, and audit records may reference them.
const removeUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false, isActiveSupervisor: false },
    select: authService.PUBLIC_USER_FIELDS,
  });
  await auditLogService.record(req, {
    category: 'USER',
    action: 'USER_DELETED',
    targetType: 'User',
    targetId: user.id,
    details: `Removed ${user.email}`,
  });
  res.status(200).json(new ApiResponse(200, 'User removed', { user }));
});

module.exports = {
  getMe,
  updateMe,
  changeMyPassword,
  updateMySupervisor,
  listSupervisors,
  listMyStudents,
  listUsers,
  getUserDetail,
  bulkUpdateStatus,
  updateUserRole,
  updateUserStatus,
  updateSupervisorFlag,
  updateDepartmentHeadFlag,
  adminCreateUser,
  adminUpdateUser,
  adminResetPassword,
  removeUser,
};
