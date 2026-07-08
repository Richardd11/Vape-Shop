-- ============================================================
-- SECURITY DEFINER function to insert product images
-- Bypasses RLS so anyone can add images (for store setup)
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_product_image(
  p_product_id UUID,
  p_url TEXT,
  p_is_primary BOOLEAN DEFAULT true,
  p_alt_text TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.product_images (product_id, url, is_primary, alt_text, sort_order)
  VALUES (p_product_id, p_url, p_is_primary, p_alt_text, p_sort_order)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.insert_product_image TO anon, authenticated;

-- Also create a bulk version
CREATE OR REPLACE FUNCTION public.bulk_insert_product_images(
  p_images JSONB
)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  v_id UUID;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_images)
  LOOP
    INSERT INTO public.product_images (
      product_id, url, is_primary, alt_text, sort_order
    ) VALUES (
      (item ->> 'product_id')::UUID,
      item ->> 'url',
      COALESCE((item ->> 'is_primary')::BOOLEAN, true),
      item ->> 'alt_text',
      COALESCE((item ->> 'sort_order')::INTEGER, 0)
    )
    RETURNING id INTO v_id;
    RETURN NEXT v_id;
  END LOOP;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_insert_product_images TO anon, authenticated;
