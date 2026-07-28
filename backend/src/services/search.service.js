const prisma = require('../config/db');
const { ROLES } = require('../constants/roles');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');
const { WITH_RELATIONS } = require('./application.service');

// ADMIN and DEAN can view any application, matching
// application.service.js#assertCanView's existing view-permission decision.
// DEPARTMENT_OFFICER is also allowed to open any single application by ID
// (same assertCanView rule), but their *queue* — the Department Officer
// Portal's Pending/Approved/Rejected/Escalated lists — is scoped to their
// own department below, so browsing never mixes in other departments' work.
const PRIVILEGED_ROLES = [ROLES.ADMIN, ROLES.DEAN];

const FINAL_STATUSES = [APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CLOSED];

const SORTABLE_FIELDS = ['createdAt', 'submittedAt', 'deadlineAt', 'priority', 'status', 'applicationNumber'];

const MAX_EXPORT_ROWS = 5000;

// Applications a given user is allowed to search over: unrestricted for
// privileged roles, scoped to their own department (or applications
// explicitly assigned to them) for a Department Officer, otherwise only
// what they submitted, supervise, or have been assigned to review.
function scopeFilter(user) {
  if (PRIVILEGED_ROLES.includes(user.role)) return {};
  if (user.role === ROLES.DEPARTMENT_OFFICER) {
    const clauses = [{ assignedOfficerId: user.id }];
    if (user.department) clauses.push({ department: { name: user.department } });
    return { OR: clauses };
  }
  return {
    OR: [{ applicantId: user.id }, { supervisorId: user.id }, { assignedOfficerId: user.id }],
  };
}

function buildFilters(query) {
  const {
    q,
    applicationNumber,
    applicantName,
    registrationNumber,
    employeeId,
    departmentId,
    supervisorId,
    applicationTypeId,
    assignedOfficerId,
    priority,
    status,
    currentStage,
    submittedFrom,
    submittedTo,
    overdue,
    nearDeadline,
  } = query;

  const and = [];

  if (q) {
    and.push({
      OR: [
        { applicationNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { applicant: { fullName: { contains: q, mode: 'insensitive' } } },
        { applicant: { email: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }
  if (applicationNumber) and.push({ applicationNumber: { contains: applicationNumber, mode: 'insensitive' } });
  if (applicantName) and.push({ applicant: { fullName: { contains: applicantName, mode: 'insensitive' } } });
  if (registrationNumber) {
    and.push({ applicant: { registrationNumber: { contains: registrationNumber, mode: 'insensitive' } } });
  }
  if (employeeId) and.push({ applicant: { employeeId: { contains: employeeId, mode: 'insensitive' } } });
  if (departmentId) and.push({ departmentId });
  if (supervisorId) and.push({ supervisorId });
  if (applicationTypeId) and.push({ applicationTypeId });
  if (assignedOfficerId) and.push({ assignedOfficerId });
  if (priority) and.push({ priority: { in: String(priority).split(',') } });
  if (status) and.push({ status: { in: String(status).split(',') } });
  // Distinguishes *which* level an ESCALATED application currently sits at —
  // e.g. the Dean Portal's escalated queue wants only currentStage=DEAN,
  // not every escalation level (DEPARTMENT_HEAD/DEAN/ADMIN all share the
  // ESCALATED status).
  if (currentStage) and.push({ currentStage: { in: String(currentStage).split(',') } });

  if (submittedFrom || submittedTo) {
    and.push({
      submittedAt: {
        ...(submittedFrom ? { gte: new Date(submittedFrom) } : {}),
        ...(submittedTo ? { lte: new Date(submittedTo) } : {}),
      },
    });
  }

  if (overdue === 'true') {
    and.push({ deadlineAt: { lt: new Date() }, status: { notIn: FINAL_STATUSES } });
  }

  if (nearDeadline === 'true') {
    and.push({
      deadlineAt: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      status: { notIn: FINAL_STATUSES },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildWhere(user, query) {
  const scoped = scopeFilter(user);
  const filters = buildFilters(query);
  const clauses = [scoped, filters].filter((c) => c && Object.keys(c).length > 0);
  return clauses.length > 0 ? { AND: clauses } : {};
}

async function searchApplications(user, query) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const where = buildWhere(user, query);
  const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: WITH_RELATIONS,
      orderBy: { [orderField]: sortOrder === 'asc' ? 'asc' : 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total, page: Number(page), pageSize: Number(pageSize) };
}

// Export ignores pagination but is still capped — a runaway "export
// everything" query shouldn't be able to lock up the DB or the response.
async function searchApplicationsForExport(user, query) {
  const where = buildWhere(user, query);
  return prisma.application.findMany({
    where,
    include: WITH_RELATIONS,
    orderBy: { createdAt: 'desc' },
    take: MAX_EXPORT_ROWS,
  });
}

module.exports = { searchApplications, searchApplicationsForExport };
