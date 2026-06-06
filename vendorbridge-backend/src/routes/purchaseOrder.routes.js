const express = require('express');
const router = express.Router();
const poController = require('../controllers/purchaseOrder.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/vendor/mine', authorize('vendor'), poController.getVendorMine);
router.get('/', authorize('admin', 'officer', 'manager', 'vendor'), poController.getPurchaseOrders);
router.post('/', authorize('admin', 'officer'), poController.createPurchaseOrder);
router.get('/:id', authorize('admin', 'officer', 'manager', 'vendor'), poController.getPurchaseOrderById);
router.patch('/:id/status', authorize('admin', 'officer', 'vendor'), poController.updatePOStatus);

module.exports = router;
