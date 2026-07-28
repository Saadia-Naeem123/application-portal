const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const holidayService = require('../services/holiday.service');
const auditLogService = require('../services/auditLog.service');

const listHolidays = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const holidays = await holidayService.listHolidays({ from, to });
  res.status(200).json(new ApiResponse(200, 'Holidays fetched', { holidays }));
});

const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.body);
  await auditLogService.record(req, {
    category: 'HOLIDAY',
    action: 'HOLIDAY_CREATED',
    targetType: 'Holiday',
    targetId: holiday.id,
    details: `Created holiday ${holiday.name}`,
  });
  res.status(201).json(new ApiResponse(201, 'Holiday created', { holiday }));
});

const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(req.params.id, req.body);
  await auditLogService.record(req, {
    category: 'HOLIDAY',
    action: 'HOLIDAY_UPDATED',
    targetType: 'Holiday',
    targetId: holiday.id,
    details: `Updated holiday ${holiday.name}`,
  });
  res.status(200).json(new ApiResponse(200, 'Holiday updated', { holiday }));
});

const deleteHoliday = asyncHandler(async (req, res) => {
  await holidayService.deleteHoliday(req.params.id);
  await auditLogService.record(req, {
    category: 'HOLIDAY',
    action: 'HOLIDAY_DELETED',
    targetType: 'Holiday',
    targetId: req.params.id,
  });
  res.status(200).json(new ApiResponse(200, 'Holiday deleted'));
});

module.exports = { listHolidays, createHoliday, updateHoliday, deleteHoliday };
