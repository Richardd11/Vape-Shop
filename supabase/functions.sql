-- ============================================================
-- SUPABASE FUNCTIONS (apply in SQL Editor after schema.sql)
-- ============================================================

-- Safe stock decrement (prevents negative stock)
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
