const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/vendor/mine', authorize('vendor'), invoiceController.getVendorMine);
router.get('/', authorize('admin', 'officer', 'manager', 'vendor'), invoiceController.getInvoices);
router.post('/', authorize('admin', 'officer', 'vendor'), invoiceController.createInvoice);
router.get('/:id', authorize('admin', 'officer', 'manager', 'vendor'), invoiceController.getInvoiceById);
router.get('/:id/pdf', authorize('admin', 'officer', 'manager', 'vendor'), invoiceController.downloadInvoicePDF);
router.post('/:id/send', authorize('admin', 'officer', 'manager', 'vendor'), invoiceController.sendInvoiceEmail);
router.patch('/:id/status', authorize('admin', 'officer', 'manager', 'vendor'), invoiceController.updateInvoiceStatus);

module.exports = router;
