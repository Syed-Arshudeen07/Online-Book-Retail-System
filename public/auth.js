/* ═══════════════════════════════════════════════════════
   InkWell — Frontend Auth & API Client
   Replaces localStorage-only auth.js
   All user data now lives in MySQL via the Express API.
   ═══════════════════════════════════════════════════════ */

const API = 'http://localhost:3000/api';  // ← change to your server URL in production

// ── TOKEN HELPERS ──────────────────────────────────────────
function getToken()      { return localStorage.getItem('inkwell_token'); }
function setToken(t)     { localStorage.setItem('inkwell_token', t); }
function clearToken()    { localStorage.removeItem('inkwell_token'); }

function getSession()    { 
  const raw = localStorage.getItem('inkwell_session');
  return raw ? JSON.parse(raw) : null;
}
function setSession(u)   { localStorage.setItem('inkwell_session', JSON.stringify(u)); }
function clearSession()  { localStorage.removeItem('inkwell_session'); clearToken(); }

// ── GENERIC FETCH WRAPPER ──────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res  = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  return { status: res.status, ...data };
}

// ── REGISTER ──────────────────────────────────────────────
async function registerUser(name, email, password) {
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.ok) {
      setToken(data.token);
      setSession(data.user);
    }
    return data;
  } catch (err) {
    return { ok: false, msg: 'Cannot connect to server. Is it running?' };
  }
}

// ── LOGIN ─────────────────────────────────────────────────
async function loginUser(email, password) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.ok) {
      setToken(data.token);
      setSession(data.user);
    }
    return data;
  } catch (err) {
    return { ok: false, msg: 'Cannot connect to server. Is it running?' };
  }
}

// ── LOGOUT ────────────────────────────────────────────────
function logoutUser() {
  clearSession();
  window.location.href = 'index.html';
}

// ── CART API ──────────────────────────────────────────────
async function getCart() {
  if (!getSession()) return [];
  try {
    const data = await apiFetch('/cart');
    return data.ok ? data.items : [];
  } catch { return []; }
}

async function addToCartAPI(book) {
  if (!getSession()) return { ok: false, msg: 'Please log in to add books to your cart.' };
  try {
    return await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({
        book_id: book.id,
        title:   book.title,
        author:  book.author,
        price:   book.price,
        cover:   book.cover,
        emoji:   book.emoji || '',
      }),
    });
  } catch { return { ok: false, msg: 'Server error.' }; }
}

async function removeFromCartAPI(bookId) {
  try {
    return await apiFetch(`/cart/${bookId}`, { method: 'DELETE' });
  } catch { return { ok: false }; }
}

// ── CHECKOUT ──────────────────────────────────────────────
async function checkoutAPI() {
  try {
    return await apiFetch('/library/checkout', { method: 'POST' });
  } catch { return { ok: false, msg: 'Server error during checkout.' }; }
}

// ── LIBRARY ───────────────────────────────────────────────
async function getLibraryAPI() {
  if (!getSession()) return [];
  try {
    const data = await apiFetch('/library');
    return data.ok ? data.items : [];
  } catch { return []; }
}

// ── NAV USER BUTTON ───────────────────────────────────────
function initAuthNav() {
  const session  = getSession();
  const loginBtns = document.querySelectorAll('.btn-login');

  loginBtns.forEach(btn => {
    if (session) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;display:inline-block;';

      const userBtn = document.createElement('button');
      userBtn.className = 'btn-user-nav';
      userBtn.innerHTML = `<span class="user-avatar">${session.name.charAt(0).toUpperCase()}</span>${session.name.split(' ')[0]} ▾`;

      const dropdown = document.createElement('div');
      dropdown.className = 'user-dropdown';
      dropdown.innerHTML = `
        <div class="ud-header">
          <strong>${session.name}</strong>
          <span>${session.email}</span>
        </div>
        <a href="#" class="ud-item" onclick="showMyLibrary(event)">📚 My Library</a>
        <a href="#" class="ud-item logout-item" onclick="logoutUser()">🚪 Logout</a>
      `;

      userBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));

      wrapper.appendChild(userBtn);
      wrapper.appendChild(dropdown);
      btn.replaceWith(wrapper);
    }
  });
}

// ── MY LIBRARY PANEL ──────────────────────────────────────
async function showMyLibrary(e) {
  e && e.preventDefault();

  // Show panel immediately with loading state
  let existing = document.getElementById('libraryModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'libraryModal';
  modal.innerHTML = `
    <div class="lib-overlay" onclick="document.getElementById('libraryModal').remove()"></div>
    <div class="lib-panel">
      <div class="lib-header">
        <h2>📚 My Library</h2>
        <button onclick="document.getElementById('libraryModal').remove()">✕</button>
      </div>
      <div class="lib-body" id="libBody">
        <p class="lib-empty" style="opacity:0.5">Loading your books…</p>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Fetch from API
  const items = await getLibraryAPI();
  const body  = document.getElementById('libBody');
  if (!body) return;

  body.innerHTML = items.length
    ? items.map(b => `
        <div class="lib-item">
          <div class="lib-cover" style="background:${b.cover}">${b.emoji || '📖'}</div>
          <div>
            <p class="lib-title">${b.title}</p>
            <p class="lib-author">by ${b.author}</p>
            <p class="lib-price">${b.price_paid == 0 ? 'Free' : '$' + parseFloat(b.price_paid).toFixed(2)}</p>
          </div>
        </div>`).join('')
    : '<p class="lib-empty">No purchased books yet.<br>Start exploring!</p>';
}

// ── SHARED STYLES ─────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('inkwell-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'inkwell-auth-styles';
  style.textContent = `
    .btn-user-nav {
      display:flex;align-items:center;gap:0.5rem;
      background:var(--warm,#f0e8d8);color:var(--ink,#1a1208);
      border:1.5px solid rgba(26,18,8,0.15);border-radius:40px;
      padding:0.45rem 1rem 0.45rem 0.5rem;
      font-family:'DM Sans',sans-serif;font-size:0.85rem;font-weight:600;
      cursor:pointer;transition:border-color 0.2s,background 0.2s;
    }
    .btn-user-nav:hover { border-color:var(--gold,#c9973a);background:#fff; }
    .user-avatar {
      width:26px;height:26px;border-radius:50%;
      background:var(--gold,#c9973a);color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:0.78rem;font-weight:700;flex-shrink:0;
    }
    .user-dropdown {
      display:none;position:absolute;right:0;top:calc(100% + 8px);
      background:#fff;border-radius:14px;min-width:210px;
      box-shadow:0 8px 32px rgba(26,18,8,0.18);
      border:1px solid rgba(26,18,8,0.07);z-index:200;overflow:hidden;
    }
    .user-dropdown.open { display:block;animation:udFade 0.18s ease; }
    @keyframes udFade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .ud-header { padding:0.9rem 1.1rem 0.7rem;border-bottom:1px solid rgba(26,18,8,0.07); }
    .ud-header strong { display:block;font-size:0.9rem;color:var(--ink,#1a1208);margin-bottom:0.2rem; }
    .ud-header span { font-size:0.75rem;color:var(--muted,#8a7d6a); }
    .ud-item { display:block;padding:0.7rem 1.1rem;font-size:0.88rem;color:var(--ink,#1a1208);text-decoration:none;transition:background 0.15s; }
    .ud-item:hover { background:var(--warm,#f0e8d8); }
    .logout-item { color:#c0522a!important;border-top:1px solid rgba(26,18,8,0.07); }
    /* Library Panel */
    #libraryModal { position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:flex-end; }
    .lib-overlay { position:absolute;inset:0;background:rgba(26,18,8,0.35);backdrop-filter:blur(4px); }
    .lib-panel { position:relative;width:380px;max-width:95vw;height:100vh;background:#faf6ef;
      display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(26,18,8,0.18);animation:libSlide 0.3s ease; }
    @keyframes libSlide { from{transform:translateX(100%)} to{transform:translateX(0)} }
    .lib-header { display:flex;justify-content:space-between;align-items:center;
      padding:1.5rem;border-bottom:1px solid rgba(26,18,8,0.1); }
    .lib-header h2 { font-family:'Playfair Display',serif;font-size:1.3rem; }
    .lib-header button { background:none;border:none;font-size:1.2rem;cursor:pointer;color:#8a7d6a; }
    .lib-body { padding:1.2rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1rem; }
    .lib-item { display:flex;gap:0.9rem;align-items:center;background:#fff;border-radius:12px;padding:0.8rem; }
    .lib-cover { width:48px;height:64px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0; }
    .lib-title { font-weight:600;font-size:0.9rem;margin-bottom:0.2rem; }
    .lib-author { font-size:0.78rem;color:#8a7d6a;margin-bottom:0.2rem; }
    .lib-price { font-size:0.78rem;color:#c9973a;font-weight:600; }
    .lib-empty { text-align:center;color:#8a7d6a;padding:2rem;line-height:1.8; }
  `;
  document.head.appendChild(style);
})();
