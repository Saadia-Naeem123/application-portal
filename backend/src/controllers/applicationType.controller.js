const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const applicationTypeService = require('../services/applicationType.service');
const auditLogService = require('../services/auditLog.service');

const listApplicationTypes = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'ADMIN' && req.query.includeInactive === 'true';
  const applicationTypes = await applicationTypeService.listApplicationTypes({ includeInactive });
  res.status(200).json(new ApiResponse(200, 'Application types fetched', { applicationTypes }));
});

const getApplicationType = asyncHandler(async (req, res) => {
  const applicationType = await applicationTypeService.getApplicationTypeById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Application type fetched', { applicationType }));
});

const createApplicationType = asyncHandler(async (req, res) => {
  const applicationType = await applicationTypeService.createApplicationType(req.body);
  await auditLogService.record(req, {
    category: 'APPLICATION_TYPE',
    action: 'APPLICATION_TYPE_CREATED',
    targetType: 'ApplicationType',
    targetId: applicationType.id,
    details: `Created application type ${applicationType.name}`,
  });
  res.status(201).json(new ApiResponse(201, 'Application type created', { applicationType }));
});

const updateApplicationType = asyncHandler(async (req, res) => {
  const applicationType = await applicationTypeService.updateApplicationType(req.params.id, req.body);
  await auditLogService.record(req, {
    category: 'APPLICATION_TYPE',
    action: 'APPLICATION_TYPE_UPDATED',
    targetType: 'ApplicationType',
    targetId: applicationType.id,
    details: `Updated application type ${applicationType.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Application type updated', { applicationType }));
});

const deactivateApplicationType = asyncHandler(async (req, res) => {
  const applicationType = await applicationTypeService.deactivateApplicationType(req.params.id);
  await auditLogService.record(req, {
    category: 'APPLICATION_TYPE',
    action: 'APPLICATION_TYPE_DELETED',
    targetType: 'ApplicationType',
    targetId: applicationType.id,
    details: `Deactivated application type ${applicationType.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Application type deactivated', { applicationType }));
});

module.exports = {
  listApplicationTypes,
  getApplicationType,
  createApplicationType,
  updateApplicationType,
  deactivateApplicationType,
};
