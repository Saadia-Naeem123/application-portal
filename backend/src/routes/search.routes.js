const express = require('express');
const authenticate = require('../middleware/auth.middleware');
const searchController = require('../controllers/search.controller');

const router = express.Router();

router.use(authenticate);

// Advanced search & multi-level filters (Application ID, applicant name,
// registration/employee number, department, supervisor, type, priority,
// status, assigned officer, date range, overdue/near-deadline).
router.get('/applications', searchController.search);

// Same filters, streamed as a file instead of paginated JSON.
router.get('/applications/export', searchController.exportSearch);

module.exports = router;
