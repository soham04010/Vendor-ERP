const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('admin', 'officer', 'manager'));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/spending', analyticsController.getSpending);
router.get('/vendors', analyticsController.getVendors);
router.get('/rfqs', analyticsController.getRfqs);
router.get('/approvals', analyticsController.getApprovals);
router.get('/export', analyticsController.exportCsv);

module.exports = router;
