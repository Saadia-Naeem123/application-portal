const prisma = require('../config/db');
const logger = require('../utils/logger');

// Persists one audit entry and mirrors it to the file-based audit.log
// (utils/logger.js#audit) so the two trails never disagree. `req` is
// optional — some callers (e.g. a failed login where auth hasn't resolved
// a user yet) still have request context but no `req.user`.
async function record(req, { category, action, targetType, targetId, details, actorId, actorEmail }) {
  const resolvedActorId = actorId ?? req?.user?.id ?? null;
  const resolvedActorEmail = actorEmail ?? req?.user?.email ?? null;
  const ipAddress = req?.ip ?? null;

  logger.audit(action, { category, targetType, targetId, actorId: resolvedActorId, actorEmail: resolvedActorEmail });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: resolvedActorId,
        actorEmail: resolvedActorEmail,
        category,
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    // Audit logging must never take down the request it's describing.
    logger.error('Failed to persist audit log entry', { action, error: err.message });
  }
}

async function listAuditLogs({ category, action, actorId, from, to, page = 1, pageSize = 20 } = {}) {
  const where = {
    ...(category ? { category } : {}),
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, fullName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: Number(page), pageSize: Number(pageSize) };
}

module.exports = { record, listAuditLogs };
