const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const semesterBreakService = require('../services/semesterBreak.service');

const listSemesterBreaks = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'ADMIN' && req.query.includeInactive === 'true';
  const semesterBreaks = await semesterBreakService.listSemesterBreaks({ includeInactive });
  res.status(200).json(new ApiResponse(200, 'Semester breaks fetched', { semesterBreaks }));
});

const createSemesterBreak = asyncHandler(async (req, res) => {
  const semesterBreak = await semesterBreakService.createSemesterBreak(req.body);
  res.status(201).json(new ApiResponse(201, 'Semester break created', { semesterBreak }));
});

const updateSemesterBreak = asyncHandler(async (req, res) => {
  const semesterBreak = await semesterBreakService.updateSemesterBreak(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Semester break updated', { semesterBreak }));
});

const deleteSemesterBreak = asyncHandler(async (req, res) => {
  await semesterBreakService.deleteSemesterBreak(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Semester break deleted'));
});

module.exports = { listSemesterBreaks, createSemesterBreak, updateSemesterBreak, deleteSemesterBreak };
