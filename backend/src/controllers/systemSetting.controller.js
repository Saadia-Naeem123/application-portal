const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const systemSettingService = require('../services/systemSetting.service');
const auditLogService = require('../services/auditLog.service');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await systemSettingService.getSettings();
  res.status(200).json(new ApiResponse(200, 'System settings fetched', { settings }));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await systemSettingService.updateSettings(req.user, req.body);
  await auditLogService.record(req, {
    category: 'SETTINGS',
    action: 'SETTINGS_UPDATED',
    targetType: 'SystemSetting',
    targetId: '1',
    details: `Updated fields: ${Object.keys(req.body).join(', ')}`,
  });
  res.status(200).json(new ApiResponse(200, 'System settings updated', { settings }));
});

module.exports = { getSettings, updateSettings };
