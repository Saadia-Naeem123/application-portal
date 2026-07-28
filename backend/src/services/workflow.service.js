const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');
const { WORKFLOW_STAGE, STAGE_ORDER, statusForStage, nextStage } = require('../constants/workflowStage');
const { WORKFLOW_ACTION } = require('../constants/workflowAction');
const workingHoursService = require('./workingHours.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const smsService = require('./sms.service');

const WITH_RELATIONS = {
  applicationType: { include: { department: true } },
  department: true,
  applicant: { select: { id: true, fullName: true, email: true, department: true, phoneNumber: true } },
  supervisor: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
  assignedOfficer: { select: { id: true, fullName: true, email: true, role: true, phoneNumber: true } },
  attachments: true,
};

// Statuses in which an application is actively sitting in *some* reviewer's
// queue — i.e. eligible for reminders/escalation. AWAITING_INFO is
// deliberately excluded: the clock is paused while the ball is in the
// applicant's court, not the reviewer's.
const ACTIVE_REVIEW_STATUSES = [
  APPLICATION_STATUS.UNDER_SUPERVISOR_REVIEW,
  APPLICATION_STATUS.UNDER_DEPARTMENT_REVIEW,
  APPLICATION_STATUS.ESCALATED,
];

async function getApplicationOrThrow(id) {
  const application = await prisma.application.findUnique({ where: { id }, include: WITH_RELATIONS });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  return application;
}

// Maps a user to the stage they act at, based on role (+ the isDepartmentHead
// flag for department officers). Returns null for roles that never review
// applications (STUDENT, FACULTY, STAFF).
function resolveUserStage(user) {
  if (user.role === ROLES.ACADEMIC_SUPERVISOR) return WORKFLOW_STAGE.SUPERVISOR;
  if (user.role === ROLES.DEPARTMENT_OFFICER) {
    return user.isDepartmentHead ? WORKFLOW_STAGE.DEPARTMENT_HEAD : WORKFLOW_STAGE.DEPARTMENT;
  }
  if (user.role === ROLES.DEAN) return WORKFLOW_STAGE.DEAN;
  if (user.role === ROLES.ADMIN) return WORKFLOW_STAGE.ADMIN;
  return null;
}

// Everyone currently authorized to act on `application` at `stage` — used
// both to authorize an action and to know who to notify/remind/escalate to.
async function resolveStageRecipients(application, stage) {
  if (application.assignedOfficer && resolveUserStage(application.assignedOfficer) === stage) {
    return [application.assignedOfficer];
  }

  if (stage === WORKFLOW_STAGE.SUPERVISOR) {
    return application.supervisor ? [application.supervisor] : [];
  }

  if (stage === WORKFLOW_STAGE.DEPARTMENT || stage === WORKFLOW_STAGE.DEPARTMENT_HEAD) {
    if (!application.department) return [];
    return prisma.user.findMany({
      where: {
        role: ROLES.DEPARTMENT_OFFICER,
        isActive: true,
        isDepartmentHead: stage === WORKFLOW_STAGE.DEPARTMENT_HEAD,
        department: application.department.name,
      },
      select: { id: true, fullName: true, email: true, role: true, phoneNumber: true },
    });
  }

  if (stage === WORKFLOW_STAGE.DEAN) {
    return prisma.user.findMany({
      where: { role: ROLES.DEAN, isActive: true },
      select: { id: true, fullName: true, email: true, role: true, phoneNumber: true },
    });
  }

  // ADMIN
  return prisma.user.findMany({
    where: { role: ROLES.ADMIN, isActive: true },
    select: { id: true, fullName: true, email: true, role: true, phoneNumber: true },
  });
}

// Throws unless `user` is currently authorized to act on `application`
// (approve/reject/request-info/forward). Admins can always act, as the
// final backstop the escalation hierarchy already routes to.
function assertCanReview(application, user) {
  if (!application.currentStage) {
    throw new ApiError(400, 'This application is not currently awaiting review');
  }
  if (user.role === ROLES.ADMIN) return;
  if (application.assignedOfficerId && application.assignedOfficerId === user.id) return;

  const userStage = resolveUserStage(user);
  if (userStage !== application.currentStage) {
    throw new ApiError(403, 'You do not have permission to act on this application');
  }

  if (userStage === WORKFLOW_STAGE.SUPERVISOR) {
    if (application.supervisorId !== user.id) {
      throw new ApiError(403, 'You are not the assigned supervisor for this application');
    }
    return;
  }

  if (userStage === WORKFLOW_STAGE.DEPARTMENT || userStage === WORKFLOW_STAGE.DEPARTMENT_HEAD) {
    if (!application.department || application.department.name !== user.department) {
      throw new ApiError(403, 'This application is not assigned to your department');
    }
  }
}

// Owner, current-stage reviewer, assigned officer, or admin/dean can view —
// same visibility rule Phase 4 uses for the application itself, reused here
// for comments/history so the two stay in sync.
function assertCanView(application, user) {
  const isOwner = application.applicantId === user.id;
  const isSupervisor = application.supervisorId === user.id;
  const isAssignedOfficer = application.assignedOfficerId === user.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.DEAN].includes(user.role);
  const isDepartmentReviewer =
    user.role === ROLES.DEPARTMENT_OFFICER && application.department && application.department.name === user.department;

  if (!isOwner && !isSupervisor && !isAssignedOfficer && !isPrivileged && !isDepartmentReviewer) {
    throw new ApiError(404, 'Application not found');
  }
}

async function recordHistory(applicationId, { actorId = null, action, fromStatus = null, toStatus = null, remarks = null }) {
  return prisma.applicationHistory.create({
    data: { applicationId, actorId, action, fromStatus, toStatus, remarks },
  });
}

// Notifies every recipient about something that happened to an application,
// honoring each recipient's Phase 7 NotificationPreference: per-channel
// toggles (email/in-app/SMS) plus a per-`type` mute that silences a
// notification kind across every channel at once. Best-effort throughout —
// a failed email or SMS should never block the workflow action that
// triggered it, and one recipient's preferences never affect another's.
async function notify(recipients, { applicationId, applicationNumber, type, title, message }) {
  if (recipients.length === 0) return;

  const preferences = await notificationService.getPreferencesMap(recipients.map((r) => r.id));

  const inAppIds = [];
  const channelsByUserId = {};
  const emailTargets = [];
  const smsTargets = [];

  for (const recipient of recipients) {
    const pref = preferences.get(recipient.id);
    if (pref.mutedTypes.includes(type)) continue; // eslint-disable-line no-continue

    const channels = [];
    if (pref.inAppEnabled) {
      channels.push('IN_APP');
      inAppIds.push(recipient.id);
    }
    if (pref.emailEnabled) {
      channels.push('EMAIL');
      emailTargets.push(recipient);
    }
    if (pref.smsEnabled && recipient.phoneNumber) {
      channels.push('SMS');
      smsTargets.push(recipient);
    }
    if (channels.length > 0) channelsByUserId[recipient.id] = channels;
  }

  await notificationService.notifyMany(inAppIds, { applicationId, type, title, message }, channelsByUserId);

  await Promise.all([
    ...emailTargets.map((r) =>
      emailService.sendWorkflowEmail(r, { subject: title, title, message, applicationNumber }).catch(() => {})
    ),
    ...smsTargets.map((r) => smsService.sendNotificationSms(r, { title, message }).catch(() => {})),
  ]);
}

// Builds the {currentStage, status, lastActionAt, deadlineAt} fields for
// entering a stage fresh — used on submission, on approve-and-forward, on
// manual forward, on resuming from AWAITING_INFO, and on escalation.
async function buildStageEntry(stage, slaWorkingHours) {
  const now = new Date();
  const deadlineAt = await workingHoursService.computeDeadline(now, slaWorkingHours);
  return {
    currentStage: stage,
    status: statusForStage(stage),
    lastActionAt: now,
    deadlineAt,
    assignedOfficerId: null,
  };
}

// --- Actions ---

async function approveApplication(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  assertCanReview(application, user);

  const fromStatus = application.status;
  let data;
  let action = WORKFLOW_ACTION.APPROVED;

  if (application.currentStage === WORKFLOW_STAGE.SUPERVISOR) {
    // Supervisor sign-off moves it on to the department — not a final decision.
    data = await buildStageEntry(WORKFLOW_STAGE.DEPARTMENT, application.applicationType.slaWorkingHours);
    action = WORKFLOW_ACTION.FORWARDED;
  } else {
    // Department (or an escalation level standing in for it) is the final decision point.
    data = {
      currentStage: null,
      status: APPLICATION_STATUS.APPROVED,
      deadlineAt: null,
      lastActionAt: new Date(),
      assignedOfficerId: null,
    };
  }

  const updated = await prisma.application.update({ where: { id }, data, include: WITH_RELATIONS });
  await recordHistory(id, { actorId: user.id, action, fromStatus, toStatus: updated.status, remarks });

  const recipients = [updated.applicant];
  if (updated.currentStage) recipients.push(...(await resolveStageRecipients(updated, updated.currentStage)));
  await notify(recipients, {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: updated.status === APPLICATION_STATUS.APPROVED ? 'APPROVED' : 'STATUS_CHANGE',
    title: updated.status === APPLICATION_STATUS.APPROVED ? 'Application approved' : 'Application forwarded to department',
    message:
      updated.status === APPLICATION_STATUS.APPROVED
        ? `Application ${updated.applicationNumber} has been approved.`
        : `Application ${updated.applicationNumber} was approved by the supervisor and forwarded to the department.`,
  });

  return updated;
}

async function rejectApplication(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  assertCanReview(application, user);
  if (!remarks || !remarks.trim()) {
    throw new ApiError(400, 'A reason is required to reject an application');
  }

  const fromStatus = application.status;
  const updated = await prisma.application.update({
    where: { id },
    data: { currentStage: null, status: APPLICATION_STATUS.REJECTED, deadlineAt: null, lastActionAt: new Date(), assignedOfficerId: null },
    include: WITH_RELATIONS,
  });

  await recordHistory(id, { actorId: user.id, action: WORKFLOW_ACTION.REJECTED, fromStatus, toStatus: updated.status, remarks });
  await notify([updated.applicant], {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: 'REJECTED',
    title: 'Application rejected',
    message: `Application ${updated.applicationNumber} was rejected. Reason: ${remarks}`,
  });

  return updated;
}

async function requestInfo(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  assertCanReview(application, user);
  if (!remarks || !remarks.trim()) {
    throw new ApiError(400, 'Please specify what additional information is required');
  }

  const fromStatus = application.status;
  const updated = await prisma.application.update({
    where: { id },
    data: { status: APPLICATION_STATUS.AWAITING_INFO, deadlineAt: null },
    include: WITH_RELATIONS,
  });

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.INFO_REQUESTED,
    fromStatus,
    toStatus: updated.status,
    remarks,
  });
  await notify([updated.applicant], {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: 'INFO_REQUESTED',
    title: 'Additional information requested',
    message: `More information is needed on application ${updated.applicationNumber}: ${remarks}`,
  });

  return updated;
}

// Applicant responds to an info request; the application resumes at
// whatever stage was reviewing it, with a fresh SLA window.
async function provideInfo(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  if (application.applicantId !== user.id) {
    throw new ApiError(403, 'Only the applicant can respond to an information request');
  }
  if (application.status !== APPLICATION_STATUS.AWAITING_INFO) {
    throw new ApiError(400, 'This application is not currently awaiting additional information');
  }

  const fromStatus = application.status;
  const data = await buildStageEntry(application.currentStage, application.applicationType.slaWorkingHours);
  // Preserve whoever it was explicitly assigned to before the info request.
  data.assignedOfficerId = application.assignedOfficerId;

  const updated = await prisma.application.update({ where: { id }, data, include: WITH_RELATIONS });

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.INFO_PROVIDED,
    fromStatus,
    toStatus: updated.status,
    remarks,
  });

  const recipients = await resolveStageRecipients(updated, updated.currentStage);
  await notify(recipients, {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: 'INFO_PROVIDED',
    title: 'Applicant provided requested information',
    message: `The applicant responded on application ${updated.applicationNumber}. It is back in your queue for review.`,
  });

  return updated;
}

// Forwards to a specific named officer — either another reviewer at the
// same stage (e.g. one department officer handing off to another) or the
// next stage up (e.g. a department officer forwarding straight to the Dean).
// Forwarding backward down the hierarchy is not allowed.
async function forwardApplication(id, user, { toUserId, remarks }) {
  const application = await getApplicationOrThrow(id);
  assertCanReview(application, user);

  const target = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!target || !target.isActive) {
    throw new ApiError(400, 'Selected user does not exist or is inactive');
  }
  const targetStage = resolveUserStage(target);
  if (!targetStage) {
    throw new ApiError(400, 'Selected user is not an eligible reviewer');
  }

  const currentIdx = STAGE_ORDER.indexOf(application.currentStage);
  const targetIdx = STAGE_ORDER.indexOf(targetStage);
  if (targetIdx < currentIdx) {
    throw new ApiError(400, 'Cannot forward an application backward in the approval hierarchy');
  }

  const fromStatus = application.status;
  const data =
    targetIdx === currentIdx
      ? { assignedOfficerId: target.id }
      : { ...(await buildStageEntry(targetStage, application.applicationType.slaWorkingHours)), assignedOfficerId: target.id };

  const updated = await prisma.application.update({ where: { id }, data, include: WITH_RELATIONS });

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.FORWARDED,
    fromStatus,
    toStatus: updated.status,
    remarks: remarks || `Forwarded to ${target.fullName}`,
  });
  await notify([target], {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: 'FORWARDED',
    title: 'Application forwarded to you',
    message: `Application ${updated.applicationNumber} was forwarded to you${remarks ? `: ${remarks}` : '.'}`,
  });

  return updated;
}

// --- Dean Portal (Phase 10): Dean-only escalation decisions ---
//
// The Dean only ever acts on an application once it has reached the DEAN
// stage (see resolveUserStage). Both actions below require that exact
// stage — unlike a generic forward, they don't accept an arbitrary target
// user, since "send it back to the department" / "flag it for the
// department to look into" are one-click decisions, not hand-offs to a
// specific person.
function assertDeanCanAct(application, user) {
  if (![ROLES.DEAN, ROLES.ADMIN].includes(user.role)) {
    throw new ApiError(403, 'Only the Dean can take this action');
  }
  if (application.currentStage !== WORKFLOW_STAGE.DEAN) {
    throw new ApiError(400, 'This application is not currently at the Dean stage');
  }
}

// Sends an escalated application back down to the department instead of
// deciding it — e.g. the Dean wants the department to reconsider or supply
// a decision the Dean is unwilling to make unilaterally. Unlike forwardApplication,
// backward movement is exactly the point here, so it bypasses that
// function's "no moving backward" rule entirely rather than relaxing it.
async function returnToDepartment(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  assertDeanCanAct(application, user);
  if (!remarks || !remarks.trim()) {
    throw new ApiError(400, 'Please explain why this application is being returned to the department');
  }
  if (!application.department) {
    throw new ApiError(400, 'This application has no department to return it to');
  }

  const fromStatus = application.status;
  const data = {
    ...(await buildStageEntry(WORKFLOW_STAGE.DEPARTMENT, application.applicationType.slaWorkingHours)),
    assignedOfficerId: null,
  };
  const updated = await prisma.application.update({ where: { id }, data, include: WITH_RELATIONS });

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.RETURNED_TO_DEPARTMENT,
    fromStatus,
    toStatus: updated.status,
    remarks,
  });

  const recipients = await resolveStageRecipients(updated, WORKFLOW_STAGE.DEPARTMENT);
  await notify(recipients, {
    applicationId: id,
    applicationNumber: updated.applicationNumber,
    type: 'RETURNED_TO_DEPARTMENT',
    title: 'Application returned by the Dean',
    message: `The Dean returned application ${updated.applicationNumber} to your department: ${remarks}`,
  });

  return updated;
}

// Flags the application for the department to investigate further. Unlike
// returnToDepartment, this does not hand ownership back — the application
// stays with the Dean (currentStage/status untouched) and the Dean is
// still expected to decide once the investigation comes back, so it's
// logged as a note on the timeline and a notification to the department
// rather than a stage transition.
async function requestInvestigation(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  assertDeanCanAct(application, user);
  if (!remarks || !remarks.trim()) {
    throw new ApiError(400, 'Please specify what needs to be investigated');
  }

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.INVESTIGATION_REQUESTED,
    fromStatus: application.status,
    toStatus: application.status,
    remarks,
  });

  if (application.department) {
    const recipients = await resolveStageRecipients(application, WORKFLOW_STAGE.DEPARTMENT);
    await notify(recipients, {
      applicationId: id,
      applicationNumber: application.applicationNumber,
      type: 'INVESTIGATION_REQUESTED',
      title: 'Dean requested an investigation',
      message: `The Dean requested your department investigate application ${application.applicationNumber}: ${remarks}`,
    });
  }

  return getApplicationOrThrow(id);
}

async function closeApplication(id, user, remarks) {
  const application = await getApplicationOrThrow(id);
  const canClose =
    user.role === ROLES.ADMIN ||
    (user.role === ROLES.DEPARTMENT_OFFICER && application.department && application.department.name === user.department);
  if (!canClose) {
    throw new ApiError(403, 'You do not have permission to close this application');
  }
  const isDecided = [APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED].includes(application.status);
  if (!isDecided && user.role !== ROLES.ADMIN) {
    throw new ApiError(400, 'Only a decided (approved or rejected) application can be closed');
  }
  if (application.status === APPLICATION_STATUS.CLOSED) {
    throw new ApiError(400, 'This application is already closed');
  }
  // An admin closing an application that hasn't reached a decision yet is a
  // force close (Administrator Portal's "Applications > Force close"); a
  // reason is required so the audit trail explains the override.
  const isForceClose = user.role === ROLES.ADMIN && !isDecided;
  if (isForceClose && (!remarks || !remarks.trim())) {
    throw new ApiError(400, 'Please provide a reason to force-close an application that has not been decided');
  }

  const fromStatus = application.status;
  const updated = await prisma.application.update({
    where: { id },
    data: { status: APPLICATION_STATUS.CLOSED, closedAt: new Date() },
    include: WITH_RELATIONS,
  });

  await recordHistory(id, {
    actorId: user.id,
    action: WORKFLOW_ACTION.CLOSED,
    fromStatus,
    toStatus: updated.status,
    remarks: isForceClose ? `Force-closed by administrator: ${remarks}` : remarks,
  });
  return updated;
}

async function addComment(id, user, message, files = []) {
  const application = await getApplicationOrThrow(id);
  assertCanView(application, user);
  if (!message || !message.trim()) {
    throw new ApiError(400, 'Comment message is required');
  }

  const comment = await prisma.applicationComment.create({
    data: {
      applicationId: id,
      authorId: user.id,
      message: message.trim(),
      // Phase 7: "Attachment sharing" — files uploaded alongside the
      // comment (already written to disk by upload.middleware.js's
      // commentUpload before this runs) are linked in the same create.
      attachments:
        files.length > 0
          ? {
              create: files.map((file) => ({
                fileName: file.originalname,
                storedFileName: file.filename,
                filePath: file.path,
                mimeType: file.mimetype,
                size: file.size,
              })),
            }
          : undefined,
    },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      attachments: true,
    },
  });

  await recordHistory(id, { actorId: user.id, action: WORKFLOW_ACTION.COMMENTED, remarks: message.trim() });

  // Notify everyone else involved (applicant + current-stage reviewers),
  // excluding the commenter themself.
  const recipients = [application.applicant, ...(application.currentStage ? await resolveStageRecipients(application, application.currentStage) : [])].filter(
    (r) => r && r.id !== user.id
  );
  await notify(recipients, {
    applicationId: id,
    applicationNumber: application.applicationNumber,
    type: 'COMMENT',
    title: 'New comment on your application',
    message: `${user.fullName} commented on application ${application.applicationNumber}.`,
  });

  return comment;
}

async function listComments(id, user) {
  const application = await getApplicationOrThrow(id);
  assertCanView(application, user);
  return prisma.applicationComment.findMany({
    where: { applicationId: id },
    include: { author: { select: { id: true, fullName: true, role: true } }, attachments: true },
    orderBy: { createdAt: 'asc' },
  });
}

// Same visibility rule as the comment thread itself — anyone who can see
// the application's comments can download what's attached to them.
async function getCommentAttachmentForDownload(applicationId, commentId, attachmentId, user) {
  const application = await getApplicationOrThrow(applicationId);
  assertCanView(application, user);

  const comment = await prisma.applicationComment.findFirst({
    where: { id: commentId, applicationId },
    include: { attachments: true },
  });
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const attachment = comment.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }
  return attachment;
}

async function listHistory(id, user) {
  const application = await getApplicationOrThrow(id);
  assertCanView(application, user);
  return prisma.applicationHistory.findMany({
    where: { applicationId: id },
    include: { actor: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

// Summary used by the "Countdown timer" / workflow-tracking UI: current
// stage, who's holding it, the deadline, and remaining working hours.
async function getWorkflowStatus(id, user) {
  const application = await getApplicationOrThrow(id);
  assertCanView(application, user);

  const reviewers = application.currentStage ? await resolveStageRecipients(application, application.currentStage) : [];
  let remainingWorkingHours = null;
  if (application.deadlineAt && application.lastActionAt) {
    const elapsed = await workingHoursService.computeElapsedWorkingHours(application.lastActionAt, new Date());
    remainingWorkingHours = Math.max(application.applicationType.slaWorkingHours - elapsed, 0);
  }

  return {
    status: application.status,
    currentStage: application.currentStage,
    reviewers: reviewers.map((r) => ({ id: r.id, fullName: r.fullName })),
    deadlineAt: application.deadlineAt,
    remainingWorkingHours,
    escalationLevel: application.escalationLevel,
  };
}

module.exports = {
  WITH_RELATIONS,
  ACTIVE_REVIEW_STATUSES,
  getApplicationOrThrow,
  resolveUserStage,
  resolveStageRecipients,
  assertCanReview,
  assertCanView,
  recordHistory,
  notify,
  buildStageEntry,
  approveApplication,
  rejectApplication,
  requestInfo,
  provideInfo,
  forwardApplication,
  returnToDepartment,
  requestInvestigation,
  closeApplication,
  addComment,
  listComments,
  getCommentAttachmentForDownload,
  listHistory,
  getWorkflowStatus,
};
