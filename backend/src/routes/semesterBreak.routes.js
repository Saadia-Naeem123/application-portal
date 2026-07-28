const express = require('express');
const semesterBreakController = require('../controllers/semesterBreak.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createSemesterBreakValidator,
  updateSemesterBreakValidator,
} = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, semesterBreakController.listSemesterBreaks);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  createSemesterBreakValidator,
  validate,
  semesterBreakController.createSemesterBreak
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateSemesterBreakValidator,
  validate,
  semesterBreakController.updateSemesterBreak
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  semesterBreakController.deleteSemesterBreak
);

module.exports = router;
