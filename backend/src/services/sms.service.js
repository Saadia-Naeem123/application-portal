const { sms: smsConfig } = require('../config/env');

const hasSmsConfig = Boolean(smsConfig.apiUrl && smsConfig.apiKey);

/**
 * Sends an SMS if a provider is configured; otherwise logs it to the
 * console. Mirrors email.service.js#sendMail so the notification channel
 * dispatch code (see workflow.service.js#notify) can treat both the same
 * way: best-effort, never throwing back into the workflow action that
 * triggered it.
 *
 * Provider-agnostic on purpose — any HTTP SMS API that accepts a bearer
 * token and a JSON {to, from, body} payload works without code changes,
 * just different SMS_API_URL/SMS_API_KEY/SMS_FROM env values.
 */
async function sendSms({ to, body }) {
  if (!to) return;

  if (!hasSmsConfig) {
    // eslint-disable-next-line no-console
    console.log('\n[sms:dev-mode] SMS provider not configured — logging message instead of sending.');
    // eslint-disable-next-line no-console
    console.log(`  To: ${to}\n  Body: ${body}\n`);
    return;
  }

  await fetch(smsConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${smsConfig.apiKey}`,
    },
    body: JSON.stringify({ to, from: smsConfig.from, body }),
  });
}

// Notification messages are written for email/in-app first (title +
// message can add up to a long paragraph); this keeps the text sent over
// SMS short enough to fit a single segment on most carriers.
function truncateForSms(text, maxLength = 300) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

async function sendNotificationSms(user, { title, message }) {
  await sendSms({ to: user.phoneNumber, body: truncateForSms(`${title}: ${message}`) });
}

module.exports = { sendSms, sendNotificationSms };
