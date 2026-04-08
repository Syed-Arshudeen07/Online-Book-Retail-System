// middleware/auth.js — JWT verification middleware
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, msg: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, name, email }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, msg: 'Session expired. Please log in again.' });
  }
};
