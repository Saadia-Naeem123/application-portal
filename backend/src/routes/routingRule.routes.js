const express = require('express');
const routingRuleController = require('../controllers/routingRule.controller');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { updateRoutingRuleValidator } = require('../utils/validators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticate, requireRole(ROLES.ADMIN), routingRuleController.listRoutingRules);
router.patch(
  '/:applicationTypeId',
  authenticate,
  requireRole(ROLES.ADMIN),
  updateRoutingRuleValidator,
  validate,
  routingRuleController.updateRoutingRule
);

module.exports = router;
