const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listHolidays({ from, to } = {}) {
  return prisma.holiday.findMany({
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

async function getHolidayById(id) {
  const holiday = await prisma.holiday.findUnique({ where: { id } });
  if (!holiday) {
    throw new ApiError(404, 'Holiday not found');
  }
  return holiday;
}

async function createHoliday({ name, date, type }) {
  return prisma.holiday.create({ data: { name, date: new Date(date), type } });
}

async function updateHoliday(id, { name, date, type }) {
  await getHolidayById(id);
  return prisma.holiday.update({
    where: { id },
    data: { name, date: date ? new Date(date) : undefined, type },
  });
}

async function deleteHoliday(id) {
  await getHolidayById(id);
  await prisma.holiday.delete({ where: { id } });
}

module.exports = { listHolidays, getHolidayById, createHoliday, updateHoliday, deleteHoliday };
