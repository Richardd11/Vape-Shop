-- ============================================================
-- E-COMMERCE EXTENSIONS MIGRATION
-- Adds tables for: product images, reviews, wishlists, addresses,
-- coupons, flash sales, promo banners, recently viewed
-- ============================================================

-- ============================================================
-- 1. EXTEND PROFILES: Add 'customer' role
-- ============================================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'cashier', 'customer'));

-- ============================================================
-- 2. EXTEND PRODUCTS: Add slug for SEO-friendly URLs
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing products
UPDATE public.products
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::TEXT, 8)
WHERE slug IS NULL;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ============================================================
-- 3. PRODUCT IMAGES (multi-image gallery)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ============================================================
-- 4. PRODUCT REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title       TEXT,
  body        TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profile ON public.product_reviews(profile_id);

-- ============================================================
-- 5. CUSTOMER ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',
  full_name   TEXT NOT NULL,
  phone       TEXT,
  street      TEXT NOT NULL,
  barangay    TEXT,
  city        TEXT NOT NULL,
  province    TEXT NOT NULL,
  zip_code    TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_profile ON public.customer_addresses(profile_id);

-- ============================================================
-- 6. WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_profile ON public.wishlists(profile_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);

-- ============================================================
-- 7. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  description   TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount   NUMERIC(10,2),
  max_uses       INTEGER,
  current_uses   INTEGER NOT NULL DEFAULT 0,
  valid_from     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until    TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ============================================================
-- 8. COUPON USAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);

-- ============================================================
-- 9. FLASH SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sale_price   NUMERIC(10,2) NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  CHECK (sale_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON public.flash_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON public.flash_sales(is_active, starts_at, ends_at);

-- ============================================================
-- 10. PROMO BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  banner_type TEXT NOT NULL DEFAULT 'hero' CHECK (banner_type IN ('hero', 'ticker', 'popup')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ DEFAULT NOW(),
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. RECENTLY VIEWED
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id  TEXT,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_profile ON public.recently_viewed(profile_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON public.recently_viewed(session_id, viewed_at DESC);

-- ============================================================
-- 12. ADD coupon_code AND customer_id TO store_orders
-- ============================================================
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_store_orders_customer ON public.store_orders(customer_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at for new tables
-- ============================================================
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS: PRODUCT IMAGES (public read, admin write)
-- ============================================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- RLS: PRODUCT REVIEWS (public read approved, own write)
-- ============================================================
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON public.product_reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = TRUE);

CREATE POLICY "Admins can view all reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can insert own reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- RLS: CUSTOMER ADDRESSES (own data only)
-- ============================================================
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON public.customer_addresses FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own addresses"
  ON public.customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON public.customer_addresses FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON public.customer_addresses FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- RLS: WISHLISTS (own data only)
-- ============================================================
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- RLS: COUPONS (public read active, admin write)
-- ============================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- RLS: COUPON USAGES
-- ============================================================
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view coupon usages"
  ON public.coupon_usages FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "System can insert coupon usages"
  ON public.coupon_usages FOR INSERT
  TO authenticated, anon
  WITH CHECK (TRUE);

-- ============================================================
-- RLS: FLASH SALES (public read active, admin write)
-- ============================================================
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active flash sales"
  ON public.flash_sales FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE AND starts_at <= NOW() AND ends_at > NOW());

CREATE POLICY "Admins can view all flash sales"
  ON public.flash_sales FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can manage flash sales"
  ON public.flash_sales FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- RLS: PROMO BANNERS (public read active, admin write)
-- ============================================================
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.promo_banners FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
  );

CREATE POLICY "Admins can manage banners"
  ON public.promo_banners FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- RLS: RECENTLY VIEWED
-- ============================================================
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recent views"
  ON public.recently_viewed FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Anyone can insert recent views"
  ON public.recently_viewed FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Anon can view own session views"
  ON public.recently_viewed FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

-- ============================================================
-- RLS: Allow anon to read flavors (for storefront variant display)
-- ============================================================
CREATE POLICY "Allow public read flavors"
  ON public.flavors FOR SELECT TO anon USING (TRUE);

-- ============================================================
-- RLS: Allow customers to read own orders
-- ============================================================
CREATE POLICY "Customers can view own orders"
  ON public.store_orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can view own order items"
  ON public.store_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: APPLY COUPON — validates and returns discount
-- ============================================================
CREATE OR REPLACE FUNCTION apply_coupon(
  p_code TEXT,
  p_order_total NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC(10,2);
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid coupon code');
  END IF;

  -- Check date validity
  IF v_coupon.valid_from > NOW() THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'This coupon is not yet active');
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'This coupon has expired');
  END IF;

  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'This coupon has reached its usage limit');
  END IF;

  -- Check minimum order amount
  IF p_order_total < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'error', 'Minimum order amount of ₱' || v_coupon.min_order_amount::TEXT || ' required'
    );
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND(p_order_total * (v_coupon.discount_value / 100), 2);
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_total);
  END IF;

  RETURN jsonb_build_object(
    'valid', TRUE,
    'discount', v_discount,
    'coupon_id', v_coupon.id,
    'description', v_coupon.description,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value
  );
END;
$$;

-- ============================================================
-- RPC: PROCESS STORE ORDER V2 — enhanced with coupon + customer support
-- ============================================================
CREATE OR REPLACE FUNCTION process_store_order_v2(
  p_customer_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_shipping_address TEXT,
  p_payment_method TEXT,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total_stock INTEGER;
  v_subtotal NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_qty INTEGER;
  v_unit_price NUMERIC(10,2);
  v_coupon_result JSONB;
  v_order_data JSONB;
BEGIN
  -- Calculate subtotal first (validate all items)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, base_price INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND is_active = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_item->>'product_id';
    END IF;

    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.base_price);

    -- Validate stock
    SELECT COALESCE(SUM(pv.stock), 0) INTO v_total_stock
    FROM public.product_variants pv
    WHERE pv.product_id = v_product.id AND pv.is_active = TRUE;

    IF v_total_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', v_product.name, v_total_stock;
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  END LOOP;

  -- Apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    v_coupon_result := apply_coupon(p_coupon_code, v_subtotal);
    IF (v_coupon_result->>'valid')::BOOLEAN THEN
      v_discount := (v_coupon_result->>'discount')::NUMERIC;
    ELSE
      RAISE EXCEPTION 'Coupon error: %', v_coupon_result->>'error';
    END IF;
  END IF;

  v_total := v_subtotal - v_discount;

  -- Create order
  INSERT INTO public.store_orders (
    customer_name, email, phone, shipping_address,
    payment_method, subtotal, discount_amount, total_amount,
    coupon_code, customer_id
  ) VALUES (
    p_customer_name, p_email, p_phone, p_shipping_address,
    p_payment_method, v_subtotal, v_discount, v_total,
    p_coupon_code, p_customer_id
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, base_price INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID;

    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.base_price);

    -- Insert order item
    INSERT INTO public.store_order_items (order_id, product_id, variant_info, quantity, unit_price)
    VALUES (v_order_id, v_product.id, v_item->>'variant_info', v_qty, v_unit_price);

    -- Decrement stock (drain from highest-stock variant first)
    WITH ranked_variants AS (
      SELECT id, stock, ROW_NUMBER() OVER (ORDER BY stock DESC) as rn
      FROM public.product_variants
      WHERE product_id = v_product.id AND is_active = TRUE AND stock > 0
    )
    UPDATE public.product_variants pv
    SET stock = GREATEST(0, pv.stock - v_qty),
        updated_at = NOW()
    FROM ranked_variants rv
    WHERE pv.id = rv.id AND rv.rn = 1;

    -- Log inventory movement
    INSERT INTO public.inventory_movements (product_id, quantity, type, reference_id, notes)
    VALUES (v_product.id, -v_qty, 'sale', v_order_id, 'Online store order #' || LEFT(v_order_id::TEXT, 8));
  END LOOP;

  -- Record coupon usage
  IF p_coupon_code IS NOT NULL AND v_discount > 0 THEN
    UPDATE public.coupons
    SET current_uses = current_uses + 1
    WHERE code = UPPER(TRIM(p_coupon_code));

    INSERT INTO public.coupon_usages (coupon_id, order_id, profile_id)
    SELECT id, v_order_id, p_customer_id
    FROM public.coupons
    WHERE code = UPPER(TRIM(p_coupon_code));
  END IF;

  -- Build return data
  SELECT jsonb_build_object(
    'order_id', id,
    'customer_name', customer_name,
    'subtotal', subtotal,
    'discount_amount', discount_amount,
    'total_amount', total_amount,
    'status', status,
    'created_at', created_at
  ) INTO v_order_data
  FROM public.store_orders WHERE id = v_order_id;

  RETURN v_order_data;
END;
$$;

-- ============================================================
-- VIEW: Active flash sales with product info
-- ============================================================
CREATE OR REPLACE VIEW public.active_flash_sales AS
SELECT
  fs.*,
  p.name AS product_name,
  p.base_price AS original_price,
  p.image_url AS product_image_url,
  p.slug AS product_slug,
  ROUND(((p.base_price - fs.sale_price) / p.base_price) * 100) AS discount_percentage
FROM public.flash_sales fs
JOIN public.products p ON fs.product_id = p.id
WHERE fs.is_active = TRUE
  AND fs.starts_at <= NOW()
  AND fs.ends_at > NOW()
  AND p.is_active = TRUE
ORDER BY fs.ends_at ASC;

-- ============================================================
-- VIEW: Product average ratings
-- ============================================================
CREATE OR REPLACE VIEW public.product_ratings AS
SELECT
  product_id,
  COUNT(*) AS review_count,
  ROUND(AVG(rating)::NUMERIC, 1) AS avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) AS five_star,
  COUNT(*) FILTER (WHERE rating = 4) AS four_star,
  COUNT(*) FILTER (WHERE rating = 3) AS three_star,
  COUNT(*) FILTER (WHERE rating = 2) AS two_star,
  COUNT(*) FILTER (WHERE rating = 1) AS one_star
FROM public.product_reviews
WHERE is_approved = TRUE
GROUP BY product_id;

-- ============================================================
-- Enable realtime for new tables that need it
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;
