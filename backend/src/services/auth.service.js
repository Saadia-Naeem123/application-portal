const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRawToken,
  hashToken,
} = require('./token.service');
const { sendVerificationEmail, sendPasswordResetEmail, sendCredentialsEmail } = require('./email.service');
const envConfig = require('../config/env');
const { tokens: tokenConfig } = envConfig;
const logger = require('../utils/logger');

const PUBLIC_USER_FIELDS = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  registrationNumber: true,
  employeeId: true,
  department: true,
  program: true,
  semester: true,
  phoneNumber: true,
  supervisorId: true,
  isActiveSupervisor: true,
  isDepartmentHead: true,
  isEmailVerified: true,
  isActive: true,
  createdAt: true,
};

// Self-registration only ever asks for basic details (name, email, password,
// optional phone number) — no role and no supervisor selection. Every
// self-registered account starts as a STUDENT with no supervisor/authority
// assigned; an admin can change the role later (see updateUserRole), and the
// user assigns their own supervisor/authority afterwards from their profile
// (see updateMySupervisor).
async function registerUser(payload) {
  const { fullName, email, password, phoneNumber } = payload;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: ROLES.STUDENT,
      phoneNumber,
      isActiveSupervisor: false,
      isEmailVerified: envConfig.skipEmailVerification ? true : undefined,
    },
    select: PUBLIC_USER_FIELDS,
  });

  if (!envConfig.skipEmailVerification) {
    await issueEmailVerification(user);
  }

  return user;
}

// Admin-side equivalent of registerUser: skips email verification (the admin
// vouches for the account) and returns a generated temporary password instead
// of accepting one, so admins can't set/guess a user's password.
async function adminCreateUser(payload) {
  const {
    fullName,
    email,
    role,
    registrationNumber,
    employeeId,
    department,
    program,
    semester,
    phoneNumber,
    supervisorId,
    isActiveSupervisor,
  } = payload;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  if (role === ROLES.STUDENT && supervisorId) {
    const supervisor = await prisma.user.findFirst({
      where: { id: supervisorId, role: ROLES.ACADEMIC_SUPERVISOR, isActiveSupervisor: true },
    });
    if (!supervisor) {
      throw new ApiError(400, 'Selected supervisor is not a valid, active supervisor');
    }
  }

  const temporaryPassword = generateRawToken().slice(0, 12);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role,
      registrationNumber: role === ROLES.STUDENT ? registrationNumber : undefined,
      employeeId: role !== ROLES.STUDENT ? employeeId : undefined,
      department,
      program: role === ROLES.STUDENT ? program : undefined,
      semester: role === ROLES.STUDENT ? semester : undefined,
      phoneNumber,
      supervisorId: role === ROLES.STUDENT ? supervisorId : undefined,
      isActiveSupervisor: role === ROLES.ACADEMIC_SUPERVISOR ? Boolean(isActiveSupervisor) : false,
      isEmailVerified: true,
      isActive: true,
    },
    select: PUBLIC_USER_FIELDS,
  });

  // The admin hands over the account by email, not by copy/pasting the
  // password themselves — if the mail send fails, don't fail the whole
  // account creation; the temporary password is still returned once so the
  // admin can share it manually as a fallback.
  try {
    await sendCredentialsEmail(user, temporaryPassword);
  } catch (err) {
    logger.error(`Failed to email credentials to ${user.email}: ${err.message}`);
  }

  return { user, temporaryPassword };
}

// Admin Portal — "Reset passwords". Generates a brand-new temporary
// password (never accepts an admin-chosen one, same reasoning as
// adminCreateUser) and revokes the user's existing sessions so the old
// password/tokens stop working immediately.
async function adminResetPassword(userId) {
  const temporaryPassword = generateRawToken().slice(0, 12);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: PUBLIC_USER_FIELDS,
  });

  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });

  try {
    await sendCredentialsEmail(user, temporaryPassword, { isReset: true });
  } catch (err) {
    logger.error(`Failed to email reset credentials to ${user.email}: ${err.message}`);
  }

  return { user, temporaryPassword };
}

// Any authenticated user assigns their own supervisor/reviewing authority by
// entering that person's registered portal email — used across all roles,
// not just students. Passing an empty email clears the current selection.
// The rest of the application flow (routing, SLAs, approvals) is untouched —
// it already reads applicant.supervisorId at submission time.
async function updateMySupervisor(userId, supervisorEmail) {
  let supervisorId = null;

  if (supervisorEmail) {
    const target = await prisma.user.findUnique({ where: { email: supervisorEmail } });
    if (!target || !target.isActive) {
      throw new ApiError(400, 'No active user is registered with that email');
    }
    if (target.id === userId) {
      throw new ApiError(400, 'You cannot set yourself as your own supervisor/authority');
    }
    supervisorId = target.id;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { supervisorId },
    select: {
      ...PUBLIC_USER_FIELDS,
      supervisor: { select: { id: true, fullName: true, email: true } },
    },
  });

  return user;
}

async function issueEmailVerification(user) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + tokenConfig.emailVerificationExpiresHours * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await sendVerificationEmail(user, rawToken);
}

async function resendVerification(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists — always respond the same way.
  if (!user || user.isEmailVerified) return;
  await issueEmailVerification(user);
}

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    throw new ApiError(400, 'Verification link is invalid or has expired');
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { isEmailVerified: true },
  });

  await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { supervisor: { select: { id: true, fullName: true, email: true } } },
  });
  if (!user) {
    // Same message/status as a wrong-password attempt below, so the
    // response never reveals whether an email is registered.
    logger.audit('login_failed', { email, reason: 'no_such_account' });
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    logger.audit('login_failed', { email, userId: user.id, reason: 'bad_password' });
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    logger.audit('login_failed', { email, userId: user.id, reason: 'inactive_account' });
    throw new ApiError(403, 'This account has been deactivated. Contact an administrator.');
  }

  if (!user.isEmailVerified) {
    logger.audit('login_failed', { email, userId: user.id, reason: 'unverified_email' });
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  logger.audit('login_succeeded', { userId: user.id, email: user.email, role: user.role });

  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

async function rotateRefreshToken(rawRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { userId: decoded.sub, tokenHash, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (!record) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account is no longer active');
  }

  const accessToken = signAccessToken(user);
  return { accessToken };
}

async function logoutUser(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way whether or not the email exists.
  if (!user) return;

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + tokenConfig.passwordResetExpiresHours * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await sendPasswordResetEmail(user, rawToken);
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    throw new ApiError(400, 'Reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    // Revoke all existing sessions when the password changes.
    prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
  ]);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

module.exports = {
  PUBLIC_USER_FIELDS,
  registerUser,
  adminCreateUser,
  adminResetPassword,
  updateMySupervisor,
  resendVerification,
  verifyEmail,
  loginUser,
  rotateRefreshToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
