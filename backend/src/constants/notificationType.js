// Centralizes the free-form `type` strings already used as
// `Notification.type` values across the workflow/reminder/escalation
// services (see application.service.js, workflow.service.js,
// reminder.service.js, escalation.service.js). Kept as plain strings rather
// than a Prisma enum so a future application/workflow event can introduce a
// new type without a migration — this file exists so
// `NotificationPreference.mutedTypes` has a known, validated set of values
// to choose from instead of accepting arbitrary strings.
const NOTIFICATION_TYPE = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  STATUS_CHANGE: 'STATUS_CHANGE',
  REJECTED: 'REJECTED',
  INFO_REQUESTED: 'INFO_REQUESTED',
  INFO_PROVIDED: 'INFO_PROVIDED',
  FORWARDED: 'FORWARDED',
  COMMENT: 'COMMENT',
  REMINDER: 'REMINDER',
  ESCALATED: 'ESCALATED',
});

const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE);

module.exports = { NOTIFICATION_TYPE, ALL_NOTIFICATION_TYPES };
