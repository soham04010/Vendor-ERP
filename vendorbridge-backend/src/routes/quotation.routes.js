const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorize('admin', 'officer', 'manager', 'vendor'), quotationController.getQuotations);
router.get('/:id', authorize('admin', 'officer', 'manager', 'vendor'), quotationController.getQuotationById);
router.post('/', authorize('vendor'), quotationController.submitQuotation);
router.put('/:id', authorize('vendor'), quotationController.updateQuotation);
router.patch('/:id/select', authorize('admin', 'officer'), quotationController.selectWinner);
router.patch('/:id/reject', authorize('admin', 'officer'), quotationController.rejectQuotation);

module.exports = router;
