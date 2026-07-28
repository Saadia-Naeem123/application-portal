const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateNotificationPreferencesValidator } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.listMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

// Phase 7 — per-user notification channel/type preferences.
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', updateNotificationPreferencesValidator, validate, notificationController.updatePreferences);

module.exports = router;
