const bcrypt = require('bcryptjs');
const { eq, and } = require('drizzle-orm');
const { db } = require('../config/db');
const { users } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Officer, Manager)
exports.getUsers = async (req, res) => {
  try {
    const { role, is_active } = req.query;
    
    let conditions = [];
    if (role) conditions.push(eq(users.role, role));
    if (is_active !== undefined) conditions.push(eq(users.is_active, is_active === 'true'));

    const query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      vendor_id: users.vendor_id,
      is_active: users.is_active,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const allUsers = await query;
    res.json(allUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, Officer, Manager, or current user)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.role !== 'officer' && req.user.role !== 'manager' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      vendor_id: users.vendor_id,
      is_active: users.is_active,
      created_at: users.created_at,
      updated_at: users.updated_at
    }).from(users).where(eq(users.id, id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, vendor_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password_hash: passwordHash,
      role,
      vendor_id: vendor_id || null,
      is_active: true
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      vendor_id: users.vendor_id,
      is_active: users.is_active,
      created_at: users.created_at
    });

    await createLog({
      userId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'users',
      entityId: newUser.id,
      description: `Created user ${name} with role ${role}`,
      metadata: { role, email }
    });

    await createNotification({
      userId: newUser.id,
      title: 'Welcome to VendorBridge',
      message: `Your account has been created with role: ${role}`,
      type: 'account_created',
      entityId: newUser.id
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505' || error.message.includes('unique')) {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, vendor_id, is_active } = req.body;

    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (vendor_id !== undefined) updates.vendor_id = vendor_id || null;
    if (is_active !== undefined) updates.is_active = is_active;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    updates.updated_at = new Date();

    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        vendor_id: users.vendor_id,
        is_active: users.is_active,
        updated_at: users.updated_at
      });

    await createLog({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'users',
      entityId: id,
      description: `Updated user ${updatedUser.name}`,
      metadata: { updates: Object.keys(updates) }
    });

    await createNotification({
      userId: id,
      title: 'Account Updated',
      message: 'Your account details have been updated by an administrator.',
      type: 'account_updated',
      entityId: id
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505' || error.message.includes('unique')) {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.delete(users).where(eq(users.id, id));

    await createLog({
      userId: req.user.id,
      action: 'USER_DELETED',
      entityType: 'users',
      entityId: id,
      description: `Deleted user ${existingUser.name} (${existingUser.email})`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
