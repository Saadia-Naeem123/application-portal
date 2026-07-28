const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { nextStage } = require('../constants/workflowStage');
const { WORKFLOW_ACTION } = require('../constants/workflowAction');
const workflowService = require('./workflow.service');

// Escalates a single application one level up the hierarchy. Shared by the
// hourly scheduler (Phase 6) and the admin manual-escalate endpoint, so both
// paths log identically and notify the same people.
async function escalateApplication(application, { reason, actorId = null }) {
  const target = nextStage(application.currentStage);
  if (!target) {
    throw new ApiError(400, 'This application is already at the top of the escalation hierarchy (Admin)');
  }

  const fromStatus = application.status;
  const staged = await workflowService.buildStageEntry(target, application.applicationType.slaWorkingHours);

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id: application.id },
      data: { ...staged, escalationLevel: { increment: 1 } },
      include: workflowService.WITH_RELATIONS,
    }),
    prisma.escalationRecord.create({
      data: {
        applicationId: application.id,
        fromStage: application.currentStage,
        toStage: target,
        fromUserId: application.supervisorId || application.assignedOfficerId || null,
        toUserId: null,
        reason,
      },
    }),
  ]);

  await workflowService.recordHistory(application.id, {
    actorId,
    action: WORKFLOW_ACTION.ESCALATED,
    fromStatus,
    toStatus: updated.status,
    remarks: reason,
  });

  const recipients = [updated.applicant, ...(await workflowService.resolveStageRecipients(updated, target))];
  await workflowService.notify(recipients, {
    applicationId: application.id,
    applicationNumber: updated.applicationNumber,
    type: 'ESCALATED',
    title: 'Application escalated',
    message: `Application ${updated.applicationNumber} was escalated to the ${target.replace('_', ' ').toLowerCase()} level because it was not actioned within the deadline.`,
  });

  return updated;
}

// Admin-triggered manual escalation (e.g. a VIP complaint an admin wants
// bumped up immediately, ahead of its deadline).
async function manualEscalate(id, user, reason) {
  const application = await workflowService.getApplicationOrThrow(id);
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only an administrator can manually escalate an application');
  }
  if (!application.currentStage) {
    throw new ApiError(400, 'This application is not currently in review');
  }
  return escalateApplication(application, { reason: reason || 'Manually escalated by administrator', actorId: user.id });
}

// Finds every overdue application and escalates it one level. Returns a
// summary for logging/observability; called by jobs/escalation.job.js on
// the hourly schedule, and exposed via an admin "run now" endpoint for
// testing without waiting for the cron tick.
async function runEscalationSweep() {
  const overdue = await prisma.application.findMany({
    where: {
      status: { in: workflowService.ACTIVE_REVIEW_STATUSES },
      deadlineAt: { lt: new Date() },
    },
    include: workflowService.WITH_RELATIONS,
  });

  const results = [];
  for (const application of overdue) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const updated = await escalateApplication(application, {
        reason: `Automatically escalated — no action taken within the ${application.applicationType.slaWorkingHours}-working-hour deadline.`,
      });
      results.push({ applicationId: application.id, escalatedTo: updated.currentStage });
    } catch (err) {
      // Already at the top of the hierarchy (ADMIN) — nothing further to
      // escalate to; leave it for the reminder job to keep nudging Admin.
      results.push({ applicationId: application.id, error: err.message });
    }
  }
  return results;
}

module.exports = { escalateApplication, manualEscalate, runEscalationSweep };
