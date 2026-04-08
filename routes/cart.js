// routes/cart.js — Per-user cart stored in MySQL
const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// ── GET /api/cart ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? ORDER BY added_at ASC',
      [req.user.id]
    );
    res.json({ ok: true, items });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ ok: false, msg: 'Could not load cart.' });
  }
});

// ── POST /api/cart ─────────────────────────────────────────
// Add a book to cart
router.post('/', async (req, res) => {
  const { book_id, title, author, price, cover, emoji } = req.body;
  if (!book_id || !title) {
    return res.status(400).json({ ok: false, msg: 'book_id and title are required.' });
  }

  try {
    await db.query(
      `INSERT INTO cart_items (user_id, book_id, title, author, price, cover, emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE added_at = added_at`,   // silently ignore duplicates
      [req.user.id, book_id, title, author, price ?? 0, cover ?? '', emoji ?? '']
    );
    const [items] = await db.query('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ ok: true, items });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ ok: false, msg: 'Could not add to cart.' });
  }
});

// ── DELETE /api/cart/:bookId ───────────────────────────────
// Remove one item
router.delete('/:bookId', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND book_id = ?',
      [req.user.id, req.params.bookId]
    );
    const [items] = await db.query('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ ok: true, items });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ ok: false, msg: 'Could not remove item.' });
  }
});

// ── DELETE /api/cart ───────────────────────────────────────
// Clear entire cart (called after checkout)
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ ok: true, items: [] });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Could not clear cart.' });
  }
});

module.exports = router;
