const express = require('express');
const applicationController = require('../controllers/application.controller');
const workflowController = require('../controllers/workflow.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { upload, commentUpload } = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');
const {
  createApplicationValidator,
  updateApplicationValidator,
  approveApplicationValidator,
  rejectApplicationValidator,
  requestInfoValidator,
  provideInfoValidator,
  forwardApplicationValidator,
  addCommentValidator,
  escalateApplicationValidator,
  returnToDepartmentValidator,
  requestInvestigationValidator,
} = require('../utils/validators');

const router = express.Router();

router.use(authenticate);

// Per the role permission matrix, only Student/Faculty/Staff/Academic
// Supervisor may submit applications — Department Officer, Dean, and Admin
// are reviewers/administrators, not applicants, and should never be able to
// create or submit one of their own. Applies to the whole "authoring" a
// draft goes through: create, edit, attach files, submit, withdraw.
const canAuthorApplications = requireRole(
  ROLES.STUDENT,
  ROLES.FACULTY,
  ROLES.STAFF,
  ROLES.ACADEMIC_SUPERVISOR
);

router.post(
  '/',
  canAuthorApplications,
  createApplicationValidator,
  validate,
  applicationController.createApplication
);
router.get('/', applicationController.listMyApplications);
router.get('/:id', applicationController.getApplication);
router.patch(
  '/:id',
  canAuthorApplications,
  updateApplicationValidator,
  validate,
  applicationController.updateApplication
);
router.patch('/:id/submit', canAuthorApplications, applicationController.submitApplication);
router.delete('/:id', canAuthorApplications, applicationController.deleteApplication);

// Phase 8: friendly tracking/status-timeline view for the applicant-facing progress tracker.
router.get('/:id/tracking', applicationController.trackApplication);

router.post(
  '/:id/attachments',
  canAuthorApplications,
  upload.array('files', 5),
  applicationController.addAttachments
);
router.get('/:id/attachments/:attachmentId/download', applicationController.downloadAttachment);
router.delete(
  '/:id/attachments/:attachmentId',
  canAuthorApplications,
  applicationController.deleteAttachment
);

// --- Phase 5: Workflow — approval actions, comments, activity timeline ---

router.get('/:id/workflow', workflowController.getWorkflowStatus);
router.get('/:id/history', workflowController.listHistory);
router.get('/:id/comments', workflowController.listComments);
// commentUpload runs first so multer parses the multipart body (including
// the `message` text field) before express-validator inspects req.body.
router.post(
  '/:id/comments',
  commentUpload.array('attachments', 3),
  addCommentValidator,
  validate,
  workflowController.addComment
);
router.get('/:id/comments/:commentId/attachments/:attachmentId/download', workflowController.downloadCommentAttachment);

router.patch('/:id/approve', approveApplicationValidator, validate, workflowController.approveApplication);
router.patch('/:id/reject', rejectApplicationValidator, validate, workflowController.rejectApplication);
router.patch('/:id/request-info', requestInfoValidator, validate, workflowController.requestInfo);
router.patch('/:id/provide-info', provideInfoValidator, validate, workflowController.provideInfo);
router.patch('/:id/forward', forwardApplicationValidator, validate, workflowController.forwardApplication);
router.patch('/:id/close', workflowController.closeApplication);

// --- Phase 10: Dean Portal — decisions on an escalated (DEAN-stage) application ---
router.patch(
  '/:id/return-to-department',
  requireRole(ROLES.DEAN, ROLES.ADMIN),
  returnToDepartmentValidator,
  validate,
  workflowController.returnToDepartment
);
router.patch(
  '/:id/request-investigation',
  requireRole(ROLES.DEAN, ROLES.ADMIN),
  requestInvestigationValidator,
  validate,
  workflowController.requestInvestigation
);

// --- Phase 6: manual escalation (admin override, ahead of automatic sweep) ---
router.patch(
  '/:id/escalate',
  requireRole(ROLES.ADMIN),
  escalateApplicationValidator,
  validate,
  workflowController.escalateApplication
);

module.exports = router;
