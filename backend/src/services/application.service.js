const fs = require('fs');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { generateApplicationNumber } = require('../utils/applicationNumber');
const { APPLICATION_STATUS, EDITABLE_STATUSES } = require('../constants/applicationStatus');
const { ROLES } = require('../constants/roles');
const { WORKFLOW_STAGE } = require('../constants/workflowStage');
const { WORKFLOW_ACTION } = require('../constants/workflowAction');
const workflowService = require('./workflow.service');

const WITH_RELATIONS = {
  applicationType: { include: { department: true } },
  department: true,
  applicant: { select: { id: true, fullName: true, email: true, department: true, phoneNumber: true } },
  supervisor: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
  assignedOfficer: { select: { id: true, fullName: true, email: true, role: true, phoneNumber: true } },
  attachments: true,
};

async function generateUniqueApplicationNumber() {
  // Extremely unlikely to collide (see generator), but retry a couple of
  // times against the unique constraint rather than trusting randomness blindly.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateApplicationNumber();
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.application.findUnique({ where: { applicationNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new ApiError(500, 'Could not generate a unique application number, please try again');
}

async function getApplicationTypeOrThrow(applicationTypeId) {
  const applicationType = await prisma.applicationType.findUnique({
    where: { id: applicationTypeId },
    include: { department: true },
  });
  if (!applicationType || !applicationType.isActive) {
    throw new ApiError(400, 'Selected application type does not exist or is inactive');
  }
  return applicationType;
}

// Creates an application. `saveAsDraft: true` leaves it editable; otherwise
// it's routed and submitted immediately in the same call.
async function createApplication(applicant, payload) {
  const { applicationTypeId, subject, description, priority, saveAsDraft } = payload;

  const applicationType = await getApplicationTypeOrThrow(applicationTypeId);
  const applicationNumber = await generateUniqueApplicationNumber();

  const data = {
    applicationNumber,
    applicantId: applicant.id,
    applicationTypeId,
    subject,
    description,
    priority: priority || applicationType.defaultPriority,
    status: APPLICATION_STATUS.DRAFT,
  };

  if (!saveAsDraft) {
    Object.assign(data, await routeOnSubmit(applicant, applicationType));
  }

  const application = await prisma.application.create({ data, include: WITH_RELATIONS });

  if (!saveAsDraft) {
    await announceSubmission(application);
  }

  return application;
}

// Intelligent Department Routing: assign department (and supervisor, when
// required) from the application type, place it at the correct first stage
// of the approval hierarchy, and start that stage's working-hour SLA clock
// (Phase 5/6 — see workflow.service.js for what happens from here).
async function routeOnSubmit(applicant, applicationType) {
  const needsSupervisor = applicationType.requiresSupervisorApproval;
  const supervisorId = needsSupervisor ? applicant.supervisorId || null : null;
  const stage = needsSupervisor && supervisorId ? WORKFLOW_STAGE.SUPERVISOR : WORKFLOW_STAGE.DEPARTMENT;

  const staged = await workflowService.buildStageEntry(stage, applicationType.slaWorkingHours);

  return {
    departmentId: applicationType.departmentId,
    supervisorId,
    submittedAt: new Date(),
    ...staged,
  };
}

// Logs the SUBMITTED history entry and notifies the applicant + whoever's
// queue the application just landed in.
async function announceSubmission(application) {
  await workflowService.recordHistory(application.id, {
    actorId: application.applicantId,
    action: WORKFLOW_ACTION.SUBMITTED,
    toStatus: application.status,
  });

  const recipients = await workflowService.resolveStageRecipients(application, application.currentStage);
  await workflowService.notify(recipients, {
    applicationId: application.id,
    applicationNumber: application.applicationNumber,
    type: 'SUBMITTED',
    title: 'New application submitted for your review',
    message: `Application ${application.applicationNumber} (${application.applicationType.name}) was submitted by ${application.applicant.fullName} and is awaiting your review.`,
  });
}

async function getApplicationById(id) {
  const application = await prisma.application.findUnique({ where: { id }, include: WITH_RELATIONS });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  return application;
}

// Owner, the assigned supervisor/department reviewer, or an admin/dean can
// view an application. Everyone else gets a 404 rather than a 403 so the
// existence of another student's application isn't leaked.
function assertCanView(application, user) {
  const isOwner = application.applicantId === user.id;
  const isAssignedSupervisor = application.supervisorId === user.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER].includes(user.role);
  if (!isOwner && !isAssignedSupervisor && !isPrivileged) {
    throw new ApiError(404, 'Application not found');
  }
}

async function getApplicationForViewer(id, user) {
  const application = await getApplicationById(id);
  assertCanView(application, user);
  return application;
}

async function listMyApplications(user, { status, page = 1, pageSize = 20 }) {
  const where = { applicantId: user.id, ...(status ? { status } : {}) };
  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: WITH_RELATIONS,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.application.count({ where }),
  ]);
  return { applications, total, page: Number(page), pageSize: Number(pageSize) };
}

function assertOwnerAndEditable(application, user) {
  if (application.applicantId !== user.id) {
    throw new ApiError(403, 'You do not have permission to modify this application');
  }
  if (!EDITABLE_STATUSES.includes(application.status)) {
    throw new ApiError(400, 'This application can no longer be edited — it has already been submitted');
  }
}

async function updateApplication(id, user, payload) {
  const application = await getApplicationById(id);
  assertOwnerAndEditable(application, user);

  const { applicationTypeId, subject, description, priority } = payload;
  if (applicationTypeId) {
    await getApplicationTypeOrThrow(applicationTypeId);
  }

  return prisma.application.update({
    where: { id },
    data: { applicationTypeId, subject, description, priority },
    include: WITH_RELATIONS,
  });
}

async function submitApplication(id, user) {
  const application = await getApplicationById(id);
  assertOwnerAndEditable(application, user);

  const routing = await routeOnSubmit(user, application.applicationType);
  const updated = await prisma.application.update({
    where: { id },
    data: routing,
    include: WITH_RELATIONS,
  });

  await announceSubmission(updated);
  return updated;
}

async function deleteApplication(id, user) {
  const application = await getApplicationById(id);
  assertOwnerAndEditable(application, user);

  // Attachments live on disk, not just in the DB — clean those up too.
  for (const attachment of application.attachments) {
    fs.promises.unlink(attachment.filePath).catch(() => {});
  }

  await prisma.application.delete({ where: { id } });
}

async function addAttachments(id, user, files) {
  const application = await getApplicationById(id);
  assertOwnerAndEditable(application, user);

  const attachments = await prisma.$transaction(
    files.map((file) =>
      prisma.applicationAttachment.create({
        data: {
          applicationId: id,
          fileName: file.originalname,
          storedFileName: file.filename,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
        },
      })
    )
  );

  return attachments;
}

async function getAttachmentForDownload(applicationId, attachmentId, user) {
  const application = await getApplicationById(applicationId);
  assertCanView(application, user);

  const attachment = application.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }
  return attachment;
}

async function deleteAttachment(applicationId, attachmentId, user) {
  const application = await getApplicationById(applicationId);
  assertOwnerAndEditable(application, user);

  const attachment = application.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }

  await prisma.applicationAttachment.delete({ where: { id: attachmentId } });
  fs.promises.unlink(attachment.filePath).catch(() => {});
}

module.exports = {
  WITH_RELATIONS,
  createApplication,
  getApplicationForViewer,
  listMyApplications,
  updateApplication,
  submitApplication,
  deleteApplication,
  addAttachments,
  getAttachmentForDownload,
  deleteAttachment,
};
