-- ============================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================

-- Batch stock decrement + inventory logging (single DB round-trip)
CREATE OR REPLACE FUNCTION process_sale_items(
  p_items JSONB,
  p_sale_id UUID,
  p_performed_by UUID
)
RETURNS void AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Decrement variant stock
    UPDATE public.product_variants
    SET stock = GREATEST(0, stock - (item->>'quantity')::INTEGER)
    WHERE id = (item->'variant'->>'id')::UUID;

    -- Only log movement if variant exists
    IF (item->'variant'->>'id') IS NOT NULL THEN
      INSERT INTO public.inventory_movements (
        product_id, variant_id, type, quantity, notes, reference_id, performed_by
      ) VALUES (
        (item->'product'->>'id')::UUID,
        (item->'variant'->>'id')::UUID,
        'sale',
        -((item->>'quantity')::INTEGER),
        'Sale #' || substring(p_sale_id::text, 1, 8),
        p_sale_id,
        p_performed_by
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_status_created
  ON public.sales(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_cashier_created
  ON public.sales(cashier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_type_name
  ON public.products(is_active, type, name);

CREATE INDEX IF NOT EXISTS idx_sale_items_product_quantity
  ON public.sale_items(product_id, quantity DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_desc
  ON public.inventory_movements(created_at DESC);
