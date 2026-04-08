// routes/library.js — User's purchased books
const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');
const router      = express.Router();

router.use(requireAuth);

// ── GET /api/library ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM library WHERE user_id = ? ORDER BY purchased_at DESC',
      [req.user.id]
    );
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Could not load library.' });
  }
});

// ── POST /api/library/checkout ────────────────────────────
// Moves all cart items → library, then clears the cart
router.post('/checkout', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch user's current cart
    const [cartItems] = await conn.query(
      'SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]
    );

    if (!cartItems.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ ok: false, msg: 'Your cart is empty.' });
    }

    // Insert each cart item into library (ignore if already owned)
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO library (user_id, book_id, title, author, price_paid, cover, emoji)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE purchased_at = purchased_at`,
        [req.user.id, item.book_id, item.title, item.author, item.price, item.cover, item.emoji]
      );
    }

    // Clear the cart
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await conn.commit();
    conn.release();

    // Return updated library
    const [library] = await db.query(
      'SELECT * FROM library WHERE user_id = ? ORDER BY purchased_at DESC', [req.user.id]
    );
    res.json({ ok: true, library, msg: 'Purchase complete! Books added to your library.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Checkout error:', err);
    res.status(500).json({ ok: false, msg: 'Checkout failed. Please try again.' });
  }
});

module.exports = router;
