const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listSemesterBreaks({ includeInactive = false } = {}) {
  return prisma.semesterBreak.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { startDate: 'asc' },
  });
}

async function getSemesterBreakById(id) {
  const semesterBreak = await prisma.semesterBreak.findUnique({ where: { id } });
  if (!semesterBreak) {
    throw new ApiError(404, 'Semester break not found');
  }
  return semesterBreak;
}

async function createSemesterBreak({ name, startDate, endDate }) {
  if (new Date(startDate) > new Date(endDate)) {
    throw new ApiError(400, 'Start date must be before end date');
  }
  return prisma.semesterBreak.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
  });
}

async function updateSemesterBreak(id, { name, startDate, endDate, isActive }) {
  await getSemesterBreakById(id);
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new ApiError(400, 'Start date must be before end date');
  }
  return prisma.semesterBreak.update({
    where: { id },
    data: {
      name,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive,
    },
  });
}

async function deleteSemesterBreak(id) {
  await getSemesterBreakById(id);
  await prisma.semesterBreak.delete({ where: { id } });
}

module.exports = {
  listSemesterBreaks,
  getSemesterBreakById,
  createSemesterBreak,
  updateSemesterBreak,
  deleteSemesterBreak,
};
