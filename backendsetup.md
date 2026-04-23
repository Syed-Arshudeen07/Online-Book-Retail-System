# InkWell — Backend Setup Guide

## What's inside

```
inkwell-server/
├── server.js              ← Express entry point
├── db.js                  ← MySQL connection pool
├── schema.sql             ← Run this once to create tables
├── .env                   ← Your MySQL credentials (edit this!)
├── middleware/
│   └── auth.js            ← JWT verification
├── routes/
│   ├── auth.js            ← POST /api/auth/register & /login
│   ├── cart.js            ← GET/POST/DELETE /api/cart
│   └── library.js         ← GET /api/library, POST /api/library/checkout
└── public/                ← All your HTML/CSS/JS frontend files
    ├── auth.js            ← Frontend API client (replaces old localStorage version)
    ├── index.html
    ├── login.html
    ├── bestsellers.html
    ├── deals.html
    ├── categories.html
    ├── about.html
    └── style.css
```

---

## Step 1 — Set up the MySQL database

Open MySQL and run the schema:

```bash
mysql -u root -p < schema.sql
```

Or paste the contents of `schema.sql` directly into MySQL Workbench / phpMyAdmin.

This creates the `inkwell` database with 3 tables:
- `users` — stores name, email, bcrypt-hashed password
- `cart_items` — per-user cart (cleared after purchase)
- `library` — permanently owned books after checkout

---

## Step 2 — Configure your credentials

Edit `.env` with your MySQL details:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=inkwell

JWT_SECRET=change_this_to_a_long_random_string
PORT=3000
```

---

## Step 3 — Install dependencies & start

```bash
cd inkwell-server
npm install        # already done if you received node_modules
npm start          # production
# or
npm run dev        # auto-restarts on file changes (Node 18+)
```

You should see:
```
✅ MySQL connected successfully
🚀 InkWell server running at http://localhost:3000
```

---

## Step 4 — Open the site

Visit **http://localhost:3000** in your browser.

All HTML pages are served from the `public/` folder automatically.

---

## API Endpoints

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/cart` | Yes | Get user's cart |
| POST | `/api/cart` | Yes | Add book to cart |
| DELETE | `/api/cart/:bookId` | Yes | Remove one item |
| DELETE | `/api/cart` | Yes | Clear entire cart |
| GET | `/api/library` | Yes | Get purchased books |
| POST | `/api/library/checkout` | Yes | Buy cart → add to library |

---

## How authentication works

1. User registers or logs in → server returns a **JWT token** (valid 7 days)
2. Token is stored in `localStorage` on the browser
3. Every API request sends the token as `Authorization: Bearer <token>`
4. Protected routes verify the token via the `requireAuth` middleware
5. Logging out clears the token from localStorage

---

## Troubleshooting

**"MySQL connection failed"**
→ Check `.env` credentials. Make sure MySQL is running (`sudo service mysql start` on Linux).

**"Cannot connect to server"** (in browser)
→ Make sure `npm start` is running and you're visiting `http://localhost:3000` (not opening the HTML file directly).

**CORS errors**
→ For production, update `origin` in `server.js` from `'*'` to your actual domain.
