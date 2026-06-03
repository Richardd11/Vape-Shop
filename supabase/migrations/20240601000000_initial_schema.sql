-- ============================================================
-- VAPE SHOP POS + IMS — Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. FLAVORS (centralized flavor registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flavors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  brand_id          UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  category_id       UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  type              TEXT NOT NULL CHECK (type IN ('device', 'juice', 'pod', 'disposable')),
  sku               TEXT UNIQUE,
  description       TEXT,
  base_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price        NUMERIC(10,2) DEFAULT 0,
  low_stock_alert   INTEGER NOT NULL DEFAULT 5,
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast product search
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);

-- ============================================================
-- 6. PRODUCT VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  flavor_id           UUID REFERENCES public.flavors(id) ON DELETE SET NULL,
  nicotine_strength   TEXT,
  size_ml             NUMERIC,
  puff_count          INTEGER,
  device_compat       TEXT,
  sku_variant         TEXT UNIQUE,
  price_override      NUMERIC(10,2),
  stock               INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_flavor ON public.product_variants(flavor_id);

-- ============================================================
-- 7. SALES (Transaction Header)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('cash', 'gcash', 'mixed')),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_tendered   NUMERIC(10,2),
  gcash_amount    NUMERIC(10,2),
  change_amount   NUMERIC(10,2) DEFAULT 0,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- ============================================================
-- 8. SALE ITEMS (Line Items)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id         UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id      UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name    TEXT NOT NULL,
  variant_label   TEXT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total      NUMERIC(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON public.sale_items(variant_id);

-- ============================================================
-- 9. INVENTORY MOVEMENTS (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id      UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('purchase_in', 'sale', 'adjustment', 'return', 'initial')),
  quantity        INTEGER NOT NULL,
  notes           TEXT,
  reference_id    UUID,
  performed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_variant ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON public.inventory_movements(created_at DESC);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cashier')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: Auto-log inventory movement on variant stock change
-- ============================================================
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO public.inventory_movements (
      product_id, variant_id, type, quantity, notes
    ) VALUES (
      NEW.product_id,
      NEW.id,
      'adjustment',
      NEW.stock - OLD.stock,
      'Stock adjusted via system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEWS: Product with computed stock total
-- ============================================================
CREATE OR REPLACE VIEW public.products_with_stock AS
SELECT
  p.*,
  b.name AS brand_name,
  c.name AS category_name,
  COALESCE(SUM(pv.stock), 0) AS total_stock,
  COUNT(pv.id) AS variant_count
FROM public.products p
LEFT JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
GROUP BY p.id, b.name, c.name;

-- ============================================================
-- VIEWS: Daily Sales Summary
-- ============================================================
CREATE OR REPLACE VIEW public.daily_sales_summary AS
SELECT
  DATE(created_at) AS sale_date,
  COUNT(*) AS transaction_count,
  SUM(total_amount) AS total_revenue,
  SUM(discount_amount) AS total_discounts,
  AVG(total_amount) AS avg_transaction
FROM public.sales
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;
