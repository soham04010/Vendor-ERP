const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/pending', authorize('admin', 'manager'), approvalController.getPendingApprovals);
router.get('/history', authorize('admin', 'officer', 'manager'), approvalController.getApprovalHistory);
router.get('/', authorize('admin', 'officer', 'manager'), approvalController.getApprovals);
router.post('/', authorize('admin', 'officer'), approvalController.submitApproval);
router.get('/:id', authorize('admin', 'officer', 'manager'), approvalController.getApprovalById);
router.patch('/:id/approve', authorize('admin', 'manager'), approvalController.approveApproval);
router.patch('/:id/reject', authorize('admin', 'manager'), approvalController.rejectApproval);

module.exports = router;
