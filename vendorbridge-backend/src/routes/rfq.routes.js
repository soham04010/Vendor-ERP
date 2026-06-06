const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfq.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/vendor/assigned', authorize('vendor'), rfqController.getAssignedRfqs);
router.get('/', authorize('admin', 'officer', 'manager', 'vendor'), rfqController.getRfqs);
router.get('/:id', authorize('admin', 'officer', 'manager', 'vendor'), rfqController.getRfqById);
router.post('/', authorize('admin', 'officer'), rfqController.createRfq);
router.put('/:id', authorize('admin', 'officer'), rfqController.updateRfq);
router.delete('/:id', authorize('admin', 'officer'), rfqController.deleteRfq);
router.post('/:id/vendors', authorize('admin', 'officer'), rfqController.assignVendors);
router.delete('/:id/vendors/:vendorId', authorize('admin', 'officer'), rfqController.removeVendor);
router.patch('/:id/publish', authorize('admin', 'officer'), rfqController.publishRfq);
router.patch('/:id/close', authorize('admin', 'officer'), rfqController.closeRfq);
router.get('/:id/quotations', authorize('admin', 'officer', 'manager'), rfqController.getRfqQuotations);
router.get('/:id/compare', authorize('admin', 'officer', 'manager'), rfqController.compareQuotations);

module.exports = router;
