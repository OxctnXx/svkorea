CREATE TABLE IF NOT EXISTS members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(80) NOT NULL,
  phone VARCHAR(30),
  birth_date DATE NOT NULL,
  adult_confirmed TINYINT(1) NOT NULL DEFAULT 0,
  terms_accepted TINYINT(1) NOT NULL DEFAULT 0,
  marketing_agreed TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_members_email (email),
  KEY idx_members_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL,
  member_id BIGINT UNSIGNED NULL,
  order_type VARCHAR(20) NOT NULL DEFAULT 'GUEST',
  recipient_name VARCHAR(80) NOT NULL,
  recipient_phone VARCHAR(30) NOT NULL,
  recipient_email VARCHAR(255),
  shipping_address VARCHAR(500) NOT NULL,
  shipping_memo VARCHAR(500),
  payment_method VARCHAR(30) NOT NULL,
  subtotal_amount INT UNSIGNED NOT NULL,
  shipping_fee INT UNSIGNED NOT NULL DEFAULT 0,
  total_amount INT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  courier_company VARCHAR(50),
  tracking_no VARCHAR(60),
  adult_confirmed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_status (status),
  KEY idx_orders_member_id (member_id),
  KEY idx_orders_recipient_phone (recipient_phone),
  CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  option_name VARCHAR(200),
  unit_price INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
