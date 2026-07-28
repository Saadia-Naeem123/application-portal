const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const departmentService = require('../services/department.service');
const auditLogService = require('../services/auditLog.service');

const listDepartments = asyncHandler(async (req, res) => {
  // Non-admins only ever see active departments (they're populating a
  // dropdown); admins can pass ?includeInactive=true to manage the full set.
  const includeInactive = req.user?.role === 'ADMIN' && req.query.includeInactive === 'true';
  const departments = await departmentService.listDepartments({ includeInactive });
  res.status(200).json(new ApiResponse(200, 'Departments fetched', { departments }));
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Department fetched', { department }));
});

const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  await auditLogService.record(req, {
    category: 'DEPARTMENT',
    action: 'DEPARTMENT_CREATED',
    targetType: 'Department',
    targetId: department.id,
    details: `Created department ${department.name}`,
  });
  res.status(201).json(new ApiResponse(201, 'Department created', { department }));
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  await auditLogService.record(req, {
    category: 'DEPARTMENT',
    action: 'DEPARTMENT_UPDATED',
    targetType: 'Department',
    targetId: department.id,
    details: `Updated department ${department.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Department updated', { department }));
});

const deactivateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.deactivateDepartment(req.params.id);
  await auditLogService.record(req, {
    category: 'DEPARTMENT',
    action: 'DEPARTMENT_DELETED',
    targetType: 'Department',
    targetId: department.id,
    details: `Deactivated department ${department.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Department deactivated', { department }));
});

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
