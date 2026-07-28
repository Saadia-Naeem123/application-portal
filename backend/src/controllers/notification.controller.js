const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const listMyNotifications = asyncHandler(async (req, res) => {
  const { isRead, type, page, pageSize } = req.query;
  const result = await notificationService.listMyNotifications(req.user, { isRead, type, page, pageSize });
  res.status(200).json(new ApiResponse(200, 'Notifications fetched', result));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);
  res.status(200).json(new ApiResponse(200, 'Unread count fetched', result));
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Notification marked as read', { notification }));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user);
  res.status(200).json(new ApiResponse(200, 'All notifications marked as read'));
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.getOrCreatePreferences(req.user.id);
  res.status(200).json(new ApiResponse(200, 'Notification preferences fetched', { preferences }));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.updatePreferences(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Notification preferences updated', { preferences }));
});

module.exports = {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
};
