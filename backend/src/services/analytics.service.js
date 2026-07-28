const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');

const PRIVILEGED_ROLES = [ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER];
const REPORT_ROLES = [ROLES.ADMIN, ROLES.DEAN, ROLES.DEPARTMENT_OFFICER];

const FINAL_STATUSES = [APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CLOSED];
const RESOLVED_STATUSES = [APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.CLOSED];
const PENDING_STATUSES = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.UNDER_SUPERVISOR_REVIEW,
  APPLICATION_STATUS.UNDER_DEPARTMENT_REVIEW,
  APPLICATION_STATUS.AWAITING_INFO,
];

function average(nums) {
  const valid = nums.filter((n) => Number.isFinite(n) && n >= 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function bucketByMonth(dates) {
  const buckets = {};
  dates.forEach((d) => {
    const key = new Date(d).toISOString().slice(0, 7); // YYYY-MM
    buckets[key] = (buckets[key] || 0) + 1;
  });
  return Object.entries(buckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, count]) => ({ month, count }));
}

function dateRangeWhere(from, to) {
  if (!from && !to) return {};
  return {
    createdAt: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    },
  };
}

// Everyone gets *some* overview — privileged roles see the whole system (or
// one department, if they pass ?departmentId), an Academic Supervisor sees
// only applications routed to them, and everyone else sees their own
// submissions. This mirrors the "Dashboard widgets" deliverable applying to
// every role's landing page, not just the admin analytics screen.
function overviewScope(user, departmentId) {
  if (user.role === ROLES.DEPARTMENT_OFFICER) {
    // A Department Officer's dashboard is their own department's queue, not
    // a system-wide view — unlike ADMIN/DEAN, departmentId isn't theirs to
    // override.
    return user.department ? { department: { name: user.department } } : {};
  }
  if (PRIVILEGED_ROLES.includes(user.role)) {
    return departmentId ? { departmentId } : {};
  }
  if (user.role === ROLES.ACADEMIC_SUPERVISOR) {
    return { supervisorId: user.id };
  }
  return { applicantId: user.id };
}

async function resolutionHoursFor(where) {
  const resolved = await prisma.application.findMany({
    where: { ...where, status: { in: RESOLVED_STATUSES }, submittedAt: { not: null } },
    select: { submittedAt: true, updatedAt: true },
  });
  return average(resolved.map((a) => (new Date(a.updatedAt) - new Date(a.submittedAt)) / (1000 * 60 * 60)));
}

async function getOverview(user, { departmentId, from, to } = {}) {
  const where = { ...overviewScope(user, departmentId), ...dateRangeWhere(from, to) };

  const [total, byStatusRaw, overdueCount, nearDeadlineCount, avgResolutionHours, topTypesRaw, trendRows] =
    await Promise.all([
      prisma.application.count({ where }),
      prisma.application.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.application.count({
        where: { ...where, deadlineAt: { lt: new Date() }, status: { notIn: FINAL_STATUSES } },
      }),
      prisma.application.count({
        where: {
          ...where,
          deadlineAt: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          status: { notIn: FINAL_STATUSES },
        },
      }),
      resolutionHoursFor(where),
      prisma.application.groupBy({
        by: ['applicationTypeId'],
        where,
        _count: { _all: true },
        orderBy: { _count: { applicationTypeId: 'desc' } },
        take: 5,
      }),
      prisma.application.findMany({
        where: { ...where, createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
      }),
    ]);

  const byStatus = Object.fromEntries(byStatusRaw.map((r) => [r.status, r._count._all]));
  const pending = PENDING_STATUSES.reduce((sum, s) => sum + (byStatus[s] || 0), 0);

  const types = await prisma.applicationType.findMany({
    where: { id: { in: topTypesRaw.map((t) => t.applicationTypeId) } },
    select: { id: true, name: true },
  });
  const typeNameById = Object.fromEntries(types.map((t) => [t.id, t.name]));
  const topCategories = topTypesRaw.map((t) => ({
    applicationType: typeNameById[t.applicationTypeId] || 'Unknown',
    count: t._count._all,
  }));

  return {
    totals: {
      total,
      pending,
      approved: byStatus[APPLICATION_STATUS.APPROVED] || 0,
      rejected: byStatus[APPLICATION_STATUS.REJECTED] || 0,
      escalated: byStatus[APPLICATION_STATUS.ESCALATED] || 0,
      closed: byStatus[APPLICATION_STATUS.CLOSED] || 0,
      overdue: overdueCount,
      nearDeadline: nearDeadlineCount,
    },
    byStatus,
    avgResolutionHours: round1(avgResolutionHours),
    topCategories,
    monthlyTrend: bucketByMonth(trendRows.map((r) => r.createdAt)),
  };
}

function assertCanViewReports(user) {
  if (!REPORT_ROLES.includes(user.role)) {
    throw new ApiError(403, 'You do not have permission to view this report');
  }
}

async function getDepartmentReport(user, { from, to } = {}) {
  assertCanViewReports(user);
  const dateWhere = dateRangeWhere(from, to);

  const departments = await prisma.department.findMany({
    where: {
      isActive: true,
      // A Department Officer only ever sees their own department's row in
      // this comparison report — ADMIN/DEAN keep the full cross-department
      // view.
      ...(user.role === ROLES.DEPARTMENT_OFFICER && user.department ? { name: user.department } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const report = await Promise.all(
    departments.map(async (dept) => {
      const where = { departmentId: dept.id, ...dateWhere };
      const [total, approved, rejected, pending, overdue, avgResolutionHours, escalationCount] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.count({ where: { ...where, status: APPLICATION_STATUS.APPROVED } }),
        prisma.application.count({ where: { ...where, status: APPLICATION_STATUS.REJECTED } }),
        prisma.application.count({ where: { ...where, status: { in: PENDING_STATUSES } } }),
        prisma.application.count({
          where: { ...where, deadlineAt: { lt: new Date() }, status: { notIn: FINAL_STATUSES } },
        }),
        resolutionHoursFor(where),
        // How often this department's applications have escalated past it —
        // "Escalation frequency" in the Dean Portal's Department Performance
        // view. Counted from EscalationRecord (one row per hop up the
        // hierarchy), scoped by the same date range as everything else here.
        prisma.escalationRecord.count({
          where: { application: { departmentId: dept.id }, ...(dateWhere.createdAt ? { createdAt: dateWhere.createdAt } : {}) },
        }),
      ]);
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        total,
        approved,
        rejected,
        pending,
        overdue,
        avgResolutionHours: round1(avgResolutionHours),
        escalationCount,
      };
    })
  );

  return report.sort((a, b) => b.total - a.total);
}

async function getSupervisorReport(user, { from, to } = {}) {
  assertCanViewReports(user);
  const dateWhere = dateRangeWhere(from, to);

  const supervisors = await prisma.user.findMany({
    where: {
      role: ROLES.ACADEMIC_SUPERVISOR,
      ...(user.role === ROLES.DEPARTMENT_OFFICER && user.department ? { department: user.department } : {}),
    },
    select: { id: true, fullName: true, department: true },
  });

  const report = await Promise.all(
    supervisors.map(async (sup) => {
      const where = { supervisorId: sup.id, ...dateWhere };
      const [total, approved, rejected, pending, avgResolutionHours] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.count({ where: { ...where, status: APPLICATION_STATUS.APPROVED } }),
        prisma.application.count({ where: { ...where, status: APPLICATION_STATUS.REJECTED } }),
        prisma.application.count({ where: { ...where, status: { in: PENDING_STATUSES } } }),
        resolutionHoursFor(where),
      ]);
      return {
        supervisorId: sup.id,
        supervisorName: sup.fullName,
        department: sup.department,
        total,
        approved,
        rejected,
        pending,
        avgResolutionHours: round1(avgResolutionHours),
      };
    })
  );

  // Only surface supervisors who've actually had at least one application
  // routed to them — an empty row per unused supervisor isn't a useful report.
  return report.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
}

// Dean Portal dashboard (Phase 10): total/pending escalations, how long
// departments are taking to respond overall, and how many departments
// currently have at least one overdue application. DEAN/ADMIN only — a
// system-wide view is exactly what a Department Officer's scoped overview
// deliberately withholds.
async function getDeanOverview(user, { from, to } = {}) {
  if (![ROLES.ADMIN, ROLES.DEAN].includes(user.role)) {
    throw new ApiError(403, 'You do not have permission to view this report');
  }
  const dateWhere = dateRangeWhere(from, to);

  const [totalEscalations, pendingEscalations, avgDepartmentResponseHours, overdueDeptRows] = await Promise.all([
    prisma.application.count({ where: { ...dateWhere, status: APPLICATION_STATUS.ESCALATED } }),
    // Specifically the applications sitting with the Dean right now,
    // awaiting a decision — the count that drives the "needs my action"
    // badge, as opposed to every escalation level system-wide.
    prisma.application.count({ where: { ...dateWhere, currentStage: 'DEAN', status: APPLICATION_STATUS.ESCALATED } }),
    resolutionHoursFor({ ...dateWhere, departmentId: { not: null } }),
    prisma.application.findMany({
      where: { deadlineAt: { lt: new Date() }, status: { notIn: FINAL_STATUSES }, departmentId: { not: null } },
      select: { departmentId: true },
      distinct: ['departmentId'],
    }),
  ]);

  return {
    totalEscalations,
    pendingEscalations,
    avgDepartmentResponseHours: round1(avgDepartmentResponseHours),
    overdueDepartments: overdueDeptRows.length,
  };
}

// Administrator Portal dashboard — user/department headcounts and a merged
// recent-activity feed (application workflow history + audit log) that
// /analytics/overview and /analytics/dean-overview don't already cover.
// Admin-only: this exposes counts across every role and department, not
// scoped like the other overview endpoints.
async function getAdminOverview(user) {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'You do not have permission to view this dashboard');
  }

  const [
    totalUsers,
    students,
    faculty,
    staff,
    supervisors,
    departmentCount,
    recentHistory,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: ROLES.STUDENT } }),
    prisma.user.count({ where: { role: ROLES.FACULTY } }),
    prisma.user.count({ where: { role: ROLES.STAFF } }),
    prisma.user.count({ where: { role: ROLES.ACADEMIC_SUPERVISOR } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.applicationHistory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, fullName: true, role: true } },
        application: { select: { id: true, applicationNumber: true, subject: true } },
      },
    }),
    prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
  ]);

  const recentActivity = [
    ...recentHistory.map((h) => ({
      id: `history-${h.id}`,
      occurredAt: h.createdAt,
      actorName: h.actor?.fullName || 'System',
      description: `${h.action.replace(/_/g, ' ').toLowerCase()} — ${h.application?.applicationNumber || ''} ${
        h.application?.subject || ''
      }`.trim(),
    })),
    ...recentAudit.map((a) => ({
      id: `audit-${a.id}`,
      occurredAt: a.createdAt,
      actorName: a.actorEmail || 'System',
      description: `${a.action.replace(/_/g, ' ').toLowerCase()}${a.details ? ` — ${a.details}` : ''}`,
    })),
  ]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 12);

  return {
    totalUsers,
    students,
    faculty,
    staff,
    supervisors,
    departmentCount,
    recentActivity,
  };
}

module.exports = { getOverview, getDepartmentReport, getSupervisorReport, getDeanOverview, getAdminOverview };
