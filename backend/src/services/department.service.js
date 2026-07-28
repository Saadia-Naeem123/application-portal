const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listDepartments({ includeInactive = false } = {}) {
  return prisma.department.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

async function getDepartmentById(id) {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }
  return department;
}

async function createDepartment({ name, code, description }) {
  return prisma.department.create({
    data: { name, code, description },
  });
}

async function updateDepartment(id, { name, code, description, isActive }) {
  await getDepartmentById(id);
  return prisma.department.update({
    where: { id },
    data: { name, code, description, isActive },
  });
}

// Departments are never hard-deleted once application types or applications
// reference them — deactivating keeps history intact while removing it from
// dropdowns and routing options.
async function deactivateDepartment(id) {
  await getDepartmentById(id);
  const inUse = await prisma.applicationType.findFirst({ where: { departmentId: id, isActive: true } });
  if (inUse) {
    throw new ApiError(
      409,
      'This department is still assigned to at least one active application type. Reassign or deactivate those first.'
    );
  }
  return prisma.department.update({ where: { id }, data: { isActive: false } });
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
