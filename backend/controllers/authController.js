const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelper } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// User Registration
async function signup(req, res) {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await dbHelper.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine role (Default to Member unless specified, or first user in DB gets Admin)
    let finalRole = role || 'Member';
    const totalUsers = await dbHelper.get('SELECT COUNT(*) as count FROM users');
    if (totalUsers.count === 0) {
      finalRole = 'Admin';
    }

    // Insert user
    const result = await dbHelper.run(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email.toLowerCase(), passwordHash, full_name, finalRole]
    );

    const user = {
      id: result.id,
      email: email.toLowerCase(),
      full_name,
      role: finalRole
    };

    // Generate token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

// User Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch user
    const userRow = await dbHelper.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!userRow) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role
    };

    // Generate token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

// Get Authenticated User Details
async function getMe(req, res) {
  try {
    const userRow = await dbHelper.get('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userRow);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
}

// List All Users in the system (for dropdowns / selection when adding to project or assigning tasks)
async function getAllUsers(req, res) {
  try {
    const users = await dbHelper.all('SELECT id, email, full_name, role FROM users ORDER BY full_name ASC');
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Internal server error fetching users list' });
  }
}

module.exports = {
  signup,
  login,
  getMe,
  getAllUsers
};
