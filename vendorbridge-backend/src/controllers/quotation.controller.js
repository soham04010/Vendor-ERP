const { eq, and, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { quotations, quotation_items, rfqs, rfq_vendors, vendors, approvals, users } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');
const calculateTax = require('../utils/calculateTax');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res) => {
  try {
    let query = db.select({
      id: quotations.id,
      rfq_id: quotations.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_id: quotations.vendor_id,
      vendor_name: vendors.name,
      subtotal: quotations.subtotal,
      tax_rate: quotations.tax_rate,
      tax_amount: quotations.tax_amount,
      total_amount: quotations.total_amount,
      delivery_days: quotations.delivery_days,
      validity_date: quotations.validity_date,
      notes: quotations.notes,
      status: quotations.status,
      is_selected: quotations.is_selected,
      submitted_at: quotations.submitted_at
    })
    .from(quotations)
    .innerJoin(rfqs, eq(rfqs.id, quotations.rfq_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id));

    if (req.user.role === 'vendor') {
      if (!req.user.vendor_id) {
        return res.status(400).json({ error: 'User is not associated with any vendor' });
      }
      query.where(eq(quotations.vendor_id, req.user.vendor_id));
    }

    const allQuotations = await query.orderBy(desc(quotations.submitted_at));
    res.json(allQuotations);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [quotation] = await db.select({
      id: quotations.id,
      rfq_id: quotations.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      vendor_id: quotations.vendor_id,
      vendor_name: vendors.name,
      subtotal: quotations.subtotal,
      tax_rate: quotations.tax_rate,
      tax_amount: quotations.tax_amount,
      total_amount: quotations.total_amount,
      delivery_days: quotations.delivery_days,
      validity_date: quotations.validity_date,
      notes: quotations.notes,
      status: quotations.status,
      is_selected: quotations.is_selected,
      submitted_at: quotations.submitted_at
    })
    .from(quotations)
    .innerJoin(rfqs, eq(rfqs.id, quotations.rfq_id))
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .where(eq(quotations.id, id));

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== quotation.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot view other vendor quotations' });
    }

    const items = await db.select().from(quotation_items).where(eq(quotation_items.quotation_id, id));

    res.json({
      ...quotation,
      items
    });
  } catch (error) {
    console.error('Get quotation by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Submit a new quotation
// @route   POST /api/quotations
// @access  Private (Vendor)
exports.submitQuotation = async (req, res) => {
  try {
    const { rfq_id, subtotal, tax_rate, delivery_days, validity_date, notes, items } = req.body;

    if (!req.user.vendor_id) {
      return res.status(400).json({ error: 'User is not associated with any vendor' });
    }

    // Check if vendor is active
    const [vendorProfile] = await db.select().from(vendors).where(eq(vendors.id, req.user.vendor_id));
    if (!vendorProfile || vendorProfile.status !== 'active') {
      return res.status(403).json({ error: 'Access denied: vendor account is not active or approved' });
    }

    if (!rfq_id || !subtotal || !delivery_days || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required quotation details or items' });
    }

    // Verify RFQ is still active/open

    // Verify RFQ is still active/published
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfq_id));
    if (!rfq || rfq.status !== 'open') {
      return res.status(400).json({ error: 'RFQ is not open for submission' });
    }

    // Calculate tax amounts
    const taxResults = calculateTax(subtotal, tax_rate !== undefined ? tax_rate : 18.00);

    const result = await db.transaction(async (tx) => {
      // 1. Create quotation header
      const [newQuotation] = await tx.insert(quotations).values({
        rfq_id,
        vendor_id: req.user.vendor_id,
        subtotal: taxResults.subtotal.toString(),
        tax_rate: taxResults.taxRate.toString(),
        tax_amount: taxResults.taxAmount.toString(),
        total_amount: taxResults.totalAmount.toString(),
        delivery_days,
        validity_date: validity_date ? new Date(validity_date).toISOString().split('T')[0] : null,
        notes: notes || null,
        status: 'submitted',
        is_selected: false
      }).returning();

      // 2. Create quotation items
      const insertedItems = await tx.insert(quotation_items).values(
        items.map(item => ({
          quotation_id: newQuotation.id,
          rfq_item_id: item.rfq_item_id || null,
          product_name: item.product_name,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
          total_price: item.total_price ? item.total_price.toString() : (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)
        }))
      ).returning();

      // 3. Update RFQ Vendor status to submitted (inserting relationship if it does not exist)
      const [existingRelation] = await tx.select().from(rfq_vendors).where(
        and(eq(rfq_vendors.rfq_id, rfq_id), eq(rfq_vendors.vendor_id, req.user.vendor_id))
      );
      if (existingRelation) {
        await tx.update(rfq_vendors)
          .set({ status: 'submitted' })
          .where(and(eq(rfq_vendors.rfq_id, rfq_id), eq(rfq_vendors.vendor_id, req.user.vendor_id)));
      } else {
        await tx.insert(rfq_vendors).values({
          rfq_id,
          vendor_id: req.user.vendor_id,
          status: 'submitted'
        });
      }

      return { newQuotation, insertedItems };
    });

    // Notify internal officers/admins
    const staffUsers = await db.select().from(users).where(and(eq(users.role, 'officer'), eq(users.is_active, true)));
    for (const staff of staffUsers) {
      await createNotification({
        userId: staff.id,
        title: 'Quotation Submitted',
        message: `Vendor has submitted a quotation for RFQ: ${rfq.rfq_number}`,
        type: 'quotation_submission',
        entityId: result.newQuotation.id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'quotations',
      entityId: result.newQuotation.id,
      description: `Submitted quotation for RFQ ${rfq.rfq_number}. Total amount: INR ${taxResults.totalAmount}`
    });

    res.status(201).json({
      ...result.newQuotation,
      items: result.insertedItems
    });
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private (Vendor)
exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { subtotal, tax_rate, delivery_days, validity_date, notes, items } = req.body;

    const [existingQuotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!existingQuotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (existingQuotation.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot update other vendor quotations' });
    }

    if (existingQuotation.status !== 'submitted') {
      return res.status(400).json({ error: 'Quotation cannot be updated as it is no longer in submitted status' });
    }

    const updates = {
      updated_at: new Date()
    };

    if (delivery_days !== undefined) updates.delivery_days = delivery_days;
    if (validity_date !== undefined) updates.validity_date = validity_date ? new Date(validity_date).toISOString().split('T')[0] : null;
    if (notes !== undefined) updates.notes = notes;

    if (subtotal !== undefined) {
      const rate = tax_rate !== undefined ? tax_rate : parseFloat(existingQuotation.tax_rate);
      const taxResults = calculateTax(subtotal, rate);
      updates.subtotal = taxResults.subtotal.toString();
      updates.tax_rate = taxResults.taxRate.toString();
      updates.tax_amount = taxResults.taxAmount.toString();
      updates.total_amount = taxResults.totalAmount.toString();
    }

    const result = await db.transaction(async (tx) => {
      const [updatedQuotation] = await tx.update(quotations)
        .set(updates)
        .where(eq(quotations.id, id))
        .returning();

      if (items !== undefined && items.length > 0) {
        await tx.delete(quotation_items).where(eq(quotation_items.quotation_id, id));
        await tx.insert(quotation_items).values(
          items.map(item => ({
            quotation_id: id,
            rfq_item_id: item.rfq_item_id || null,
            product_name: item.product_name,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total_price: item.total_price ? item.total_price.toString() : (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)
          }))
        );
      }

      return updatedQuotation;
    });

    await createLog({
      userId: req.user.id,
      action: 'QUOTATION_UPDATED',
      entityType: 'quotations',
      entityId: id,
      description: `Updated quotation ID ${id}`
    });

    res.json(result);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Select quotation as winner (and trigger approval flow)
// @route   PATCH /api/quotations/:id/select
// @access  Private (Admin, Officer)
exports.selectWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, quotation.rfq_id));

    const result = await db.transaction(async (tx) => {
      // 1. Update quotation
      const [updatedQuotation] = await tx.update(quotations)
        .set({ is_selected: true, status: 'selected', updated_at: new Date() })
        .where(eq(quotations.id, id))
        .returning();

      // 2. Reject other quotations for this RFQ
      await tx.update(quotations)
        .set({ is_selected: false, status: 'rejected', updated_at: new Date() })
        .where(and(eq(quotations.rfq_id, quotation.rfq_id), eq(quotations.is_selected, false)));

      // 3. Find a manager to assign the approval to
      const [managerUser] = await tx.select().from(users).where(and(eq(users.role, 'manager'), eq(users.is_active, true))).limit(1);

      // 4. Create approval request
      const [approvalRequest] = await tx.insert(approvals).values({
        quotation_id: id,
        rfq_id: quotation.rfq_id,
        submitted_by: req.user.id,
        assigned_to: managerUser ? managerUser.id : null,
        status: 'pending',
        remarks: 'Quotation selected as winner; awaiting approval.'
      }).returning();

      return { updatedQuotation, approvalRequest, managerUser };
    });

    // Send notifications to manager
    if (result.managerUser) {
      await createNotification({
        userId: result.managerUser.id,
        title: 'New Approval Request',
        message: `Quotation winner selected for RFQ ${rfq.rfq_number}. Approval required.`,
        type: 'approval_request',
        entityId: result.approvalRequest.id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'QUOTATION_SELECTED_WINNER',
      entityType: 'quotations',
      entityId: id,
      description: `Selected quotation ${id} as winner for RFQ ${rfq.rfq_number}`
    });

    res.json({
      message: 'Quotation selected as winner, approval request created.',
      quotation: result.updatedQuotation,
      approval: result.approvalRequest
    });
  } catch (error) {
    console.error('Select winner error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Reject quotation
// @route   PATCH /api/quotations/:id/reject
// @access  Private (Admin, Officer)
exports.rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const [updatedQuotation] = await db.update(quotations)
      .set({ status: 'rejected', is_selected: false, updated_at: new Date() })
      .where(eq(quotations.id, id))
      .returning();

    // Notify vendor
    const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, quotation.vendor_id));
    for (const u of vendorUsers) {
      await createNotification({
        userId: u.id,
        title: 'Quotation Rejected',
        message: `Your quotation for RFQ ID ${quotation.rfq_id} has been rejected.`,
        type: 'quotation_rejected',
        entityId: id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'QUOTATION_REJECTED',
      entityType: 'quotations',
      entityId: id,
      description: `Rejected quotation ${id}`
    });

    res.json(updatedQuotation);
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
