const { eq, and, or, desc, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { rfqs, rfq_items, rfq_attachments, rfq_vendors, vendors, quotations, quotation_items, users } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');

// Inline helper to generate RFQ number sequential code
async function generateRFQNumber() {
  const currentYear = new Date().getFullYear();
  const [result] = await db.select({
    count: sql`count(*)`
  }).from(rfqs);
  const count = parseInt(result?.count || 0) + 1;
  const seq = String(count).padStart(4, '0');
  return `RFQ-${currentYear}-${seq}`;
}

// @desc    Get all RFQs
// @route   GET /api/rfqs
// @access  Private
exports.getRfqs = async (req, res) => {
  try {
    const { status } = req.query;
    
    if (req.user.role === 'vendor') {
      // Verify current vendor is active first
      const [vendorProfile] = await db.select().from(vendors).where(eq(vendors.id, req.user.vendor_id));
      if (!vendorProfile || vendorProfile.status !== 'active') {
        return res.json([]); // Return empty if vendor is not active
      }

      const vendorRfqs = await db.select({
        id: rfqs.id,
        rfq_number: rfqs.rfq_number,
        title: rfqs.title,
        description: rfqs.description,
        deadline: rfqs.deadline,
        status: rfqs.status,
        created_at: rfqs.created_at,
        updated_at: rfqs.updated_at
      })
      .from(rfqs)
      .where(
        or(eq(rfqs.status, 'open'), eq(rfqs.status, 'closed'))
      )
      .orderBy(desc(rfqs.created_at));
      
      return res.json(vendorRfqs);
    }

    // Admin/Officer/Manager see all
    let conditions = [];
    if (status) {
      conditions.push(eq(rfqs.status, status));
    }

    const query = db.select().from(rfqs);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const allRfqs = await query.orderBy(desc(rfqs.created_at));
    res.json(allRfqs);
  } catch (error) {
    console.error('Get RFQs error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get RFQs assigned to vendor
// @route   GET /api/rfqs/vendor/assigned
// @access  Private (Vendor)
exports.getAssignedRfqs = async (req, res) => {
  try {
    if (!req.user.vendor_id) {
      return res.status(400).json({ error: 'User is not associated with any vendor' });
    }

    const [vendorProfile] = await db.select().from(vendors).where(eq(vendors.id, req.user.vendor_id));
    if (!vendorProfile || vendorProfile.status !== 'active') {
      return res.json([]);
    }

    const assigned = await db.select({
      id: rfqs.id,
      rfq_number: rfqs.rfq_number,
      title: rfqs.title,
      description: rfqs.description,
      deadline: rfqs.deadline,
      status: rfqs.status,
      created_at: rfqs.created_at,
      updated_at: rfqs.updated_at
    })
    .from(rfqs)
    .where(
      or(eq(rfqs.status, 'open'), eq(rfqs.status, 'closed'))
    )
    .orderBy(desc(rfqs.created_at));

    res.json(assigned);
  } catch (error) {
    console.error('Get assigned RFQs error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get RFQ by ID
// @route   GET /api/rfqs/:id
// @access  Private
exports.getRfqById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // If vendor, check invitation, publication status, and activation status
    if (req.user.role === 'vendor') {
      const [vendorProfile] = await db.select().from(vendors).where(eq(vendors.id, req.user.vendor_id));
      if (!vendorProfile || vendorProfile.status !== 'active') {
        return res.status(403).json({ error: 'Access denied: vendor account is not active or approved' });
      }

      if (rfq.status !== 'open' && rfq.status !== 'closed') {
        return res.status(403).json({ error: 'Access denied: RFQ is not open' });
      }
    }

    // Fetch items
    const items = await db.select().from(rfq_items).where(eq(rfq_items.rfq_id, id));

    // Fetch attachments
    const attachments = await db.select().from(rfq_attachments).where(eq(rfq_attachments.rfq_id, id));

    // Fetch invited vendors
    const invitedVendors = await db.select({
      id: vendors.id,
      name: vendors.name,
      email: vendors.email,
      phone: vendors.phone,
      status: rfq_vendors.status,
      invited_at: rfq_vendors.invited_at
    })
    .from(rfq_vendors)
    .innerJoin(vendors, eq(vendors.id, rfq_vendors.vendor_id))
    .where(eq(rfq_vendors.rfq_id, id));

    res.json({
      ...rfq,
      items,
      attachments,
      vendors: invitedVendors
    });
  } catch (error) {
    console.error('Get RFQ by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Create a new RFQ
// @route   POST /api/rfqs
// @access  Private (Admin, Officer)
exports.createRfq = async (req, res) => {
  try {
    const { title, description, deadline, items, vendorIds, attachments } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ error: 'Title and deadline are required' });
    }

    const rfqNumber = await generateRFQNumber();

    const result = await db.transaction(async (tx) => {
      // 1. Insert RFQ
      const [newRfq] = await tx.insert(rfqs).values({
        rfq_number: rfqNumber,
        title,
        description: description || null,
        deadline: new Date(deadline),
        status: 'draft',
        created_by: req.user.id
      }).returning();

      // 2. Insert RFQ Items
      let insertedItems = [];
      if (items && items.length > 0) {
        insertedItems = await tx.insert(rfq_items).values(
          items.map(item => ({
            rfq_id: newRfq.id,
            product_name: item.product_name,
            description: item.description || null,
            quantity: item.quantity,
            unit: item.unit || 'units'
          }))
        ).returning();
      }

      // 3. Insert RFQ Attachments (mock URLs)
      let insertedAttachments = [];
      if (attachments && attachments.length > 0) {
        insertedAttachments = await tx.insert(rfq_attachments).values(
          attachments.map(att => ({
            rfq_id: newRfq.id,
            file_name: att.file_name,
            file_url: att.file_url,
            uploaded_by: req.user.id
          }))
        ).returning();
      }

      // 4. Invite Vendors (rfq_vendors) - Invite all active vendors automatically
      const activeVendors = await tx.select({ id: vendors.id }).from(vendors).where(eq(vendors.status, 'active'));
      const finalVendorIds = activeVendors.map(v => v.id);

      let invitedVendors = [];
      if (finalVendorIds.length > 0) {
        invitedVendors = await tx.insert(rfq_vendors).values(
          finalVendorIds.map(vId => ({
            rfq_id: newRfq.id,
            vendor_id: vId,
            status: 'invited'
          }))
        ).returning();
      }

      return { newRfq, insertedItems, insertedAttachments, invitedVendors };
    });

    // Write Log
    await createLog({
      userId: req.user.id,
      action: 'RFQ_CREATED',
      entityType: 'rfqs',
      entityId: result.newRfq.id,
      description: `Created RFQ ${result.newRfq.rfq_number}: ${title}`
    });

    res.status(201).json({
      ...result.newRfq,
      items: result.insertedItems,
      attachments: result.insertedAttachments,
      vendors: result.invitedVendors
    });
  } catch (error) {
    console.error('Create RFQ error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update RFQ
// @route   PUT /api/rfqs/:id
// @access  Private (Admin, Officer)
exports.updateRfq = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, items, vendorIds } = req.body;

    const [existingRfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!existingRfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (existingRfq.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft RFQs can be updated' });
    }

    const updates = { updated_at: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = new Date(deadline);

    const result = await db.transaction(async (tx) => {
      // Update RFQ header
      const [updatedRfq] = await tx.update(rfqs).set(updates).where(eq(rfqs.id, id)).returning();

      // Update RFQ Items
      if (items !== undefined) {
        // Delete old items
        await tx.delete(rfq_items).where(eq(rfq_items.rfq_id, id));
        if (items.length > 0) {
          await tx.insert(rfq_items).values(
            items.map(item => ({
              rfq_id: id,
              product_name: item.product_name,
              description: item.description || null,
              quantity: item.quantity,
              unit: item.unit || 'units'
            }))
          );
        }
      }

      // Update Vendors
      if (vendorIds !== undefined) {
        await tx.delete(rfq_vendors).where(eq(rfq_vendors.rfq_id, id));
        if (vendorIds.length > 0) {
          await tx.insert(rfq_vendors).values(
            vendorIds.map(vId => ({
              rfq_id: id,
              vendor_id: vId,
              status: 'invited'
            }))
          );
        }
      }

      return updatedRfq;
    });

    await createLog({
      userId: req.user.id,
      action: 'RFQ_UPDATED',
      entityType: 'rfqs',
      entityId: id,
      description: `Updated RFQ ${existingRfq.rfq_number}`
    });

    res.json(result);
  } catch (error) {
    console.error('Update RFQ error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Delete RFQ
// @route   DELETE /api/rfqs/:id
// @access  Private (Admin, Officer)
exports.deleteRfq = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingRfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!existingRfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    await db.transaction(async (tx) => {
      await tx.delete(rfq_items).where(eq(rfq_items.rfq_id, id));
      await tx.delete(rfq_vendors).where(eq(rfq_vendors.rfq_id, id));
      await tx.delete(rfq_attachments).where(eq(rfq_attachments.rfq_id, id));
      await tx.delete(rfqs).where(eq(rfqs.id, id));
    });

    await createLog({
      userId: req.user.id,
      action: 'RFQ_DELETED',
      entityType: 'rfqs',
      entityId: id,
      description: `Deleted RFQ ${existingRfq.rfq_number}`
    });

    res.json({ message: 'RFQ deleted successfully' });
  } catch (error) {
    console.error('Delete RFQ error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Assign vendors to RFQ
// @route   POST /api/rfqs/:id/vendors
// @access  Private (Admin, Officer)
exports.assignVendors = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'A list of vendorIds is required' });
    }

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const inserts = vendorIds.map(vId => ({
      rfq_id: id,
      vendor_id: vId,
      status: 'invited'
    }));

    await db.insert(rfq_vendors).values(inserts).onConflictDoNothing();

    // Notify each vendor user
    for (const vId of vendorIds) {
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, vId));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'New RFQ Invitation',
          message: `You have been invited to submit a quotation for RFQ: ${rfq.rfq_number}`,
          type: 'rfq_invitation',
          entityId: rfq.id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'RFQ_VENDORS_ASSIGNED',
      entityType: 'rfqs',
      entityId: id,
      description: `Assigned ${vendorIds.length} vendors to RFQ ${rfq.rfq_number}`
    });

    res.json({ message: 'Vendors assigned successfully' });
  } catch (error) {
    console.error('Assign vendors error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Remove vendor from RFQ
// @route   DELETE /api/rfqs/:id/vendors/:vendorId
// @access  Private (Admin, Officer)
exports.removeVendor = async (req, res) => {
  try {
    const { id, vendorId } = req.params;

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    await db.delete(rfq_vendors).where(
      and(
        eq(rfq_vendors.rfq_id, id),
        eq(rfq_vendors.vendor_id, vendorId)
      )
    );

    await createLog({
      userId: req.user.id,
      action: 'RFQ_VENDOR_REMOVED',
      entityType: 'rfqs',
      entityId: id,
      description: `Removed vendor ${vendorId} from RFQ ${rfq.rfq_number}`
    });

    res.json({ message: 'Vendor removed from RFQ' });
  } catch (error) {
    console.error('Remove vendor error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Publish RFQ
// @route   PATCH /api/rfqs/:id/publish
// @access  Private (Admin, Officer)
exports.publishRfq = async (req, res) => {
  try {
    const { id } = req.params;

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (rfq.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft RFQs can be published' });
    }

    const [updatedRfq] = await db.update(rfqs)
      .set({ status: 'open', updated_at: new Date() })
      .where(eq(rfqs.id, id))
      .returning();

    // Get assigned vendors and notify their users
    const invited = await db.select().from(rfq_vendors).where(eq(rfq_vendors.rfq_id, id));
    for (const inv of invited) {
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, inv.vendor_id));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'RFQ Published',
          message: `RFQ ${rfq.rfq_number} is now published and open for submissions.`,
          type: 'rfq_published',
          entityId: id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'RFQ_PUBLISHED',
      entityType: 'rfqs',
      entityId: id,
      description: `Published RFQ ${rfq.rfq_number}`
    });

    res.json(updatedRfq);
  } catch (error) {
    console.error('Publish RFQ error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Close RFQ
// @route   PATCH /api/rfqs/:id/close
// @access  Private (Admin, Officer)
exports.closeRfq = async (req, res) => {
  try {
    const { id } = req.params;

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const [updatedRfq] = await db.update(rfqs)
      .set({ status: 'closed', updated_at: new Date() })
      .where(eq(rfqs.id, id))
      .returning();

    // Get assigned vendors and notify their users
    const invited = await db.select().from(rfq_vendors).where(eq(rfq_vendors.rfq_id, id));
    for (const inv of invited) {
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, inv.vendor_id));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'RFQ Closed',
          message: `RFQ ${rfq.rfq_number} has been closed. Submissions are no longer accepted.`,
          type: 'rfq_closed',
          entityId: id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'RFQ_CLOSED',
      entityType: 'rfqs',
      entityId: id,
      description: `Closed RFQ ${rfq.rfq_number}`
    });

    res.json(updatedRfq);
  } catch (error) {
    console.error('Close RFQ error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get RFQ Quotations
// @route   GET /api/rfqs/:id/quotations
// @access  Private (Admin, Officer, Manager)
exports.getRfqQuotations = async (req, res) => {
  try {
    const { id } = req.params;

    const rfqQuotations = await db.select({
      id: quotations.id,
      rfq_id: quotations.rfq_id,
      vendor_id: quotations.vendor_id,
      vendor_name: vendors.name,
      vendor_gst: vendors.gst_number,
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
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .where(eq(quotations.rfq_id, id))
    .orderBy(desc(quotations.submitted_at));

    res.json(rfqQuotations);
  } catch (error) {
    console.error('Get RFQ quotations error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Compare quotations for RFQ
// @route   GET /api/rfqs/:id/compare
// @access  Private (Admin, Officer, Manager)
exports.compareQuotations = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all quotations for this RFQ with vendor information
    const rfqQuotations = await db.select({
      id: quotations.id,
      vendor_id: quotations.vendor_id,
      vendor_name: vendors.name,
      vendor_gst: vendors.gst_number,
      total_amount: quotations.total_amount,
      delivery_days: quotations.delivery_days,
      status: quotations.status,
      is_selected: quotations.is_selected,
      submitted_at: quotations.submitted_at
    })
    .from(quotations)
    .innerJoin(vendors, eq(vendors.id, quotations.vendor_id))
    .where(eq(quotations.rfq_id, id));

    const compared = [];
    for (const q of rfqQuotations) {
      const items = await db.select().from(quotation_items).where(eq(quotation_items.quotation_id, q.id));
      compared.push({
        ...q,
        items
      });
    }

    res.json(compared);
  } catch (error) {
    console.error('Compare RFQ quotations error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
