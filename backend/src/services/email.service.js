const nodemailer = require('nodemailer');
const { email: emailConfig, clientUrl } = require('../config/env');

const hasSmtpConfig = Boolean(emailConfig.host && emailConfig.user && emailConfig.pass);

let transporter = null;
if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465,
    auth: { user: emailConfig.user, pass: emailConfig.pass },
  });
}

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console.
 * This lets the whole auth flow run end-to-end in local dev without a real
 * mail provider.
 */
async function sendMail({ to, subject, html }) {
  if (!hasSmtpConfig) {
    // eslint-disable-next-line no-console
    console.log('\n[email:dev-mode] SMTP not configured — logging email instead of sending.');
    // eslint-disable-next-line no-console
    console.log(`  To: ${to}\n  Subject: ${subject}\n  Body:\n${html}\n`);
    return;
  }

  await transporter.sendMail({
    from: emailConfig.from,
    to,
    subject,
    html,
  });
}

async function sendVerificationEmail(user, rawToken) {
  const link = `${clientUrl}/verify-email?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your University System account',
    html: `
      <p>Hi ${user.fullName},</p>
      <p>Please verify your email address to activate your account:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
}

async function sendPasswordResetEmail(user, rawToken) {
  const link = `${clientUrl}/reset-password?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your University System password',
    html: `
      <p>Hi ${user.fullName},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

// Admin-created accounts (and admin password resets) — hands the user their
// university email + a generated temporary password so they can log in and
// update their own profile from there. Never logged/stored anywhere else.
async function sendCredentialsEmail(user, temporaryPassword, { isReset = false } = {}) {
  const link = `${clientUrl}/login`;
  await sendMail({
    to: user.email,
    subject: isReset ? 'Your University System password has been reset' : 'Your University System account is ready',
    html: `
      <p>Hi ${user.fullName},</p>
      <p>${
        isReset
          ? 'An administrator has reset the password for your account.'
          : 'An administrator has created an account for you on the University System.'
      }</p>
      <p>Login email: <strong>${user.email}</strong></p>
      <p>Temporary password: <strong>${temporaryPassword}</strong></p>
      <p><a href="${link}">${link}</a></p>
      <p>Please log in and update your profile and password as soon as possible.</p>
    `,
  });
}

// Generic templated email for workflow events (status changes, reminders,
// escalations, comments) — keeps the reminder/escalation/workflow services
// from each hand-rolling their own HTML.
async function sendWorkflowEmail(user, { subject, title, message, applicationNumber }) {
  const link = applicationNumber ? `${clientUrl}/applications/${applicationNumber}` : clientUrl;
  await sendMail({
    to: user.email,
    subject,
    html: `
      <p>Hi ${user.fullName},</p>
      <p><strong>${title}</strong></p>
      <p>${message}</p>
      ${applicationNumber ? `<p>Application: <strong>${applicationNumber}</strong></p>` : ''}
      <p><a href="${link}">${link}</a></p>
    `,
  });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendCredentialsEmail,
  sendWorkflowEmail,
};
