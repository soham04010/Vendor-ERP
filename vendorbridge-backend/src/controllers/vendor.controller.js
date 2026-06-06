const { eq, and, or, like, desc, sql } = require('drizzle-orm');
const { db } = require('../config/db');
const { vendors, activity_logs, quotations } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private (Admin, Officer, Manager)
exports.getVendors = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    let conditions = [];
    if (status) {
      conditions.push(eq(vendors.status, status));
    }
    if (category) {
      conditions.push(eq(vendors.category, category));
    }
    if (search) {
      conditions.push(
        or(
          like(vendors.name, `%${search}%`),
          like(vendors.email, `%${search}%`),
          like(vendors.city || vendors.name, `%${search}%`)
        )
      );
    }

    const query = db.select().from(vendors);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const allVendors = await query.orderBy(desc(vendors.created_at));
    res.json(allVendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private (Admin, Officer, Manager, or matching Vendor)
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    // RBAC check: vendors can only see themselves
    if (req.user.role === 'vendor' && req.user.vendor_id !== id) {
      return res.status(403).json({ error: 'Access denied: cannot view other vendor details' });
    }

    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private (Admin, Officer)
exports.createVendor = async (req, res) => {
  try {
    const { name, category, gst_number, email, phone, address, city, state, pincode } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Vendor name and email are required' });
    }

    const [newVendor] = await db.insert(vendors).values({
      name,
      category: category || null,
      gst_number: gst_number || null,
      email,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      status: 'active',
      rating: '0.00',
      created_by: req.user.id
    }).returning();

    await createLog({
      userId: req.user.id,
      action: 'VENDOR_CREATED',
      entityType: 'vendors',
      entityId: newVendor.id,
      description: `Created vendor ${name}`,
      metadata: { email, gst_number }
    });

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private (Admin, Officer, or matching Vendor)
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, gst_number, email, phone, address, city, state, pincode, dob } = req.body;

    if (req.user.role === 'vendor' && req.user.vendor_id !== id) {
      return res.status(403).json({ error: 'Access denied: cannot update other vendor profiles' });
    }

    const [existingVendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const updates = {
      updated_at: new Date()
    };
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (gst_number !== undefined) updates.gst_number = gst_number;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (dob !== undefined) updates.dob = dob ? new Date(dob).toISOString().split('T')[0] : null;

    const [updatedVendor] = await db.update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();

    await createLog({
      userId: req.user.id,
      action: 'VENDOR_UPDATED',
      entityType: 'vendors',
      entityId: id,
      description: `Updated vendor profile for ${updatedVendor.name}`,
      metadata: { updates: Object.keys(updates) }
    });

    res.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update vendor status
// @route   PATCH /api/vendors/:id/status
// @access  Private (Admin, Officer)
exports.updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const [existingVendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const [updatedVendor] = await db.update(vendors)
      .set({ status, updated_at: new Date() })
      .where(eq(vendors.id, id))
      .returning();

    await createLog({
      userId: req.user.id,
      action: 'VENDOR_STATUS_UPDATED',
      entityType: 'vendors',
      entityId: id,
      description: `Updated vendor status for ${updatedVendor.name} to ${status}`,
      metadata: { status }
    });

    res.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get vendor history (activity logs)
// @route   GET /api/vendors/:id/history
// @access  Private (Admin, Officer, Manager)
exports.getVendorHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await db.select()
      .from(activity_logs)
      .where(
        or(
          and(eq(activity_logs.entity_type, 'vendors'), eq(activity_logs.entity_id, id)),
          eq(activity_logs.user_id, sql`(SELECT id FROM users WHERE vendor_id = ${id} LIMIT 1)`)
        )
      )
      .orderBy(desc(activity_logs.created_at));

    res.json(logs);
  } catch (error) {
    console.error('Get vendor history error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get vendor quotations
// @route   GET /api/vendors/:id/quotations
// @access  Private (Admin, Officer, Manager, or matching Vendor)
exports.getVendorQuotations = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'vendor' && req.user.vendor_id !== id) {
      return res.status(403).json({ error: 'Access denied: cannot view other vendor quotations' });
    }

    const vendorQuotations = await db.select()
      .from(quotations)
      .where(eq(quotations.vendor_id, id))
      .orderBy(desc(quotations.submitted_at));

    res.json(vendorQuotations);
  } catch (error) {
    console.error('Get vendor quotations error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
