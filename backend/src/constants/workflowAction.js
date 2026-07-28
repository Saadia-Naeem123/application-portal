const WORKFLOW_ACTION = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  INFO_REQUESTED: 'INFO_REQUESTED',
  INFO_PROVIDED: 'INFO_PROVIDED',
  FORWARDED: 'FORWARDED',
  ESCALATED: 'ESCALATED',
  COMMENTED: 'COMMENTED',
  REMINDER_SENT: 'REMINDER_SENT',
  CLOSED: 'CLOSED',
  // Dean Portal (Phase 10): Dean sends an escalated application back to the
  // department instead of deciding it, and/or flags it for the department
  // to investigate further before the Dean will decide. Both keep the same
  // FORWARDED-style semantics but are logged distinctly so the activity
  // timeline reads correctly.
  RETURNED_TO_DEPARTMENT: 'RETURNED_TO_DEPARTMENT',
  INVESTIGATION_REQUESTED: 'INVESTIGATION_REQUESTED',
});

module.exports = { WORKFLOW_ACTION };
