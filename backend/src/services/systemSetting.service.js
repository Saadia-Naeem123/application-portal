const prisma = require('../config/db');

const SETTINGS_ID = 1;

// Same defaults as the schema.prisma column defaults — used so callers that
// need the reminder/escalation numbers (reminder.service.js) get sane
// values even before the singleton row exists.
const DEFAULTS = {
  reminderThresholdHours: [24, 48, 60],
  finalWarningMarginHours: 6,
  workingDayStartHour: 9,
  workingDayEndHour: 17,
  maxUploadSizeMb: 10,
  universityName: '',
  universityContactEmail: '',
  supportPhone: '',
  passwordMinLength: 8,
  sessionTimeoutMinutes: 60,
  backupFrequency: 'DAILY',
  backupRetentionDays: 30,
};

// Created lazily on first read/write, same pattern as
// notification.service.js#getOrCreatePreferences — no seed step required.
async function getSettings() {
  const existing = await prisma.systemSetting.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.systemSetting.create({ data: { id: SETTINGS_ID, ...DEFAULTS } });
}

const EDITABLE_FIELDS = Object.keys(DEFAULTS);

async function updateSettings(user, payload) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  data.updatedById = user.id;

  await getSettings(); // ensure the row exists before updating it
  return prisma.systemSetting.update({ where: { id: SETTINGS_ID }, data });
}

module.exports = { getSettings, updateSettings, DEFAULTS };
