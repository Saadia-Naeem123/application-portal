const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const permissionService = require('../services/permission.service');
const { ALL_ROLES } = require('../constants/roles');

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.listPermissions();
  res.status(200).json(new ApiResponse(200, 'Permissions fetched', { permissions }));
});

const setPermission = asyncHandler(async (req, res) => {
  const { role, resource } = req.params;
  if (!ALL_ROLES.includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }
  const permission = await permissionService.setPermission(role, resource, req.body);
  res.status(200).json(new ApiResponse(200, 'Permission updated', { permission }));
});

module.exports = { listPermissions, setPermission };
