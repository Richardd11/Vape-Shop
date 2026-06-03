-- ============================================================
-- VAPE SHOP POS — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- ============================================================
-- BRANDS (Admin: CRUD, Cashier: READ)
-- ============================================================
CREATE POLICY "All authenticated users can view brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert brands"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update brands"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete brands"
  ON public.brands FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE POLICY "All authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- FLAVORS
-- ============================================================
CREATE POLICY "All authenticated users can view flavors"
  ON public.flavors FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage flavors"
  ON public.flavors FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- PRODUCTS (Admin: CRUD, Cashier: READ active only)
-- ============================================================
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Cashiers can view active products"
  ON public.products FOR SELECT
  TO authenticated
  USING (get_user_role() = 'cashier' AND is_active = TRUE);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE POLICY "Admins can view all variants"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Cashiers can view active variants"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (get_user_role() = 'cashier' AND is_active = TRUE);

CREATE POLICY "Admins can insert variants"
  ON public.product_variants FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update variants"
  ON public.product_variants FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete variants"
  ON public.product_variants FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- SALES (Cashier: insert own, view own; Admin: all)
-- ============================================================
CREATE POLICY "Cashiers can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "Cashiers can view own sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (cashier_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Admins can update/void sales"
  ON public.sales FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================
-- SALE ITEMS
-- ============================================================
CREATE POLICY "Sale items visible with sale access"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id
        AND (s.cashier_id = auth.uid() OR get_user_role() = 'admin')
    )
  );

CREATE POLICY "Cashiers can insert sale items"
  ON public.sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id AND s.cashier_id = auth.uid()
    )
  );

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE POLICY "Authenticated users can view movements"
  ON public.inventory_movements FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert movements"
  ON public.inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Cashiers can insert sale movements"
  ON public.inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (type = 'sale');
