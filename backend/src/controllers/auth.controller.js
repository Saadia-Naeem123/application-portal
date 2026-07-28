const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const auditLogService = require('../services/auditLog.service');
const { nodeEnv } = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: nodeEnv === 'production',
  // Vercel (frontend) and Render (backend) are different sites, so the
  // refresh cookie is cross-site every time it's sent. Browsers only send
  // cross-site cookies when SameSite=None, and SameSite=None is only
  // honored when Secure is also set — hence the pairing with `secure` above.
  // 'lax' silently drops the cookie cross-site, which breaks refresh/logout
  // once frontend and backend live on different domains.
  sameSite: nodeEnv === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, 'Registration successful. Please check your email to verify your account.', { user }));
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  res.status(200).json(new ApiResponse(200, 'If that email is registered and unverified, a new link has been sent.'));
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json(new ApiResponse(200, 'Email verified successfully. You can now log in.'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let user;
  let accessToken;
  let refreshToken;
  try {
    ({ user, accessToken, refreshToken } = await authService.loginUser(email, password));
  } catch (err) {
    await auditLogService.record(req, {
      category: 'AUTH',
      action: 'LOGIN_FAILED',
      actorEmail: email,
      details: err.message,
    });
    throw err;
  }

  await auditLogService.record(req, {
    category: 'AUTH',
    action: 'LOGIN_SUCCESS',
    actorId: user.id,
    actorEmail: user.email,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse(200, 'Login successful', { user, accessToken }));
});

const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawRefreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided', errors: [] });
  }
  const { accessToken } = await authService.rotateRefreshToken(rawRefreshToken);
  res.status(200).json(new ApiResponse(200, 'Access token refreshed', { accessToken }));
});

const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logoutUser(rawRefreshToken);
  // clearCookie must be called with the same sameSite/secure/path attributes
  // used to set the cookie, or some browsers will silently ignore it.
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
    secure: REFRESH_COOKIE_OPTIONS.secure,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
    path: REFRESH_COOKIE_OPTIONS.path,
  });
  res.status(200).json(new ApiResponse(200, 'Logged out successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res.status(200).json(new ApiResponse(200, 'If that email is registered, a password reset link has been sent.'));
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res.status(200).json(new ApiResponse(200, 'Password has been reset. You can now log in with your new password.'));
});

module.exports = {
  register,
  resendVerification,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
