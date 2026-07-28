const express = require('express');
const calendarController = require('../controllers/calendar.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticate, calendarController.getCalendar);

module.exports = router;
