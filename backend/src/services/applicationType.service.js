const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const WITH_DEPARTMENT = { department: true };

async function listApplicationTypes({ includeInactive = false } = {}) {
  return prisma.applicationType.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: WITH_DEPARTMENT,
    orderBy: { name: 'asc' },
  });
}

async function getApplicationTypeById(id) {
  const applicationType = await prisma.applicationType.findUnique({
    where: { id },
    include: WITH_DEPARTMENT,
  });
  if (!applicationType) {
    throw new ApiError(404, 'Application type not found');
  }
  return applicationType;
}

async function assertDepartmentActive(departmentId) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department || !department.isActive) {
    throw new ApiError(400, 'Selected department does not exist or is inactive');
  }
}

async function createApplicationType(payload) {
  const {
    name,
    code,
    description,
    departmentId,
    requiresSupervisorApproval,
    defaultPriority,
    slaWorkingHours,
  } = payload;

  await assertDepartmentActive(departmentId);

  return prisma.applicationType.create({
    data: {
      name,
      code,
      description,
      departmentId,
      requiresSupervisorApproval: Boolean(requiresSupervisorApproval),
      defaultPriority,
      slaWorkingHours,
    },
    include: WITH_DEPARTMENT,
  });
}

async function updateApplicationType(id, payload) {
  await getApplicationTypeById(id);
  const {
    name,
    code,
    description,
    departmentId,
    requiresSupervisorApproval,
    defaultPriority,
    slaWorkingHours,
    isActive,
  } = payload;

  if (departmentId) {
    await assertDepartmentActive(departmentId);
  }

  return prisma.applicationType.update({
    where: { id },
    data: {
      name,
      code,
      description,
      departmentId,
      requiresSupervisorApproval:
        requiresSupervisorApproval === undefined ? undefined : Boolean(requiresSupervisorApproval),
      defaultPriority,
      slaWorkingHours,
      isActive,
    },
    include: WITH_DEPARTMENT,
  });
}

async function deactivateApplicationType(id) {
  await getApplicationTypeById(id);
  return prisma.applicationType.update({ where: { id }, data: { isActive: false } });
}

// --- Routing rules: a focused read/write view over the same table ---

async function listRoutingRules() {
  const types = await listApplicationTypes({ includeInactive: true });
  return types.map((t) => ({
    applicationTypeId: t.id,
    applicationTypeName: t.name,
    departmentId: t.departmentId,
    departmentName: t.department.name,
    requiresSupervisorApproval: t.requiresSupervisorApproval,
    isActive: t.isActive,
  }));
}

async function updateRoutingRule(applicationTypeId, { departmentId, requiresSupervisorApproval }) {
  return updateApplicationType(applicationTypeId, { departmentId, requiresSupervisorApproval });
}

module.exports = {
  listApplicationTypes,
  getApplicationTypeById,
  createApplicationType,
  updateApplicationType,
  deactivateApplicationType,
  listRoutingRules,
  updateRoutingRule,
};
