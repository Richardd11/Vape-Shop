-- Add process_sale_items RPC for batch stock decrement + inventory logging
CREATE OR REPLACE FUNCTION process_sale_items(
  p_items JSONB,
  p_sale_id UUID,
  p_performed_by UUID
)
RETURNS void AS $$
DECLARE
  item JSONB;
  v_variant_id UUID;
  v_product_id UUID;
  v_quantity INTEGER;
  v_product_name TEXT;
  v_variant_label TEXT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (item -> 'variant' ->> 'id')::UUID;
    v_product_id := (item -> 'product' ->> 'id')::UUID;
    v_quantity := (item ->> 'quantity')::INTEGER;
    v_product_name := item -> 'product' ->> 'name';
    v_variant_label := CASE
      WHEN item -> 'variant' ? 'flavors' THEN
        (item -> 'variant' -> 'flavors' ->> 'name')
      ELSE NULL
    END;

    -- Decrement variant stock if a variant is selected
    IF v_variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = GREATEST(0, stock - v_quantity)
      WHERE id = v_variant_id;
    END IF;

    -- Log inventory movement
    INSERT INTO public.inventory_movements (
      product_id,
      variant_id,
      type,
      quantity,
      notes,
      reference_id,
      performed_by
    ) VALUES (
      v_product_id,
      v_variant_id,
      'sale',
      -v_quantity,
      v_product_name || COALESCE(' - ' || v_variant_label, ''),
      p_sale_id,
      p_performed_by
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
