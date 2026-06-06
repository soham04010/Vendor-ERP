const { eq, and, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { purchase_orders, vendors, rfqs, quotations, quotation_items, users } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');
const generatePONumber = require('../utils/generatePONumber');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
exports.getPurchaseOrders = async (req, res) => {
  try {
    let query = db.select({
      id: purchase_orders.id,
      po_number: purchase_orders.po_number,
      rfq_id: purchase_orders.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      quotation_id: purchase_orders.quotation_id,
      approval_id: purchase_orders.approval_id,
      vendor_id: purchase_orders.vendor_id,
      vendor_name: vendors.name,
      total_amount: purchase_orders.total_amount,
      delivery_date: purchase_orders.delivery_date,
      status: purchase_orders.status,
      created_at: purchase_orders.created_at
    })
    .from(purchase_orders)
    .innerJoin(vendors, eq(vendors.id, purchase_orders.vendor_id))
    .leftJoin(rfqs, eq(rfqs.id, purchase_orders.rfq_id));

    if (req.user.role === 'vendor') {
      if (!req.user.vendor_id) {
        return res.status(400).json({ error: 'User is not associated with any vendor' });
      }
      query.where(eq(purchase_orders.vendor_id, req.user.vendor_id));
    }

    const pos = await query.orderBy(desc(purchase_orders.created_at));
    res.json(pos);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Create a purchase order manually
// @route   POST /api/purchase-orders
// @access  Private (Admin, Officer)
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { quotation_id, approval_id, delivery_date } = req.body;

    if (!quotation_id) {
      return res.status(400).json({ error: 'Quotation ID is required' });
    }

    // Retrieve quotation to get vendor and total amount
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotation_id));
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const poNumber = await generatePONumber();

    const [newPo] = await db.insert(purchase_orders).values({
      po_number: poNumber,
      rfq_id: quotation.rfq_id,
      quotation_id,
      approval_id: approval_id || null,
      vendor_id: quotation.vendor_id,
      total_amount: quotation.total_amount,
      delivery_date: delivery_date ? new Date(delivery_date).toISOString().split('T')[0] : null,
      status: 'issued',
      created_by: req.user.id
    }).returning();

    // Notify vendor users
    const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, quotation.vendor_id));
    for (const u of vendorUsers) {
      await createNotification({
        userId: u.id,
        title: 'New Purchase Order',
        message: `A new Purchase Order (${poNumber}) has been issued to you.`,
        type: 'po_issued',
        entityId: newPo.id
      });
    }

    await createLog({
      userId: req.user.id,
      action: 'PO_CREATED_MANUALLY',
      entityType: 'purchase_orders',
      entityId: newPo.id,
      description: `Manually created Purchase Order ${poNumber} for quotation ${quotation_id}`
    });

    res.status(201).json(newPo);
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get purchase order by ID
// @route   GET /api/purchase-orders/:id
// @access  Private
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [po] = await db.select({
      id: purchase_orders.id,
      po_number: purchase_orders.po_number,
      rfq_id: purchase_orders.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      quotation_id: purchase_orders.quotation_id,
      approval_id: purchase_orders.approval_id,
      vendor_id: purchase_orders.vendor_id,
      vendor_name: vendors.name,
      vendor_email: vendors.email,
      vendor_phone: vendors.phone,
      vendor_address: vendors.address,
      total_amount: purchase_orders.total_amount,
      delivery_date: purchase_orders.delivery_date,
      status: purchase_orders.status,
      created_at: purchase_orders.created_at
    })
    .from(purchase_orders)
    .innerJoin(vendors, eq(vendors.id, purchase_orders.vendor_id))
    .leftJoin(rfqs, eq(rfqs.id, purchase_orders.rfq_id))
    .where(eq(purchase_orders.id, id));

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== po.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot view other vendor POs' });
    }

    // Fetch items from quotation
    const items = await db.select().from(quotation_items).where(eq(quotation_items.quotation_id, po.quotation_id));

    res.json({
      ...po,
      items
    });
  } catch (error) {
    console.error('Get purchase order by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update purchase order status
// @route   PATCH /api/purchase-orders/:id/status
// @access  Private
exports.updatePOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const [po] = await db.select().from(purchase_orders).where(eq(purchase_orders.id, id));
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== po.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot update other vendor POs' });
    }

    const [updatedPo] = await db.update(purchase_orders)
      .set({ status, updated_at: new Date() })
      .where(eq(purchase_orders.id, id))
      .returning();

    // Notify appropriate users
    if (req.user.role === 'vendor') {
      // Notify internal officers
      const officers = await db.select().from(users).where(and(eq(users.role, 'officer'), eq(users.is_active, true)));
      for (const off of officers) {
        await createNotification({
          userId: off.id,
          title: 'PO Status Updated',
          message: `Vendor updated Purchase Order ${po.po_number} status to ${status}`,
          type: 'po_status_change',
          entityId: id
        });
      }
    } else {
      // Notify vendor users
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, po.vendor_id));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'PO Status Updated',
          message: `Purchase Order ${po.po_number} status has been updated to ${status}`,
          type: 'po_status_change',
          entityId: id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'PO_STATUS_UPDATED',
      entityType: 'purchase_orders',
      entityId: id,
      description: `Updated status of PO ${po.po_number} to ${status}`,
      metadata: { status }
    });

    res.json(updatedPo);
  } catch (error) {
    console.error('Update PO status error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get POs for logged in vendor
// @route   GET /api/purchase-orders/vendor/mine
// @access  Private (Vendor)
exports.getVendorMine = async (req, res) => {
  try {
    if (!req.user.vendor_id) {
      return res.status(400).json({ error: 'User is not associated with any vendor' });
    }

    const pos = await db.select({
      id: purchase_orders.id,
      po_number: purchase_orders.po_number,
      rfq_id: purchase_orders.rfq_id,
      rfq_number: rfqs.rfq_number,
      rfq_title: rfqs.title,
      quotation_id: purchase_orders.quotation_id,
      approval_id: purchase_orders.approval_id,
      vendor_id: purchase_orders.vendor_id,
      vendor_name: vendors.name,
      total_amount: purchase_orders.total_amount,
      delivery_date: purchase_orders.delivery_date,
      status: purchase_orders.status,
      created_at: purchase_orders.created_at
    })
    .from(purchase_orders)
    .innerJoin(vendors, eq(vendors.id, purchase_orders.vendor_id))
    .leftJoin(rfqs, eq(rfqs.id, purchase_orders.rfq_id))
    .where(eq(purchase_orders.vendor_id, req.user.vendor_id))
    .orderBy(desc(purchase_orders.created_at));

    res.json(pos);
  } catch (error) {
    console.error('Get vendor mine POs error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
