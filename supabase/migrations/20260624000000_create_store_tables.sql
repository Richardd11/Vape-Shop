-- Store customers
CREATE TABLE IF NOT EXISTS public.store_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Store orders
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'gcash', 'maya')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'fulfilled', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store order items
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_info TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== RLS =====
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

-- Public can insert (guest checkout)
CREATE POLICY "Allow public insert on store_customers"
  ON store_customers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert on store_orders"
  ON store_orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public insert on store_order_items"
  ON store_order_items FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Allow authenticated read on store_customers"
  ON store_customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on store_orders"
  ON store_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on store_order_items"
  ON store_order_items FOR SELECT TO authenticated USING (true);

-- Authenticated users can update orders
CREATE POLICY "Allow authenticated update on store_orders"
  ON store_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ===== Public read access for store (anon) =====
CREATE POLICY "Allow public read active products"
  ON public.products FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Allow public read active variants"
  ON public.product_variants FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Allow public read brands"
  ON public.brands FOR SELECT TO anon USING (TRUE);

CREATE POLICY "Allow public read categories"
  ON public.categories FOR SELECT TO anon USING (TRUE);

-- ===== RPC: Process store order =====
-- Validates stock, creates order + items, decrements variant stock
CREATE OR REPLACE FUNCTION process_store_order(
  p_customer_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_shipping_address TEXT,
  p_payment_method TEXT,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total_stock INTEGER;
  v_total DECIMAL(10,2) := 0;
  v_qty INTEGER;
  v_order_data JSONB;
BEGIN
  -- Create the order
  INSERT INTO store_orders (customer_name, email, phone, shipping_address, payment_method, total_amount)
  VALUES (p_customer_name, p_email, p_phone, p_shipping_address, p_payment_method, 0)
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product
    SELECT id, name, base_price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    v_qty := (v_item->>'quantity')::INTEGER;

    -- Compute total stock from active variants
    SELECT COALESCE(SUM(pv.stock), 0) INTO v_total_stock
    FROM product_variants pv
    WHERE pv.product_id = v_product.id AND pv.is_active = TRUE;

    IF v_total_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', v_product.name, v_total_stock;
    END IF;

    -- Insert order item
    INSERT INTO store_order_items (order_id, product_id, variant_info, quantity, unit_price)
    VALUES (v_order_id, v_product.id, v_item->>'variant_info', v_qty, v_product.base_price);

    -- Decrement stock from variants (drain from highest-stock variant first)
    WITH variant_stock AS (
      SELECT id, stock
      FROM product_variants
      WHERE product_id = v_product.id AND is_active = TRUE AND stock > 0
      ORDER BY stock DESC
    )
    UPDATE product_variants pv
    SET stock = GREATEST(0, pv.stock - v_qty),
        updated_at = now()
    FROM variant_stock vs
    WHERE pv.id = vs.id;

    v_total := v_total + (v_product.base_price * v_qty);
  END LOOP;

  -- Update total
  UPDATE store_orders SET total_amount = v_total WHERE id = v_order_id;

  -- Record inventory movement
  INSERT INTO inventory_movements (product_id, quantity, type, reference_id, notes)
  SELECT
    (v_item->>'product_id')::UUID,
    -((v_item->>'quantity')::INTEGER),
    'sale',
    v_order_id,
    'Online store order'
  FROM jsonb_array_elements(p_items) AS v_item;

  -- Build return data
  SELECT jsonb_build_object(
    'order_id', id,
    'customer_name', customer_name,
    'total_amount', total_amount,
    'status', status,
    'created_at', created_at
  ) INTO v_order_data
  FROM store_orders WHERE id = v_order_id;

  RETURN v_order_data;
END;
$$;
