// ============================================================
// VAPE SHOP POS — TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'cashier';

export type ProductType = 'device' | 'juice' | 'pod' | 'disposable';

export type PaymentType = 'cash' | 'gcash' | 'mixed';

export type SaleStatus = 'completed' | 'voided';

export type MovementType = 'purchase_in' | 'sale' | 'adjustment' | 'return' | 'initial';

// ============================================================
// PROFILES
// ============================================================
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// BRANDS
// ============================================================
export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

// ============================================================
// CATEGORIES
// ============================================================
export interface Category {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

// ============================================================
// FLAVORS
// ============================================================
export interface Flavor {
  id: string;
  name: string;
  created_at: string;
}

// ============================================================
// PRODUCTS
// ============================================================
export interface Product {
  id: string;
  name: string;
  brand_id: string;
  category_id: string;
  type: ProductType;
  sku: string | null;
  description: string | null;
  base_price: number;
  cost_price: number | null;
  low_stock_alert: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  brand_name?: string;
  category_name?: string;
  total_stock?: number;
  variant_count?: number;
}

export interface ProductWithDetails extends Product {
  brands?: Brand;
  categories?: Category;
  product_variants?: ProductVariant[];
}

// ============================================================
// PRODUCT VARIANTS
// ============================================================
export interface ProductVariant {
  id: string;
  product_id: string;
  flavor_id: string | null;
  nicotine_strength: string | null;
  size_ml: number | null;
  puff_count: number | null;
  device_compat: string | null;
  sku_variant: string | null;
  price_override: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  flavors?: Flavor;
  // Computed
  effective_price?: number;
  display_label?: string;
}

// ============================================================
// SALES
// ============================================================
export interface Sale {
  id: string;
  cashier_id: string;
  payment_type: PaymentType;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  cash_tendered: number | null;
  gcash_amount: number | null;
  change_amount: number;
  notes: string | null;
  status: SaleStatus;
  created_at: string;
  // Joined
  profiles?: Profile;
  sale_items?: SaleItem[];
}

// ============================================================
// SALE ITEMS
// ============================================================
export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
}

// ============================================================
// INVENTORY MOVEMENTS
// ============================================================
export interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: MovementType;
  quantity: number;
  notes: string | null;
  reference_id: string | null;
  performed_by: string | null;
  created_at: string;
  // Joined
  products?: Product;
  product_variants?: ProductVariant;
  profiles?: Profile;
}

// ============================================================
// POS CART (Client-only, not stored in DB)
// ============================================================
export interface CartItem {
  id: string; // unique cart line id
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  total: number;
}

// ============================================================
// DASHBOARD / REPORTS
// ============================================================
export interface DailySalesSummary {
  sale_date: string;
  transaction_count: number;
  total_revenue: number;
  total_discounts: number;
  avg_transaction: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface DashboardStats {
  today_revenue: number;
  today_transactions: number;
  month_revenue: number;
  month_transactions: number;
  low_stock_count: number;
  total_products: number;
}

// ============================================================
// E-COMMERCE STORE TYPES
// ============================================================
export interface StoreCustomer {
  id: string
  email: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'partially_refunded'

export interface StoreOrder {
  id: string
  customer_name: string
  email: string
  phone: string | null
  shipping_address: string
  payment_method: 'cod' | 'gcash' | 'maya'
  status: 'pending' | 'preparing' | 'fulfilled' | 'cancelled'
  total_amount: number
  subtotal: number
  discount_amount: number
  notes: string | null
  payment_status: PaymentStatus
  paymongo_checkout_id: string | null
  paymongo_payment_intent_id: string | null
  paymongo_transaction_ref: string | null
  customer_id: string | null
  coupon_code: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  paymongo_checkout_id: string | null
  paymongo_payment_intent_id: string | null
  paymongo_payment_id: string | null
  transaction_ref: string | null
  payment_method: string | null
  amount: number
  status: PaymentStatus
  webhook_raw: unknown
  webhook_received_at: string | null
  created_at: string
  updated_at: string
}

export interface StoreOrderItem {
  id: string
  order_id: string
  product_id: string
  variant_info: string | null
  quantity: number
  unit_price: number
  created_at: string
}

export interface StoreCartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url: string
  variant_label?: string
}

export interface StoreCheckoutFormData {
  customer_name: string
  email: string
  phone: string
  shipping_address: string
  payment_method: 'cod' | 'gcash' | 'maya'
}

// ============================================================
// FORM TYPES
// ============================================================
export interface ProductFormData {
  name: string;
  brand_id: string;
  category_id: string;
  type: ProductType;
  sku: string;
  description: string;
  base_price: number;
  cost_price: number;
  low_stock_alert: number;
  image_url: string;
  variants: VariantFormData[];
}

export interface VariantFormData {
  id?: string;
  flavor_id: string;
  nicotine_strength: string;
  size_ml: number | null;
  puff_count: number | null;
  device_compat: string;
  sku_variant: string;
  price_override: number | null;
  stock: number;
}

export interface CheckoutFormData {
  payment_type: PaymentType;
  cash_tendered: number | null;
  gcash_amount: number | null;
  notes: string;
}
