const { eq, and, ne, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { approvals, quotations, rfqs, vendors, users, purchase_orders } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');
const generatePONumber = require('../utils/generatePONumber');

// @desc    Get all approvals
// @route   GET /api/approvals
// @access  Private (Admin, Officer, Manager)
exports.getApprovals = async (req, res) => {
  try {
    const allApprovals = await db.select({
      id: approvals.id,
      quotation_id: approvals.quotation_id,
      rfq_id: approvals.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_name: vendors.name,
      submitted_by_name: users.name,
      status: approvals.status,
      remarks: approvals.remarks,
      submitted_at: approvals.submitted_at,
      reviewed_at: approvals.reviewed_at
    })
    .from(approvals)
    .innerJoin(rfqs, eq(rfqs.id, approvals.rfq_id))
    .innerJoin(quotations, eq(quotations.id, approvals.quotation_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .innerJoin(users, eq(users.id, approvals.submitted_by))
    .orderBy(desc(approvals.submitted_at));

    res.json(allApprovals);
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Submit an approval request
// @route   POST /api/approvals
// @access  Private (Admin, Officer)
exports.submitApproval = async (req, res) => {
  try {
    const { quotation_id, rfq_id, remarks } = req.body;

    if (!quotation_id || !rfq_id) {
      return res.status(400).json({ error: 'Quotation ID and RFQ ID are required' });
    }

    // Verify quotation exists and is selected
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotation_id));
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const [managerUser] = await db.select().from(users).where(and(eq(users.role, 'manager'), eq(users.is_active, true))).limit(1);

    const [newApproval] = await db.insert(approvals).values({
      quotation_id,
      rfq_id,
      submitted_by: req.user.id,
      assigned_to: managerUser ? managerUser.id : null,
      status: 'pending',
      remarks: remarks || 'Awaiting review'
    }).returning();

    if (managerUser) {
      await createNotification({
        userId: managerUser.id,
        title: 'Approval Request',
        message: `Approval request submitted for RFQ Quotation by ${req.user.role}`,
        type: 'approval_request',
        entityId: newApproval.id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'APPROVAL_SUBMITTED',
      entityType: 'approvals',
      entityId: newApproval.id,
      description: `Submitted approval request for quotation ${quotation_id}`
    });

    res.status(201).json(newApproval);
  } catch (error) {
    console.error('Submit approval error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get approval by ID
// @route   GET /api/approvals/:id
// @access  Private (Admin, Officer, Manager)
exports.getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;

    const [approval] = await db.select({
      id: approvals.id,
      quotation_id: approvals.quotation_id,
      rfq_id: approvals.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_name: vendors.name,
      submitted_by_name: users.name,
      status: approvals.status,
      remarks: approvals.remarks,
      submitted_at: approvals.submitted_at,
      reviewed_at: approvals.reviewed_at
    })
    .from(approvals)
    .innerJoin(rfqs, eq(rfqs.id, approvals.rfq_id))
    .innerJoin(quotations, eq(quotations.id, approvals.quotation_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .innerJoin(users, eq(users.id, approvals.submitted_by))
    .where(eq(approvals.id, id));

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json(approval);
  } catch (error) {
    console.error('Get approval by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Approve approval request (Auto-generates PO)
// @route   PATCH /api/approvals/:id/approve
// @access  Private (Admin, Manager)
exports.approveApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const [approval] = await db.select().from(approvals).where(eq(approvals.id, id));
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request is already processed' });
    }

    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, approval.quotation_id));
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, approval.rfq_id));

    const poNumber = await generatePONumber();

    const result = await db.transaction(async (tx) => {
      // 1. Update approval status
      const [updatedApproval] = await tx.update(approvals)
        .set({
          status: 'approved',
          remarks: remarks || 'Approved by Manager',
          reviewed_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(approvals.id, id))
        .returning();

      // 2. Update quotation status
      await tx.update(quotations)
        .set({ status: 'approved', updated_at: new Date() })
        .where(eq(quotations.id, approval.quotation_id));

      // 3. Auto-generate Purchase Order
      const [newPo] = await tx.insert(purchase_orders).values({
        po_number: poNumber,
        rfq_id: approval.rfq_id,
        quotation_id: approval.quotation_id,
        approval_id: id,
        vendor_id: quotation.vendor_id,
        total_amount: quotation.total_amount,
        delivery_date: quotation.validity_date || null,
        status: 'issued',
        created_by: req.user.id
      }).returning();

      return { updatedApproval, newPo };
    });

    // Notify submitting officer
    await createNotification({
      userId: approval.submitted_by,
      title: 'Quotation Approved',
      message: `Your selection for RFQ ${rfq.rfq_number} has been approved. PO ${result.newPo.po_number} has been generated.`,
      type: 'approval_approved',
      entityId: id
    });

    // Notify vendor users
    const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, quotation.vendor_id));
    for (const u of vendorUsers) {
      await createNotification({
        userId: u.id,
        title: 'Purchase Order Issued',
        message: `Congratulations! A Purchase Order (${result.newPo.po_number}) has been issued to you for RFQ ${rfq.rfq_number}.`,
        type: 'po_issued',
        entityId: result.newPo.id
      });
    }

    // Write logs
    await createLog({
      userId: req.user.id,
      action: 'APPROVAL_APPROVED',
      entityType: 'approvals',
      entityId: id,
      description: `Approved quotation select for RFQ ${rfq.rfq_number}`
    });

    await createLog({
      userId: req.user.id,
      action: 'PO_GENERATED',
      entityType: 'purchase_orders',
      entityId: result.newPo.id,
      description: `Auto-generated Purchase Order ${result.newPo.po_number} upon approval`
    });

    res.json({
      message: 'Approval processed and Purchase Order generated successfully.',
      approval: result.updatedApproval,
      purchase_order: result.newPo
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Reject approval request
// @route   PATCH /api/approvals/:id/reject
// @access  Private (Admin, Manager)
exports.rejectApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ error: 'Remarks are required when rejecting approval requests' });
    }

    const [approval] = await db.select().from(approvals).where(eq(approvals.id, id));
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request is already processed' });
    }

    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, approval.quotation_id));
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, approval.rfq_id));

    const result = await db.transaction(async (tx) => {
      const [updatedApproval] = await tx.update(approvals)
        .set({
          status: 'rejected',
          remarks,
          reviewed_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(approvals.id, id))
        .returning();

      // Reset quotation status to submitted (or keep rejected)
      await tx.update(quotations)
        .set({ status: 'rejected', is_selected: false, updated_at: new Date() })
        .where(eq(quotations.id, approval.quotation_id));

      return updatedApproval;
    });

    // Notify submitting officer
    await createNotification({
      userId: approval.submitted_by,
      title: 'Quotation Selection Rejected',
      message: `Your selection for RFQ ${rfq.rfq_number} was rejected by the manager. Remarks: ${remarks}`,
      type: 'approval_rejected',
      entityId: id
    });

    // Notify vendor users
    const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, quotation.vendor_id));
    for (const u of vendorUsers) {
      await createNotification({
        userId: u.id,
        title: 'Quotation Status Update',
        message: `Your quotation for RFQ ${rfq.rfq_number} was reviewed and rejected.`,
        type: 'quotation_rejected',
        entityId: quotation.id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'APPROVAL_REJECTED',
      entityType: 'approvals',
      entityId: id,
      description: `Rejected selection for RFQ ${rfq.rfq_number}. Remarks: ${remarks}`
    });

    res.json(result);
  } catch (error) {
    console.error('Reject approval error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get pending approvals
// @route   GET /api/approvals/pending
// @access  Private (Admin, Manager)
exports.getPendingApprovals = async (req, res) => {
  try {
    const pending = await db.select({
      id: approvals.id,
      quotation_id: approvals.quotation_id,
      rfq_id: approvals.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_name: vendors.name,
      submitted_by_name: users.name,
      status: approvals.status,
      remarks: approvals.remarks,
      submitted_at: approvals.submitted_at
    })
    .from(approvals)
    .innerJoin(rfqs, eq(rfqs.id, approvals.rfq_id))
    .innerJoin(quotations, eq(quotations.id, approvals.quotation_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .innerJoin(users, eq(users.id, approvals.submitted_by))
    .where(eq(approvals.status, 'pending'))
    .orderBy(desc(approvals.submitted_at));

    res.json(pending);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get approval history (non-pending approvals)
// @route   GET /api/approvals/history
// @access  Private (Admin, Officer, Manager)
exports.getApprovalHistory = async (req, res) => {
  try {
    const history = await db.select({
      id: approvals.id,
      quotation_id: approvals.quotation_id,
      rfq_id: approvals.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_name: vendors.name,
      submitted_by_name: users.name,
      status: approvals.status,
      remarks: approvals.remarks,
      submitted_at: approvals.submitted_at,
      reviewed_at: approvals.reviewed_at
    })
    .from(approvals)
    .innerJoin(rfqs, eq(rfqs.id, approvals.rfq_id))
    .innerJoin(quotations, eq(quotations.id, approvals.quotation_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .innerJoin(users, eq(users.id, approvals.submitted_by))
    .where(ne(approvals.status, 'pending'))
    .orderBy(desc(approvals.reviewed_at));

    res.json(history);
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
