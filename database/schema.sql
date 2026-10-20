-- SalesFlow AI - MySQL schema
CREATE DATABASE IF NOT EXISTS salesflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salesflow;

DROP TABLE IF EXISTS chat_logs, inventory_logs, reviews, order_items, orders, coupons, products, categories, users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  role ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(12,0) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  image_url VARCHAR(500),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percent','fixed') NOT NULL,
  value DECIMAL(12,0) NOT NULL,
  min_order DECIMAL(12,0) NOT NULL DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 0,          -- 0 = unlimited
  used_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id INT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  subtotal DECIMAL(12,0) NOT NULL,
  discount DECIMAL(12,0) NOT NULL DEFAULT 0,
  total DECIMAL(12,0) NOT NULL,
  coupon_code VARCHAR(50),
  payment_method ENUM('cod','bank') NOT NULL DEFAULT 'cod',
  status ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL DEFAULT 'pending',
  note VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(12,0) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(1000),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  change_qty INT NOT NULL,
  reason VARCHAR(255),
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE chat_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
