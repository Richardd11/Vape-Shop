-- ============================================================
-- ENABLE SUPABASE REALTIME ON KEY TABLES
-- ============================================================

-- Step 1: Set REPLICA IDENTITY FULL on tables we want to track
-- This sends the full old+new row data in change events

ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.sale_items REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_variants REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_movements REPLICA IDENTITY FULL;

-- Step 2: Add tables to the supabase_realtime publication
-- This tells Supabase Realtime to broadcast changes for these tables

ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
