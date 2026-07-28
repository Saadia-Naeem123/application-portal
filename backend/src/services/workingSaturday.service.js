const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listWorkingSaturdays({ from, to } = {}) {
  return prisma.workingSaturday.findMany({
    where: {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'asc' },
  });
}

async function getWorkingSaturdayById(id) {
  const record = await prisma.workingSaturday.findUnique({ where: { id } });
  if (!record) {
    throw new ApiError(404, 'Working Saturday not found');
  }
  return record;
}

async function createWorkingSaturday({ date, reason }) {
  const parsed = new Date(date);
  if (parsed.getDay() !== 6) {
    throw new ApiError(400, 'That date is not a Saturday');
  }
  const existing = await prisma.workingSaturday.findUnique({ where: { date: parsed } });
  if (existing) {
    throw new ApiError(409, 'This Saturday is already marked as a working day');
  }
  return prisma.workingSaturday.create({ data: { date: parsed, reason } });
}

async function deleteWorkingSaturday(id) {
  await getWorkingSaturdayById(id);
  await prisma.workingSaturday.delete({ where: { id } });
}

module.exports = { listWorkingSaturdays, getWorkingSaturdayById, createWorkingSaturday, deleteWorkingSaturday };
