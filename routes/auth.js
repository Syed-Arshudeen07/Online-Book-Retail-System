// routes/auth.js — Register & Login
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const router   = express.Router();

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, msg: 'Name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, msg: 'Password must be at least 8 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, msg: 'Please enter a valid email address.' });
  }

  try {
    // Check for existing account
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, msg: 'An account with this email already exists.' });
    }

    // Hash password and insert
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashed]
    );

    // Issue JWT
    const token = jwt.sign(
      { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ ok: true, token, user: { id: result.insertId, name: name.trim(), email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, msg: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, msg: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, msg: 'Incorrect email or password.' });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, msg: 'Incorrect email or password.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, msg: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
// Verify token & return current user (used on page load)
const requireAuth = require('../middleware/auth');
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ ok: false, msg: 'User not found.' });
    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Server error.' });
  }
});

module.exports = router;
