const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const workflowService = require('../services/workflow.service');
const escalationService = require('../services/escalation.service');

const approveApplication = asyncHandler(async (req, res) => {
  const application = await workflowService.approveApplication(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Application approved', { application }));
});

const rejectApplication = asyncHandler(async (req, res) => {
  const application = await workflowService.rejectApplication(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Application rejected', { application }));
});

const requestInfo = asyncHandler(async (req, res) => {
  const application = await workflowService.requestInfo(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Additional information requested', { application }));
});

const provideInfo = asyncHandler(async (req, res) => {
  const application = await workflowService.provideInfo(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Information submitted', { application }));
});

const forwardApplication = asyncHandler(async (req, res) => {
  const application = await workflowService.forwardApplication(req.params.id, req.user, req.body);
  res.status(200).json(new ApiResponse(200, 'Application forwarded', { application }));
});

const returnToDepartment = asyncHandler(async (req, res) => {
  const application = await workflowService.returnToDepartment(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Application returned to department', { application }));
});

const requestInvestigation = asyncHandler(async (req, res) => {
  const application = await workflowService.requestInvestigation(req.params.id, req.user, req.body.remarks);
  res.status(200).json(new ApiResponse(200, 'Investigation requested', { application }));
});

const closeApplication = asyncHandler(async (req, res) => {
  const application = await workflowService.closeApplication(req.params.id, req.user, req.body?.remarks);
  res.status(200).json(new ApiResponse(200, 'Application closed', { application }));
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await workflowService.addComment(req.params.id, req.user, req.body.message, req.files || []);
  res.status(201).json(new ApiResponse(201, 'Comment added', { comment }));
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await workflowService.listComments(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Comments fetched', { comments }));
});

const downloadCommentAttachment = asyncHandler(async (req, res) => {
  const attachment = await workflowService.getCommentAttachmentForDownload(
    req.params.id,
    req.params.commentId,
    req.params.attachmentId,
    req.user
  );
  res.download(path.resolve(attachment.filePath), attachment.fileName);
});

const listHistory = asyncHandler(async (req, res) => {
  const history = await workflowService.listHistory(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Activity timeline fetched', { history }));
});

const getWorkflowStatus = asyncHandler(async (req, res) => {
  const workflow = await workflowService.getWorkflowStatus(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Workflow status fetched', { workflow }));
});

const escalateApplication = asyncHandler(async (req, res) => {
  const application = await escalationService.manualEscalate(req.params.id, req.user, req.body.reason);
  res.status(200).json(new ApiResponse(200, 'Application escalated', { application }));
});

module.exports = {
  approveApplication,
  rejectApplication,
  requestInfo,
  provideInfo,
  forwardApplication,
  closeApplication,
  addComment,
  listComments,
  downloadCommentAttachment,
  listHistory,
  getWorkflowStatus,
  escalateApplication,
  returnToDepartment,
  requestInvestigation,
};
