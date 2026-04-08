-- ═══════════════════════════════════════════
--  InkWell Database Schema
--  Run this once to set up your MySQL database
-- ═══════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS inkwell CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inkwell;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,        -- bcrypt hashed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items (per user, cleared after purchase)
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  book_id    INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  author     VARCHAR(150) NOT NULL,
  price      DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  cover      TEXT,
  emoji      VARCHAR(10),
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, book_id)   -- no duplicates per user
);

-- Library (permanently owned books after purchase)
CREATE TABLE IF NOT EXISTS library (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  book_id      INT          NOT NULL,
  title        VARCHAR(255) NOT NULL,
  author       VARCHAR(150) NOT NULL,
  price_paid   DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  cover        TEXT,
  emoji        VARCHAR(10),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_library_item (user_id, book_id)
);
