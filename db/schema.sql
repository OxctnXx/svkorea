-- SV Vape shopping mall database schema for PostgreSQL / Aurora PostgreSQL.
-- Run on a fresh database with a master/admin user:
--   psql -h <endpoint> -p 5432 -U <user> -d <database> -f db/schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'blocked', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'sold_out', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE product_type AS ENUM ('device', 'pod', 'liquid', 'accessory', 'care', 'bundle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE cart_status AS ENUM ('active', 'ordered', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'authorized', 'paid', 'failed', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'preparing', 'shipped', 'delivered', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE discount_type AS ENUM ('percent', 'fixed_amount', 'free_shipping');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name varchar(100) NOT NULL,
  phone varchar(30),
  role user_role NOT NULL DEFAULT 'customer',
  status user_status NOT NULL DEFAULT 'active',
  marketing_opt_in boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS age_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'pending',
  provider varchar(80),
  provider_reference varchar(160),
  birth_date date,
  verified_at timestamptz,
  expires_at timestamptz,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_age_verifications_customer_id
  ON age_verifications(customer_id);

CREATE TRIGGER trg_age_verifications_updated_at
BEFORE UPDATE ON age_verifications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label varchar(60),
  recipient_name varchar(100) NOT NULL,
  phone varchar(30) NOT NULL,
  postal_code varchar(20) NOT NULL,
  address_line1 varchar(255) NOT NULL,
  address_line2 varchar(255),
  is_default_shipping boolean NOT NULL DEFAULT false,
  is_default_billing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id
  ON customer_addresses(customer_id);

CREATE TRIGGER trg_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON categories(parent_id);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_brands_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  slug varchar(160) NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  product_type product_type NOT NULL,
  status product_status NOT NULL DEFAULT 'draft',
  short_description varchar(300),
  description text,
  adult_only boolean NOT NULL DEFAULT true,
  tax_category varchar(80),
  search_keywords text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON products(brand_id);

CREATE INDEX IF NOT EXISTS idx_products_status_type
  ON products(status, product_type);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_id
  ON product_categories(category_id);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text varchar(200),
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(80) NOT NULL UNIQUE,
  variant_name varchar(160) NOT NULL,
  color varchar(80),
  flavor varchar(120),
  capacity_ml numeric(8,2),
  nicotine_mg_ml numeric(8,2),
  barcode varchar(100),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  cost_price numeric(12,2) CHECK (cost_price IS NULL OR cost_price >= 0),
  weight_grams integer CHECK (weight_grams IS NULL OR weight_grams >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants(product_id);

CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  code varchar(40) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_inventory_locations_updated_at
BEFORE UPDATE ON inventory_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES inventory_locations(id) ON DELETE CASCADE,
  quantity_available integer NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  safety_stock integer NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id
  ON inventory_items(variant_id);

CREATE TRIGGER trg_inventory_items_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  session_id varchar(160),
  status cart_status NOT NULL DEFAULT 'active',
  currency char(3) NOT NULL DEFAULT 'KRW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id
  ON carts(customer_id);

CREATE INDEX IF NOT EXISTS idx_carts_session_id
  ON carts(session_id);

CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id
  ON cart_items(cart_id);

CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(60) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value numeric(12,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (minimum_order_amount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit >= 0),
  usage_limit_per_customer integer CHECK (usage_limit_per_customer IS NULL OR usage_limit_per_customer >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number varchar(40) NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  fulfillment_status fulfillment_status NOT NULL DEFAULT 'unfulfilled',
  currency char(3) NOT NULL DEFAULT 'KRW',
  subtotal_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  customer_email citext,
  customer_name varchar(100),
  customer_phone varchar(30),
  shipping_recipient varchar(100),
  shipping_phone varchar(30),
  shipping_postal_code varchar(20),
  shipping_address_line1 varchar(255),
  shipping_address_line2 varchar(255),
  order_note text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status, payment_status, fulfillment_status);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  sku varchar(80) NOT NULL,
  product_name varchar(180) NOT NULL,
  variant_name varchar(160) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_coupons (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  code varchar(60) NOT NULL,
  discount_amount numeric(12,2) NOT NULL CHECK (discount_amount >= 0),
  PRIMARY KEY (order_id, coupon_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider varchar(80) NOT NULL,
  provider_payment_id varchar(160),
  status payment_status NOT NULL DEFAULT 'unpaid',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL DEFAULT 'KRW',
  approved_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments(provider, provider_payment_id);

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier varchar(80),
  tracking_number varchar(120),
  status fulfillment_status NOT NULL DEFAULT 'preparing',
  shipped_at timestamptz,
  delivered_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id
  ON shipments(order_id);

CREATE TRIGGER trg_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title varchar(160),
  body text,
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id
  ON product_reviews(product_id);

CREATE TRIGGER trg_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(120) NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id);

INSERT INTO inventory_locations (name, code)
VALUES ('Main Warehouse', 'MAIN')
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (slug, name, display_order)
VALUES
  ('devices', 'Devices', 10),
  ('pods-cartridges', 'Pods / Cartridges', 20),
  ('accessories', 'Accessories', 30),
  ('care', 'Care', 40)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
