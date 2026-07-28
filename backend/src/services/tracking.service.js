const prisma = require('../config/db');
const applicationService = require('./application.service');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');

// Approximate "how far along" percentage for the visual progress tracker
// described in the original spec. Not a precise SLA measure — just enough
// for a progress bar to feel meaningful across the whole status lifecycle.
const STATUS_PROGRESS = {
  [APPLICATION_STATUS.DRAFT]: 0,
  [APPLICATION_STATUS.SUBMITTED]: 10,
  [APPLICATION_STATUS.UNDER_SUPERVISOR_REVIEW]: 35,
  [APPLICATION_STATUS.UNDER_DEPARTMENT_REVIEW]: 60,
  [APPLICATION_STATUS.AWAITING_INFO]: 60,
  [APPLICATION_STATUS.ESCALATED]: 80,
  [APPLICATION_STATUS.APPROVED]: 100,
  [APPLICATION_STATUS.REJECTED]: 100,
  [APPLICATION_STATUS.CLOSED]: 100,
};

const FINAL_STATUSES = [APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CLOSED];

async function getTrackingTimeline(id, user) {
  // Reuses the existing view-permission check (owner / assigned supervisor /
  // privileged role) so tracking visibility can never diverge from the
  // application's own view rules.
  const application = await applicationService.getApplicationForViewer(id, user);

  const history = await prisma.applicationHistory.findMany({
    where: { applicationId: id },
    include: { actor: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const timeline = history.map((h) => ({
    id: h.id,
    action: h.action,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    remarks: h.remarks,
    actor: h.actor ? { id: h.actor.id, fullName: h.actor.fullName, role: h.actor.role } : null,
    occurredAt: h.createdAt,
  }));

  const isOverdue =
    Boolean(application.deadlineAt) &&
    new Date(application.deadlineAt) < new Date() &&
    !FINAL_STATUSES.includes(application.status);

  return {
    applicationId: application.id,
    applicationNumber: application.applicationNumber,
    currentStatus: application.status,
    currentStage: application.currentStage,
    progressPercent: STATUS_PROGRESS[application.status] ?? 0,
    deadlineAt: application.deadlineAt,
    isOverdue,
    submittedAt: application.submittedAt,
    closedAt: application.closedAt,
    timeline,
  };
}

module.exports = { getTrackingTimeline, STATUS_PROGRESS };
