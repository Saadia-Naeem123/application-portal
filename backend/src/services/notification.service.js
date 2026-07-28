const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ALL_NOTIFICATION_TYPES } = require('../constants/notificationType');

const DEFAULT_PREFERENCES = Object.freeze({
  emailEnabled: true,
  inAppEnabled: true,
  smsEnabled: false,
  mutedTypes: [],
});

async function createNotification({ userId, applicationId = null, type, title, message, channels = ['IN_APP'] }) {
  return prisma.notification.create({
    data: { userId, applicationId, type, title, message, channels },
  });
}

// Fans the same notification out to several recipients at once (e.g. every
// department officer for a department, or "applicant + old reviewer + new
// reviewer" on an escalation). Silently skips a duplicate-free list rather
// than requiring callers to dedupe first. `channelsByUserId` lets a caller
// (workflow.service.js#notify) record a different set of delivered channels
// per recipient, since preferences vary per user; recipients not present in
// the map fall back to the IN_APP default.
async function notifyMany(userIds, { applicationId = null, type, title, message }, channelsByUserId = {}) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      applicationId,
      type,
      title,
      message,
      channels: channelsByUserId[userId] || ['IN_APP'],
    })),
  });
  return uniqueIds;
}

async function listMyNotifications(user, { isRead, type, page = 1, pageSize = 20 } = {}) {
  const where = {
    userId: user.id,
    ...(isRead === undefined ? {} : { isRead: isRead === 'true' || isRead === true }),
    ...(type ? { type } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page: Number(page), pageSize: Number(pageSize) };
}

// Lightweight endpoint for a dashboard bell icon — just the count, no
// pagination, so it can be polled cheaply.
async function getUnreadCount(user) {
  const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  return { unreadCount };
}

async function markAsRead(id, user) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.id) {
    throw new ApiError(404, 'Notification not found');
  }
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

async function markAllAsRead(user) {
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
}

// --- Phase 7: notification preferences ---

// Returns the user's preference row, creating it with defaults on first
// access so every account has one without needing a registration-time seed
// step. Safe to call from the hot notify() path as well as the GET
// /notifications/preferences endpoint.
async function getOrCreatePreferences(userId) {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.notificationPreference.create({ data: { userId, ...DEFAULT_PREFERENCES } });
}

async function updatePreferences(userId, { emailEnabled, inAppEnabled, smsEnabled, mutedTypes }) {
  if (mutedTypes !== undefined) {
    const invalid = mutedTypes.filter((t) => !ALL_NOTIFICATION_TYPES.includes(t));
    if (invalid.length > 0) {
      throw new ApiError(400, `Unknown notification type(s): ${invalid.join(', ')}`);
    }
  }

  await getOrCreatePreferences(userId); // ensures a row exists to update

  return prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(emailEnabled === undefined ? {} : { emailEnabled }),
      ...(inAppEnabled === undefined ? {} : { inAppEnabled }),
      ...(smsEnabled === undefined ? {} : { smsEnabled }),
      ...(mutedTypes === undefined ? {} : { mutedTypes }),
    },
  });
}

// Batch-loads preferences for a set of recipients ahead of a notify() call,
// falling back to defaults for anyone without a row yet — avoids writing a
// preference row on every single notification just to read it back.
async function getPreferencesMap(userIds) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const rows = await prisma.notificationPreference.findMany({ where: { userId: { in: uniqueIds } } });
  const map = new Map(rows.map((row) => [row.userId, row]));
  for (const id of uniqueIds) {
    if (!map.has(id)) map.set(id, { userId: id, ...DEFAULT_PREFERENCES });
  }
  return map;
}

module.exports = {
  createNotification,
  notifyMany,
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getOrCreatePreferences,
  updatePreferences,
  getPreferencesMap,
};
