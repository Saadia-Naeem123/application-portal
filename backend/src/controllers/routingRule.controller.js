const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const applicationTypeService = require('../services/applicationType.service');
const auditLogService = require('../services/auditLog.service');

// Routing rules are just ApplicationType.departmentId / .requiresSupervisorApproval,
// exposed under a name that matches the "Routing rule management" admin task.
const listRoutingRules = asyncHandler(async (req, res) => {
  const rules = await applicationTypeService.listRoutingRules();
  res.status(200).json(new ApiResponse(200, 'Routing rules fetched', { rules }));
});

const updateRoutingRule = asyncHandler(async (req, res) => {
  const applicationType = await applicationTypeService.updateRoutingRule(req.params.applicationTypeId, req.body);
  await auditLogService.record(req, {
    category: 'ROUTING_RULE',
    action: 'ROUTING_RULE_UPDATED',
    targetType: 'ApplicationType',
    targetId: applicationType.id,
    details: `Routing rule updated for ${applicationType.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Routing rule updated', { applicationType }));
});

module.exports = { listRoutingRules, updateRoutingRule };
