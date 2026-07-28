const prisma = require('../config/db');
const { REMINDER_CHANNEL } = require('../constants/reminderChannel');
const { WORKFLOW_ACTION } = require('../constants/workflowAction');
const workflowService = require('./workflow.service');
const workingHoursService = require('./workingHours.service');
const systemSettingService = require('./systemSetting.service');

async function thresholdsFor(slaWorkingHours) {
  // Admin-configurable via System Settings (Administrator Portal); falls
  // back to the schema's own defaults if the settings row can't be read.
  const settings = await systemSettingService.getSettings().catch(() => systemSettingService.DEFAULTS);
  const fixedThresholds = settings.reminderThresholdHours || systemSettingService.DEFAULTS.reminderThresholdHours;
  const finalWarningMargin = settings.finalWarningMarginHours ?? systemSettingService.DEFAULTS.finalWarningMarginHours;

  const thresholds = fixedThresholds.filter((h) => h < slaWorkingHours);
  const finalWarning = slaWorkingHours - finalWarningMargin;
  if (finalWarning > 0 && !thresholds.includes(finalWarning)) {
    thresholds.push(finalWarning);
  }
  return thresholds.sort((a, b) => a - b);
}

async function alreadySent(applicationId, hoursElapsed, sinceDate) {
  const existing = await prisma.applicationReminder.findFirst({
    where: { applicationId, hoursElapsed, sentAt: { gte: sinceDate } },
  });
  return Boolean(existing);
}

async function sendReminder(application, recipient, hoursElapsed) {
  const remaining = Math.max(application.applicationType.slaWorkingHours - hoursElapsed, 0);
  await workflowService.notify([recipient], {
    applicationId: application.id,
    applicationNumber: application.applicationNumber,
    type: 'REMINDER',
    title: 'Reminder: application awaiting your review',
    message: `Application ${application.applicationNumber} has been waiting ${hoursElapsed} working hours. Approximately ${remaining} working hours remain before it is escalated.`,
  });

  await prisma.applicationReminder.create({
    data: { applicationId: application.id, recipientId: recipient.id, hoursElapsed, channel: REMINDER_CHANNEL.EMAIL },
  });

  await workflowService.recordHistory(application.id, {
    action: WORKFLOW_ACTION.REMINDER_SENT,
    remarks: `Reminder sent to ${recipient.fullName} at ${hoursElapsed} working hours elapsed`,
  });
}

// Checks every application currently sitting in someone's review queue and
// sends any reminder thresholds that have been crossed since the current
// stage started but haven't been sent yet. Called hourly by
// jobs/reminder.job.js, and exposed for an admin "run now" endpoint.
async function runReminderSweep() {
  const pending = await prisma.application.findMany({
    where: {
      status: { in: workflowService.ACTIVE_REVIEW_STATUSES },
      deadlineAt: { gt: new Date() },
      lastActionAt: { not: null },
    },
    include: workflowService.WITH_RELATIONS,
  });

  const results = [];
  for (const application of pending) {
    // eslint-disable-next-line no-await-in-loop
    const elapsed = await workingHoursService.computeElapsedWorkingHours(application.lastActionAt, new Date());
    const thresholds = await thresholdsFor(application.applicationType.slaWorkingHours);
    const crossed = thresholds.filter((h) => elapsed >= h);
    if (crossed.length === 0) continue; // eslint-disable-line no-continue

    // eslint-disable-next-line no-await-in-loop
    const recipients = await workflowService.resolveStageRecipients(application, application.currentStage);
    if (recipients.length === 0) continue; // eslint-disable-line no-continue

    for (const threshold of crossed) {
      // eslint-disable-next-line no-await-in-loop
      if (await alreadySent(application.id, threshold, application.lastActionAt)) continue; // eslint-disable-line no-continue
      for (const recipient of recipients) {
        // eslint-disable-next-line no-await-in-loop
        await sendReminder(application, recipient, threshold);
      }
      results.push({ applicationId: application.id, threshold, recipientCount: recipients.length });
    }
  }
  return results;
}

module.exports = { thresholdsFor, runReminderSweep };
