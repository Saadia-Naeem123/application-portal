const WORKFLOW_STAGE = Object.freeze({
  SUPERVISOR: 'SUPERVISOR',
  DEPARTMENT: 'DEPARTMENT',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  DEAN: 'DEAN',
  ADMIN: 'ADMIN',
});

// The approval/escalation hierarchy, in order. Both normal "approve and
// move on" progression and automatic escalation walk this same list —
// escalation just means nobody acted in time, not a different path.
const STAGE_ORDER = [
  WORKFLOW_STAGE.SUPERVISOR,
  WORKFLOW_STAGE.DEPARTMENT,
  WORKFLOW_STAGE.DEPARTMENT_HEAD,
  WORKFLOW_STAGE.DEAN,
  WORKFLOW_STAGE.ADMIN,
];

const ALL_WORKFLOW_STAGES = Object.values(WORKFLOW_STAGE);

const { APPLICATION_STATUS } = require('./applicationStatus');

// The status a newly-entered stage shows up under. SUPERVISOR and DEPARTMENT
// map to their own dedicated statuses (kept from Phase 4); every escalation
// level beyond DEPARTMENT reuses the existing ESCALATED status, so
// escalating doesn't require adding new ApplicationStatus values.
function statusForStage(stage) {
  if (stage === WORKFLOW_STAGE.SUPERVISOR) return APPLICATION_STATUS.UNDER_SUPERVISOR_REVIEW;
  if (stage === WORKFLOW_STAGE.DEPARTMENT) return APPLICATION_STATUS.UNDER_DEPARTMENT_REVIEW;
  return APPLICATION_STATUS.ESCALATED;
}

// Next stage up the hierarchy, or null if `stage` is already at the top
// (ADMIN) and can't be escalated any further.
function nextStage(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

module.exports = { WORKFLOW_STAGE, STAGE_ORDER, ALL_WORKFLOW_STAGES, statusForStage, nextStage };
