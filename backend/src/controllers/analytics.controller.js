const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const analyticsService = require('../services/analytics.service');
const exportService = require('../services/export.service');
const {
  DEPARTMENT_REPORT_COLUMNS,
  SUPERVISOR_REPORT_COLUMNS,
  OVERVIEW_REPORT_COLUMNS,
} = require('../utils/exportFormatters');

const getOverview = asyncHandler(async (req, res) => {
  const { departmentId, from, to } = req.query;
  const data = await analyticsService.getOverview(req.user, { departmentId, from, to });
  res.status(200).json(new ApiResponse(200, 'Analytics overview fetched', data));
});

const getDepartmentReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const departments = await analyticsService.getDepartmentReport(req.user, { from, to });
  res.status(200).json(new ApiResponse(200, 'Department performance report fetched', { departments }));
});

const getDeanOverview = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const data = await analyticsService.getDeanOverview(req.user, { from, to });
  res.status(200).json(new ApiResponse(200, 'Dean overview fetched', data));
});

const getAdminOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAdminOverview(req.user);
  res.status(200).json(new ApiResponse(200, 'Admin overview fetched', data));
});

const getSupervisorReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const supervisors = await analyticsService.getSupervisorReport(req.user, { from, to });
  res.status(200).json(new ApiResponse(200, 'Supervisor performance report fetched', { supervisors }));
});

function overviewToRows(overview) {
  return [
    { metric: 'Total Applications', value: overview.totals.total },
    { metric: 'Pending', value: overview.totals.pending },
    { metric: 'Approved', value: overview.totals.approved },
    { metric: 'Rejected', value: overview.totals.rejected },
    { metric: 'Escalated', value: overview.totals.escalated },
    { metric: 'Closed', value: overview.totals.closed },
    { metric: 'Overdue', value: overview.totals.overdue },
    { metric: 'Near Deadline (next 24h)', value: overview.totals.nearDeadline },
    { metric: 'Avg Resolution Time (hours)', value: overview.avgResolutionHours },
  ];
}

async function sendReport(res, format, fileBase, title, columns, rows) {
  if (format === 'pdf') {
    return exportService.streamPdfTable(res, { fileName: `${fileBase}.pdf`, title, columns, rows });
  }
  return exportService.streamExcel(res, {
    fileName: `${fileBase}.xlsx`,
    sheetName: title,
    columns,
    rows,
  });
}

const exportReport = asyncHandler(async (req, res) => {
  const { type = 'departments', format = 'xlsx', from, to } = req.query;

  if (type === 'departments') {
    const rows = await analyticsService.getDepartmentReport(req.user, { from, to });
    return sendReport(res, format, 'department-performance', 'Department Performance Report', DEPARTMENT_REPORT_COLUMNS, rows);
  }

  if (type === 'supervisors') {
    const rows = await analyticsService.getSupervisorReport(req.user, { from, to });
    return sendReport(res, format, 'supervisor-performance', 'Supervisor Performance Report', SUPERVISOR_REPORT_COLUMNS, rows);
  }

  if (type === 'overview') {
    const overview = await analyticsService.getOverview(req.user, { from, to });
    return sendReport(res, format, 'analytics-overview', 'Analytics Overview', OVERVIEW_REPORT_COLUMNS, overviewToRows(overview));
  }

  throw new ApiError(400, 'Unknown report type. Use type=overview, type=departments, or type=supervisors.');
});

module.exports = { getOverview, getDepartmentReport, getSupervisorReport, getDeanOverview, getAdminOverview, exportReport };
