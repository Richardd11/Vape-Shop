-- ============================================================
-- PAYMONGO CHECKOUT INTEGRATION
-- Adds: payment columns on store_orders, payments table, RPCs
-- ============================================================

-- ============================================================
-- 1. ADD PAYMENT COLUMNS TO store_orders
-- ============================================================
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded'));

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS paymongo_checkout_id TEXT;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS paymongo_payment_intent_id TEXT;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS paymongo_transaction_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_store_orders_payment_status ON public.store_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_paymongo_checkout ON public.store_orders(paymongo_checkout_id);

-- ============================================================
-- 2. PAYMENTS TABLE (audit trail for each payment attempt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  paymongo_checkout_id      TEXT,
  paymongo_payment_intent_id TEXT,
  paymongo_payment_id       TEXT,
  transaction_ref           TEXT,
  payment_method            TEXT CHECK (payment_method IN ('gcash', 'maya', 'card', 'over_the_counter')),
  amount                    NUMERIC(10,2) NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded')),
  webhook_raw               JSONB,
  webhook_received_at       TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout ON public.payments(paymongo_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent ON public.payments(paymongo_payment_intent_id);

-- ============================================================
-- 3. TRIGGER: auto-update updated_at on payments
-- ============================================================
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. RLS: payments table
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Customers can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payments"
  ON public.payments FOR INSERT
  TO authenticated, anon
  WITH CHECK (TRUE);

CREATE POLICY "System can update payments"
  ON public.payments FOR UPDATE
  TO authenticated, anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================
-- 5. RPC: get_order_payments — fetch payments for an order
-- ============================================================
CREATE OR REPLACE FUNCTION get_order_payments(p_order_id UUID)
RETURNS SETOF public.payments
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.payments
  WHERE order_id = p_order_id
  ORDER BY created_at DESC;
$$;

-- ============================================================
-- 6. RPC: update_store_order_payment_status
-- ============================================================
CREATE OR REPLACE FUNCTION update_store_order_payment_status(
  p_order_id UUID,
  p_payment_status TEXT,
  p_paymongo_checkout_id TEXT DEFAULT NULL,
  p_paymongo_payment_intent_id TEXT DEFAULT NULL,
  p_paymongo_transaction_ref TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.store_orders
  SET
    payment_status = p_payment_status,
    paymongo_checkout_id = COALESCE(p_paymongo_checkout_id, paymongo_checkout_id),
    paymongo_payment_intent_id = COALESCE(p_paymongo_payment_intent_id, paymongo_payment_intent_id),
    paymongo_transaction_ref = COALESCE(p_paymongo_transaction_ref, paymongo_transaction_ref),
    status = CASE
      WHEN p_payment_status = 'paid' THEN 'preparing'
      WHEN p_payment_status IN ('failed', 'expired') THEN 'pending'
      ELSE status
    END
  WHERE id = p_order_id;
END;
$$;

-- ============================================================
-- 7. RPC: create_store_order — for PayMongo checkout (pending)
-- ============================================================
CREATE OR REPLACE FUNCTION create_store_order(
  p_customer_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_shipping_address TEXT,
  p_payment_method TEXT,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_customer_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_qty INTEGER;
  v_unit_price NUMERIC;
  v_subtotal NUMERIC := 0;
  v_order_data JSONB;
BEGIN
  -- Calculate subtotal and validate products
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
    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  END LOOP;

  -- Create order with pending payment
  INSERT INTO public.store_orders (
    customer_name, email, phone, shipping_address,
    payment_method, subtotal, discount_amount, total_amount,
    customer_id, status, payment_status
  ) VALUES (
    p_customer_name, p_email, p_phone, p_shipping_address,
    p_payment_method, v_subtotal, 0, p_total_amount,
    p_customer_id, 'pending', 'pending'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, base_price INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID;

    v_qty := (v_item->>'quantity')::INTEGER;
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_product.base_price);

    INSERT INTO public.store_order_items (order_id, product_id, variant_info, quantity, unit_price)
    VALUES (v_order_id, v_product.id, v_item->>'variant_info', v_qty, v_unit_price);
  END LOOP;

  -- Build return data
  SELECT jsonb_build_object(
    'order_id', id,
    'customer_name', customer_name,
    'email', email,
    'phone', phone,
    'shipping_address', shipping_address,
    'subtotal', subtotal,
    'total_amount', total_amount,
    'payment_method', payment_method,
    'status', status,
    'payment_status', payment_status,
    'created_at', created_at
  ) INTO v_order_data
  FROM public.store_orders WHERE id = v_order_id;

  RETURN v_order_data;
END;
$$;

-- ============================================================
-- 8. RPC: deduct_store_order_inventory — after payment confirmed
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_store_order_inventory(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_qty INTEGER;
  v_product RECORD;
BEGIN
  FOR v_item IN
    SELECT oi.product_id, oi.quantity, oi.variant_info, p.name AS product_name
    FROM public.store_order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = p_order_id
  LOOP
    v_qty := v_item.quantity;

    -- Decrement from highest-stock variant first
    WITH ranked_variants AS (
      SELECT id, stock, ROW_NUMBER() OVER (ORDER BY stock DESC) as rn
      FROM public.product_variants
      WHERE product_id = v_item.product_id AND is_active = TRUE AND stock > 0
    )
    UPDATE public.product_variants pv
    SET stock = GREATEST(0, pv.stock - v_qty),
        updated_at = NOW()
    FROM ranked_variants rv
    WHERE pv.id = rv.id AND rv.rn = 1;

    -- Log inventory movement
    INSERT INTO public.inventory_movements (product_id, quantity, type, reference_id, notes)
    VALUES (v_item.product_id, -v_qty, 'sale', p_order_id, 'Online store order #' || LEFT(p_order_id::TEXT, 8));
  END LOOP;
END;
$$;
