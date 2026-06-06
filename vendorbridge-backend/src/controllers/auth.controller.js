const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../config/db');
const { users, vendors } = require('../db/schema');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// @route   POST /api/auth/register
// @desc    Register a user (Vendors only for public signup)
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, country, additionalInfo, password, role } = req.body;
    
    // In our system, the public signup is intended for vendors. 
    // However, to support hackathon demos, we allow specifying the role, defaulting to 'vendor'.
    const userRole = role && ['admin', 'officer', 'manager', 'vendor'].includes(role.toLowerCase()) 
      ? role.toLowerCase() 
      : 'vendor';

    const name = `${firstName} ${lastName}`.trim();

    // Validation - Only applicable for Vendors
    if (userRole === 'vendor') {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
      }

      if (!password || password.length < 8 || password.length > 16) {
        return res.status(400).json({ error: 'Password must be between 8 and 16 characters' });
      }

      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one letter, one number, and one symbol' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Using Drizzle transaction to insert vendor and user atomically
    const userData = await db.transaction(async (tx) => {
      let vendorId = null;

      if (userRole === 'vendor') {
        const vendorAddress = additionalInfo ? `${additionalInfo}\nCountry: ${country}` : `Country: ${country}`;
        
        // Insert Vendor record
        const [insertedVendor] = await tx.insert(vendors).values({
          name: name,
          email: email,
          phone: phone,
          address: vendorAddress,
        }).returning();
        
        vendorId = insertedVendor.id;
      }

      // Insert User record
      const [insertedUser] = await tx.insert(users).values({
        name,
        email,
        password_hash: passwordHash,
        role: userRole,
        vendor_id: vendorId,
        is_active: true
      }).returning();

      return insertedUser;
    });

    // Generate token
    const token = jwt.sign(
      { id: userData.id, role: userData.role, vendor_id: userData.vendor_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        vendor_id: userData.vendor_id
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    // Drizzle throws error code '23505' for unique constraint violation in Postgres
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, vendor_id: user.vendor_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendor_id: user.vendor_id
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login', details: error.message });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      vendor_id: users.vendor_id,
      is_active: users.is_active
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
