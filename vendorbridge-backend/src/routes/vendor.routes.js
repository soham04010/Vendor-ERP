const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorize('admin', 'officer', 'manager'), vendorController.getVendors);
router.post('/', authorize('admin', 'officer'), vendorController.createVendor);
router.get('/:id', authorize('admin', 'officer', 'manager', 'vendor'), vendorController.getVendorById);
router.put('/:id', authorize('admin', 'officer', 'vendor'), vendorController.updateVendor);
router.patch('/:id/status', authorize('admin', 'officer'), vendorController.updateVendorStatus);
router.get('/:id/history', authorize('admin', 'officer', 'manager'), vendorController.getVendorHistory);
router.get('/:id/quotations', authorize('admin', 'officer', 'manager', 'vendor'), vendorController.getVendorQuotations);

module.exports = router;
