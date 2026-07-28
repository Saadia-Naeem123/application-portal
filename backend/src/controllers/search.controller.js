const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const searchService = require('../services/search.service');
const exportService = require('../services/export.service');
const { APPLICATION_EXPORT_COLUMNS, toApplicationRow } = require('../utils/exportFormatters');

const search = asyncHandler(async (req, res) => {
  const result = await searchService.searchApplications(req.user, req.query);
  res.status(200).json(new ApiResponse(200, 'Search results fetched', result));
});

const exportSearch = asyncHandler(async (req, res) => {
  const { format = 'xlsx' } = req.query;
  const applications = await searchService.searchApplicationsForExport(req.user, req.query);
  const rows = applications.map(toApplicationRow);

  if (format === 'pdf') {
    return exportService.streamPdfTable(res, {
      fileName: 'applications.pdf',
      title: 'Application Search Results',
      columns: APPLICATION_EXPORT_COLUMNS,
      rows,
    });
  }

  return exportService.streamExcel(res, {
    fileName: 'applications.xlsx',
    sheetName: 'Applications',
    columns: APPLICATION_EXPORT_COLUMNS,
    rows,
  });
});

module.exports = { search, exportSearch };
