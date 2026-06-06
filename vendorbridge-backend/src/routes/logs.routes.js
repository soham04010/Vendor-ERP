const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', protect, authorize('admin', 'manager'), logsController.getLogs);

module.exports = router;
