// server.js — InkWell Express Server
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: '*',           // In production, restrict to your domain
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Serve static frontend files ────────────────────────────
// Place all your HTML/CSS/JS files in a "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/cart',    require('./routes/cart'));
app.use('/api/library', require('./routes/library'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, message: 'InkWell server running ✅' }));

// ── Catch-all: serve index.html for any unmatched routes ───
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 InkWell server running at http://localhost:${PORT}`);
  console.log(`   API docs:  http://localhost:${PORT}/api/health\n`);
});
