const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const workingSaturdayService = require('../services/workingSaturday.service');
const auditLogService = require('../services/auditLog.service');

const listWorkingSaturdays = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const workingSaturdays = await workingSaturdayService.listWorkingSaturdays({ from, to });
  res.status(200).json(new ApiResponse(200, 'Working Saturdays fetched', { workingSaturdays }));
});

const createWorkingSaturday = asyncHandler(async (req, res) => {
  const workingSaturday = await workingSaturdayService.createWorkingSaturday(req.body);
  await auditLogService.record(req, {
    category: 'HOLIDAY',
    action: 'WORKING_SATURDAY_CREATED',
    targetType: 'WorkingSaturday',
    targetId: workingSaturday.id,
    details: `Marked ${workingSaturday.date.toISOString().slice(0, 10)} as a working Saturday`,
  });
  res.status(201).json(new ApiResponse(201, 'Working Saturday created', { workingSaturday }));
});

const deleteWorkingSaturday = asyncHandler(async (req, res) => {
  await workingSaturdayService.deleteWorkingSaturday(req.params.id);
  await auditLogService.record(req, {
    category: 'HOLIDAY',
    action: 'WORKING_SATURDAY_DELETED',
    targetType: 'WorkingSaturday',
    targetId: req.params.id,
  });
  res.status(200).json(new ApiResponse(200, 'Working Saturday removed'));
});

module.exports = { listWorkingSaturdays, createWorkingSaturday, deleteWorkingSaturday };
