const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const auditLogService = require('../services/auditLog.service');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { category, action, actorId, from, to, page, pageSize } = req.query;
  const result = await auditLogService.listAuditLogs({ category, action, actorId, from, to, page, pageSize });
  res.status(200).json(new ApiResponse(200, 'Audit logs fetched', result));
});

module.exports = { listAuditLogs };
