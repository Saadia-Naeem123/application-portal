const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const applicationService = require('../services/application.service');
const trackingService = require('../services/tracking.service');

const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(req.user, req.body);
  const message = application.status === 'DRAFT' ? 'Application saved as draft' : 'Application submitted';
  res.status(201).json(new ApiResponse(201, message, { application }));
});

const listMyApplications = asyncHandler(async (req, res) => {
  const { status, page, pageSize } = req.query;
  const result = await applicationService.listMyApplications(req.user, { status, page, pageSize });
  res.status(200).json(new ApiResponse(200, 'Applications fetched', result));
});

const getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationForViewer(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Application fetched', { application }));
});

const updateApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplication(req.params.id, req.user, req.body);
  res.status(200).json(new ApiResponse(200, 'Application updated', { application }));
});

const submitApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.submitApplication(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Application submitted', { application }));
});

const deleteApplication = asyncHandler(async (req, res) => {
  await applicationService.deleteApplication(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Draft application deleted'));
});

const addAttachments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'At least one file is required');
  }
  const attachments = await applicationService.addAttachments(req.params.id, req.user, req.files);
  res.status(201).json(new ApiResponse(201, 'Attachments uploaded', { attachments }));
});

const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await applicationService.getAttachmentForDownload(
    req.params.id,
    req.params.attachmentId,
    req.user
  );
  res.download(path.resolve(attachment.filePath), attachment.fileName);
});

const deleteAttachment = asyncHandler(async (req, res) => {
  await applicationService.deleteAttachment(req.params.id, req.params.attachmentId, req.user);
  res.status(200).json(new ApiResponse(200, 'Attachment removed'));
});

// Phase 8 — "Application tracking" / "Status timeline": a friendlier,
// tracker-shaped view of the same data already exposed by /:id/history,
// with a progress percentage a UI can render directly as a progress bar.
const trackApplication = asyncHandler(async (req, res) => {
  const tracking = await trackingService.getTrackingTimeline(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Tracking timeline fetched', { tracking }));
});

module.exports = {
  createApplication,
  listMyApplications,
  getApplication,
  updateApplication,
  submitApplication,
  deleteApplication,
  addAttachments,
  downloadAttachment,
  deleteAttachment,
  trackApplication,
};
