const express = require('express');
const holidayController = require('../controllers/holiday.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createHolidayValidator, updateHolidayValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, holidayController.listHolidays);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  createHolidayValidator,
  validate,
  holidayController.createHoliday
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateHolidayValidator,
  validate,
  holidayController.updateHoliday
);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), holidayController.deleteHoliday);

module.exports = router;
