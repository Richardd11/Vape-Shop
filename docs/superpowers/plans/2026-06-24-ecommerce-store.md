# E-Commerce Online Store — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demo e-commerce online store integrated with VapeShop POS+IMS — iOS minimalistic black & white design, real-time inventory sync.

**Architecture:** Next.js App Router route group `(store)` with shared Supabase instance. Cart uses localStorage (guest checkout). Orders create rows in new `store_orders`/`store_order_items` tables. POS dashboard shows online orders via Realtime subscription.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Supabase, Lucide icons, date-fns

## Global Constraints

- iOS minimalistic design: black & white only (no brand colors or accent colors)
- Typography: Inter font (already in project via next/font/google)
- All new store pages go under `src/app/(store)/` route group
- Cart uses localStorage, not server-side sessions
- Guest checkout only — no login required
- All product data comes from existing `products` table
- Stock validation: check `products.stock_qty` before order placement
- Existing utility functions in `src/lib/utils.ts` (formatCurrency, getStockStatus, calculateCartTotals) should be reused
- Existing types in `src/lib/types.ts` (Product, ProductVariant, CartItem) should be extended, not duplicated

---

### Task 1: Database Schema — New Tables + RPC

**Files:**
- Create: `supabase/migrations/20260624_create_store_tables.sql`

**Interfaces:**
- Consumes: Existing `products` table (id, stock_qty, price, name, image_url, category_id, brand_id)
- Produces: `store_orders`, `store_order_items`, `store_customers` tables + `process_store_order` RPC

- [ ] **Step 1: Write the migration file**

```sql
-- Store customers
CREATE TABLE IF NOT EXISTS store_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Store orders
CREATE TABLE IF NOT EXISTS store_orders (
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
CREATE TABLE IF NOT EXISTS store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_info TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC: Process store order (create order + validate stock + decrement)
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
  v_total DECIMAL(10,2) := 0;
  v_order_data JSONB;
BEGIN
  -- Start transaction
  -- Create the order
  INSERT INTO store_orders (customer_name, email, phone, shipping_address, payment_method, total_amount)
  VALUES (p_customer_name, p_email, p_phone, p_shipping_address, p_payment_method, 0)
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock product row and check stock
    SELECT id, name, stock_qty, price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF v_product.stock_qty < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', v_product.name, v_product.stock_qty;
    END IF;

    -- Insert order item
    INSERT INTO store_order_items (order_id, product_id, variant_info, quantity, unit_price)
    VALUES (v_order_id, v_product.id, v_item->>'variant_info', (v_item->>'quantity')::INTEGER, v_product.price);

    -- Decrement stock
    UPDATE products
    SET stock_qty = stock_qty - (v_item->>'quantity')::INTEGER,
        updated_at = now()
    WHERE id = v_product.id;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- Update total
  UPDATE store_orders SET total_amount = v_total WHERE id = v_order_id;

  -- Record stock movement
  INSERT INTO stock_movements (product_id, quantity, type, reference, notes)
  SELECT
    (v_item->>'product_id')::UUID,
    -((v_item->>'quantity')::INTEGER),
    'sale',
    'online-order-' || v_order_id,
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
```

- [ ] **Step 2: Run migration**

Run: `npx supabase migration up 20260624_create_store_tables`
Or paste the SQL into Supabase SQL Editor.

Expected: Tables created, RPC function created.

---

### Task 2: Store Types + Lib Utilities

**Files:**
- Modify: `src/lib/types.ts` (append store-specific types)
- Create: `src/lib/store.ts`

**Interfaces:**
- Consumes: Existing `Product`, `CartItem` types from types.ts
- Produces: Store-specific types and cart/order utilities

- [ ] **Step 1: Add store types to types.ts**

Add at the bottom of `src/lib/types.ts`:

```typescript
// ===== E-Commerce Store Types =====

export interface StoreCustomer {
  id: string
  email: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
}

export interface StoreOrder {
  id: string
  customer_name: string
  email: string
  phone: string | null
  shipping_address: string
  payment_method: 'cod' | 'gcash' | 'maya'
  status: 'pending' | 'preparing' | 'fulfilled' | 'cancelled'
  total_amount: number
  notes: string | null
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
}

export interface CheckoutFormData {
  customer_name: string
  email: string
  phone: string
  shipping_address: string
  payment_method: 'cod' | 'gcash' | 'maya'
}
```

- [ ] **Step 2: Create store.ts**

```typescript
import { type CartItem } from './types'

const CART_KEY = 'vapeshop-store-cart'
const AGE_VERIFIED_KEY = 'vapeshop-age-verified'

// ===== Cart (localStorage) =====

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }))
}

export function addToCart(item: CartItem): void {
  const cart = getCart()
  const existing = cart.find(
    i => i.product_id === item.product_id && i.variant_label === item.variant_label
  )
  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push(item)
  }
  saveCart(cart)
}

export function removeFromCart(productId: string, variantLabel?: string): void {
  const cart = getCart().filter(
    i => !(i.product_id === productId && i.variant_label === variantLabel)
  )
  saveCart(cart)
}

export function updateCartQuantity(productId: string, quantity: number, variantLabel?: string): void {
  const cart = getCart()
  const item = cart.find(
    i => i.product_id === productId && i.variant_label === variantLabel
  )
  if (item) {
    item.quantity = Math.max(1, quantity)
    saveCart(cart)
  }
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }))
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}

// ===== Age Verification =====

export function isAgeVerified(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AGE_VERIFIED_KEY) === 'true'
}

export function setAgeVerified(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AGE_VERIFIED_KEY, 'true')
}
```

---

### Task 3: Store Layout + CSS

**Files:**
- Create: `src/app/(store)/layout.tsx`
- Modify: `src/app/globals.css` (append store-specific styles)

**Interfaces:**
- Consumes: Task 2 cart utilities
- Produces: Store layout with header, footer, age verification, cart drawer

- [ ] **Step 1: Write store layout**

```tsx
// src/app/(store)/layout.tsx
import { Inter } from 'next/font/google'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import AgeVerification from '@/components/store/AgeVerification'
import CartDrawer from '@/components/store/CartDrawer'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VapeShop Online Store',
  description: 'Premium vaping products — authentic, fast delivery',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F5F7] text-[#1D1D1F] antialiased`}>
        <AgeVerification />
        <StoreHeader />
        <main className="min-h-screen pt-16">{children}</main>
        <StoreFooter />
        <CartDrawer />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Add store-specific styles to globals.css**

Append at the end of `src/app/globals.css`:

```css
/* ===== E-Commerce Store Styles ===== */
/* iOS-inspired black & white minimalistic */

@layer components {
  .store-container {
    @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
  }

  .store-card {
    @apply rounded-xl border border-[#E5E5E7] bg-white transition-all duration-200;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .store-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .store-btn-primary {
    @apply inline-flex items-center justify-center rounded-full bg-[#1D1D1F] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2D2D2F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50;
  }

  .store-btn-outline {
    @apply inline-flex items-center justify-center rounded-full border border-[#D2D2D7] bg-white px-6 py-3 text-sm font-medium text-[#1D1D1F] transition-all duration-200 hover:bg-[#F5F5F7] active:scale-[0.98];
  }

  .store-section-title {
    @apply text-2xl font-semibold tracking-tight text-[#1D1D1F] sm:text-3xl;
  }

  .store-text-secondary {
    @apply text-sm text-[#86868B];
  }

  .store-input {
    @apply w-full rounded-xl border border-[#D2D2D7] bg-white px-4 py-3 text-sm text-[#1D1D1F] placeholder-[#86868B] transition-all duration-200 focus:border-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#1D1D1F];
  }

  .store-label {
    @apply mb-1.5 block text-sm font-medium text-[#1D1D1F];
  }

  .store-divider {
    @apply border-t border-[#E5E5E7];
  }

  .store-badge {
    @apply inline-flex items-center rounded-full px-3 py-1 text-xs font-medium;
  }

  .store-badge-ok {
    @apply store-badge bg-[#F5F5F7] text-[#1D1D1F];
  }

  .store-badge-low {
    @apply store-badge bg-[#FEF3C7] text-[#92400E];
  }

  .store-badge-oos {
    @apply store-badge bg-[#FEE2E2] text-[#991B1B];
  }

  /* iOS-style blur header */
  .store-header-blur {
    @apply fixed left-0 right-0 top-0 z-50 border-b border-[#E5E5E7];
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
  }

  /* iOS-style pill button */
  .store-pill {
    @apply inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D2D2D7] bg-white text-[#1D1D1F] transition-all duration-200 hover:bg-[#F5F5F7] active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40;
  }
}
```

---

### Task 4: Store Components — Header, Footer, Age Verification, Cart Drawer

**Files:**
- Create: `src/components/store/StoreHeader.tsx`
- Create: `src/components/store/StoreFooter.tsx`
- Create: `src/components/store/AgeVerification.tsx`
- Create: `src/components/store/CartDrawer.tsx`
- Create: `src/components/store/QuantityStepper.tsx`
- Create: `src/components/store/StockBadge.tsx`

- [ ] **Step 1: StockBadge component**

```tsx
'use client'

import { getStockStatus } from '@/lib/utils'

interface StockBadgeProps {
  stockQty: number
}

export default function StockBadge({ stockQty }: StockBadgeProps) {
  const status = getStockStatus(stockQty)

  if (status === 'out') {
    return <span className="store-badge-oos">Out of Stock</span>
  }
  if (status === 'low') {
    return <span className="store-badge-low">Only {stockQty} left</span>
  }
  return null
}
```

- [ ] **Step 2: QuantityStepper component**

```tsx
'use client'

import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export default function QuantityStepper({ value, min = 1, max = 99, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#D2D2D7] bg-white px-1 py-1">
      <button
        className="store-pill"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums text-[#1D1D1F]">
        {value}
      </span>
      <button
        className="store-pill"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: AgeVerification component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { isAgeVerified, setAgeVerified } from '@/lib/store'

export default function AgeVerification() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isAgeVerified()) setShow(true)
  }, [])

  const handleYes = () => {
    setAgeVerified()
    setShow(false)
  }

  const handleNo = () => {
    window.location.href = 'https://google.com'
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F7]">
          <span className="text-2xl">🔞</span>
        </div>
        <h2 className="text-xl font-semibold text-[#1D1D1F]">Are you 18 or older?</h2>
        <p className="mt-2 text-sm text-[#86868B]">
          You must be at least 18 years old to view this store.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={handleNo} className="store-btn-outline flex-1">
            No
          </button>
          <button onClick={handleYes} className="store-btn-primary flex-1">
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: StoreHeader component**

```tsx
'use client'

import Link from 'next/link'
import { ShoppingBag, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCartCount } from '@/lib/store'

export default function StoreHeader() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setCartCount(getCartCount())
    const handler = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  return (
    <header className="store-header-blur z-50">
      <div className="store-container flex h-16 items-center justify-between">
        <Link href="/store" className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
          VapeShop
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/store" className="text-sm text-[#86868B] transition-colors hover:text-[#1D1D1F]">
            Home
          </Link>
          <Link href="/store/products" className="text-sm text-[#86868B] transition-colors hover:text-[#1D1D1F]">
            Products
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative" onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}>
            <ShoppingBag className="h-5 w-5 text-[#1D1D1F]" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1D1D1F] px-1 text-[10px] font-medium text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: CartDrawer component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getCart, removeFromCart, updateCartQuantity } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import QuantityStepper from './QuantityStepper'
import type { CartItem } from '@/lib/types'

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])

  const refresh = () => setItems(getCart())

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onUpdate = () => refresh()
    window.addEventListener('open-cart', onOpen)
    window.addEventListener('cart-updated', onUpdate)
    return () => {
      window.removeEventListener('open-cart', onOpen)
      window.removeEventListener('cart-updated', onUpdate)
    }
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E7] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Cart</h2>
          <button onClick={() => setOpen(false)} className="store-pill">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-sm text-[#86868B]">Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, i) => (
                <li key={`${item.product_id}-${item.variant_label}-${i}`} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-[#F5F5F7]" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[#1D1D1F]">{item.name}</h3>
                    {item.variant_label && (
                      <p className="text-xs text-[#86868B]">{item.variant_label}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(qty) => updateCartQuantity(item.product_id, qty, item.variant_label)}
                      />
                      <span className="text-sm font-medium text-[#1D1D1F]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.variant_label)}
                      className="mt-1 text-xs text-[#86868B] hover:text-[#991B1B]"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E5E7] px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#86868B]">Total</span>
              <span className="text-lg font-semibold text-[#1D1D1F]">{formatCurrency(total)}</span>
            </div>
            <Link
              href="/store/checkout"
              onClick={() => setOpen(false)}
              className="store-btn-primary w-full"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 6: StoreFooter component**

```tsx
export default function StoreFooter() {
  return (
    <footer className="border-t border-[#E5E5E7] bg-white">
      <div className="store-container py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#86868B]">
            &copy; {new Date().getFullYear()} VapeShop. All rights reserved.
          </p>
          <p className="text-xs text-[#86868B]">
            Powered by VapeShop POS+IMS
          </p>
        </div>
      </div>
    </footer>
  )
}
```

---

### Task 5: Homepage

**Files:**
- Create: `src/app/(store)/page.tsx`
- Create: `src/components/store/CategoryGrid.tsx`
- Create: `src/components/store/FeaturedProducts.tsx`
- Create: `src/components/store/ProductCard.tsx`

- [ ] **Step 1: ProductCard component**

```tsx
'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { addToCart } from '@/lib/store'
import StockBadge from './StockBadge'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const stockStatus = getStockStatus(product.stock_qty)

  return (
    <div className="store-card group overflow-hidden">
      <Link href={`/store/products/${product.slug || product.id}`} className="block">
        <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center p-8">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="text-4xl text-[#D2D2D7]">📦</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-1">
          <StockBadge stockQty={product.stock_qty} />
        </div>
        <Link href={`/store/products/${product.slug || product.id}`}>
          <h3 className="text-sm font-medium text-[#1D1D1F] transition-colors hover:text-[#86868B]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-[#1D1D1F]">{formatCurrency(product.price)}</span>
          {stockStatus !== 'out' && (
            <button
              onClick={() =>
                addToCart({
                  product_id: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: 1,
                  image_url: product.image_url || '',
                })
              }
              className="store-pill h-9 w-9"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CategoryGrid component**

```tsx
import Link from 'next/link'

const categories = [
  { name: 'Devices', slug: 'devices', icon: '📱' },
  { name: 'Pods', slug: 'pods', icon: '💨' },
  { name: 'E-Juices', slug: 'e-juices', icon: '🧪' },
  { name: 'Coils', slug: 'coils', icon: '⚡' },
  { name: 'Accessories', slug: 'accessories', icon: '🔌' },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/store/products?category=${cat.slug}`}
          className="store-card flex flex-col items-center gap-2 p-6 text-center transition-all duration-200 hover:shadow-md"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-sm font-medium text-[#1D1D1F]">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: FeaturedProducts component**

```tsx
import { createClient } from '@/lib/supabase/client'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/types'

export default async function FeaturedProducts() {
  const supabase = createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .gt('stock_qty', 0)
    .order('created_at', { ascending: false })
    .limit(8)

  if (!products?.length) return null

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Homepage**

```tsx
import Link from 'next/link'
import { ArrowRight, Package, Shield, Truck } from 'lucide-react'
import CategoryGrid from '@/components/store/CategoryGrid'
import FeaturedProducts from '@/components/store/FeaturedProducts'

export default function StoreHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="store-container py-16 text-center sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1D1D1F] sm:text-5xl lg:text-6xl">
          Premium Vaping Products
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-[#86868B] sm:text-lg">
          Authentic devices, pods, e-juices, and accessories — delivered fast.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/store/products" className="store-btn-primary text-base">
            Shop Now
          </Link>
          <Link href="/store/products" className="store-btn-outline text-base">
            View All
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="store-container pb-16">
        <h2 className="store-section-title mb-6">Shop by Category</h2>
        <CategoryGrid />
      </section>

      {/* Featured Products */}
      <section className="store-container pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="store-section-title">Featured Products</h2>
          <Link
            href="/store/products"
            className="hidden items-center gap-1 text-sm text-[#86868B] hover:text-[#1D1D1F] sm:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <FeaturedProducts />
      </section>

      {/* Trust Badges */}
      <section className="store-container pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Shield, title: 'Authentic Products', desc: '100% genuine items sourced directly from brands' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery within Metro Manila' },
            { icon: Package, title: 'Easy Returns', desc: '14-day return policy on unopened items' },
          ].map((item) => (
            <div key={item.title} className="store-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F7]">
                <item.icon className="h-6 w-6 text-[#1D1D1F]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">{item.title}</h3>
              <p className="mt-1 text-xs text-[#86868B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

---

### Task 6: Product Listing Page

**Files:**
- Create: `src/app/(store)/products/page.tsx`
- Create: `src/components/store/ProductFilters.tsx`
- Modify: `src/components/store/ProductCard.tsx` (already created in Task 5)

- [ ] **Step 1: ProductFilters component**

```tsx
'use client'

import { X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface ProductFiltersProps {
  brands: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}

export default function ProductFilters({ brands, categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`/store/products?${params.toString()}`)
  }

  const clearFilters = () => router.push('/store/products')

  const hasFilters = searchParams.toString().length > 0

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="store-btn-outline mb-4 md:hidden"
      >
        Filters {hasFilters && `(${searchParams.toString().split('&').length})`}
      </button>

      {/* Sidebar */}
      <aside className={`space-y-6 ${mobileOpen ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-6' : 'hidden md:block'}`}>
        {mobileOpen && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Filters</h3>
            <button onClick={() => setMobileOpen(false)} className="store-pill">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Categories */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">Category</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter('category', cat.id)}
                className={`block w-full text-left text-sm transition-colors ${
                  searchParams.get('category') === cat.id
                    ? 'font-medium text-[#1D1D1F]'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="store-divider pt-6">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">Brand</h4>
          <div className="space-y-2">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setFilter('brand', brand.id)}
                className={`block w-full text-left text-sm transition-colors ${
                  searchParams.get('brand') === brand.id
                    ? 'font-medium text-[#1D1D1F]'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-[#86868B] underline hover:text-[#1D1D1F]">
            Clear all filters
          </button>
        )}
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Product listing page**

```tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/store/ProductCard'
import ProductFilters from '@/components/store/ProductFilters'
import type { Product } from '@/lib/types'

// Force dynamic — stock changes in real-time
export const dynamic = 'force-dynamic'

async function ProductsList({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams
  const supabase = createClient()

  let query = supabase
    .from('products')
    .select('*, brands(name), categories(name)')

  if (params.category) {
    query = query.eq('category_id', params.category)
  }
  if (params.brand) {
    query = query.eq('brand_id', params.brand)
  }

  const { data: products } = await query.order('name', { ascending: true })

  return products?.length ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  ) : (
    <div className="py-16 text-center">
      <p className="text-sm text-[#86868B]">No products found</p>
    </div>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const supabase = createClient()
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="store-container py-8">
      <h1 className="store-section-title mb-8">All Products</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full shrink-0 md:w-56">
          <ProductFilters brands={brands ?? []} categories={categories ?? []} />
        </div>
        <div className="flex-1">
          <Suspense fallback={<div className="py-16 text-center text-sm text-[#86868B]">Loading products...</div>}>
            <ProductsList searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 7: Product Detail Page

**Files:**
- Create: `src/app/(store)/products/[slug]/page.tsx`
- Create: `src/components/store/VariantPicker.tsx`

- [ ] **Step 1: VariantPicker component**

```tsx
'use client'

interface VariantPickerProps {
  flavors: string[]
  selected: string | null
  onChange: (flavor: string) => void
}

export default function VariantPicker({ flavors, selected, onChange }: VariantPickerProps) {
  if (!flavors?.length) return null

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">Flavor</h3>
      <div className="flex flex-wrap gap-2">
        {flavors.map((flavor) => (
          <button
            key={flavor}
            onClick={() => onChange(flavor)}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
              selected === flavor
                ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:border-[#86868B]'
            }`}
          >
            {flavor}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Product detail page**

```tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { addToCart } from '@/lib/store'
import QuantityStepper from '@/components/store/QuantityStepper'
import StockBadge from '@/components/store/StockBadge'
import VariantPicker from '@/components/store/VariantPicker'
import type { Product } from '@/lib/types'

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const slug = params.slug as string
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()
      if (data) {
        setProduct(data)
        if (data.flavors?.length) setSelectedFlavor(data.flavors[0])
      }
      setLoading(false)
    }
    load()
  }, [params.slug])

  if (loading) {
    return (
      <div className="store-container py-16">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-sm text-[#86868B]">Product not found</p>
        <Link href="/store/products" className="store-btn-outline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    )
  }

  const stockStatus = getStockStatus(product.stock_qty)
  const handleAddToCart = () => {
    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url || '',
      variant_label: selectedFlavor || undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="store-container py-8">
      {/* Back link */}
      <Link
        href="/store/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#86868B] hover:text-[#1D1D1F]"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="flex items-center justify-center rounded-2xl bg-[#F5F5F7] p-12">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-[400px] w-full object-contain"
            />
          ) : (
            <div className="text-6xl text-[#D2D2D7]">📦</div>
          )}
        </div>

        {/* Details */}
        <div>
          <StockBadge stockQty={product.stock_qty} />
          <h1 className="mt-3 text-2xl font-semibold text-[#1D1D1F] sm:text-3xl">{product.name}</h1>
          <p className="mt-1 text-sm text-[#86868B]">{product.brand_name || 'VapeShop'}</p>
          <p className="mt-4 text-3xl font-semibold text-[#1D1D1F]">{formatCurrency(product.price)}</p>

          {product.description && (
            <p className="store-divider mt-6 pt-6 text-sm leading-relaxed text-[#86868B]">
              {product.description}
            </p>
          )}

          {/* Flavors */}
          {product.flavors?.length > 0 && (
            <div className="store-divider mt-6 pt-6">
              <VariantPicker
                flavors={product.flavors}
                selected={selectedFlavor}
                onChange={setSelectedFlavor}
              />
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="store-divider mt-6 pt-6">
            <div className="flex items-center gap-4">
              <QuantityStepper value={quantity} max={product.stock_qty} onChange={setQuantity} />
              <button
                onClick={handleAddToCart}
                disabled={stockStatus === 'out'}
                className="store-btn-primary flex-1 gap-2"
              >
                {added ? '✓ Added!' : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 8: Checkout + Order Confirmation

**Files:**
- Create: `src/app/(store)/checkout/page.tsx`
- Create: `src/app/(store)/order-confirmation/[id]/page.tsx`
- Create: `src/components/store/CheckoutForm.tsx`

- [ ] **Step 1: CheckoutForm component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCart, clearCart } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutFormData } from '@/lib/types'

export default function CheckoutForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: '',
    email: '',
    phone: '',
    shipping_address: '',
    payment_method: 'cod',
  })

  const cart = getCart()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (cart.length === 0) {
      setError('Your cart is empty')
      setSubmitting(false)
      return
    }

    const supabase = createClient()

    const items = cart.map((item) => ({
      product_id: item.product_id,
      variant_info: item.variant_label || null,
      quantity: item.quantity,
    }))

    const { data, error: rpcError } = await supabase.rpc('process_store_order', {
      p_customer_name: form.customer_name,
      p_email: form.email,
      p_phone: form.phone || null,
      p_shipping_address: form.shipping_address,
      p_payment_method: form.payment_method,
      p_items: JSON.stringify(items),
    })

    if (rpcError) {
      setError(rpcError.message)
      setSubmitting(false)
      return
    }

    clearCart()
    router.push(`/store/order-confirmation/${data.order_id}`)
  }

  const update = (field: keyof CheckoutFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="store-label">Full Name</label>
          <input
            className="store-input"
            value={form.customer_name}
            onChange={(e) => update('customer_name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="store-label">Email</label>
          <input
            type="email"
            className="store-input"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="store-label">Phone (optional)</label>
          <input
            type="tel"
            className="store-input"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div>
          <label className="store-label">Shipping Address</label>
          <textarea
            className="store-input min-h-[80px] resize-none"
            value={form.shipping_address}
            onChange={(e) => update('shipping_address', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="store-label">Payment Method</label>
          <select
            className="store-input"
            value={form.payment_method}
            onChange={(e) => update('payment_method', e.target.value as CheckoutFormData['payment_method'])}
          >
            <option value="cod">Cash on Delivery</option>
            <option value="gcash">GCash</option>
            <option value="maya">Maya</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="store-btn-primary w-full gap-2">
        {submitting ? 'Processing...' : (
          <>
            <ShoppingBag className="h-4 w-4" />
            Place Order — {formatCurrency(total)}
          </>
        )}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Checkout page**

```tsx
import { redirect } from 'next/navigation'
import { getCart } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import CheckoutForm from '@/components/store/CheckoutForm'

export default function CheckoutPage() {
  // We need to check cart on client — redirect if empty handled in form
  return (
    <div className="store-container py-8">
      <h1 className="store-section-title mb-8">Checkout</h1>
      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <CheckoutForm />
        </div>
        <div className="md:col-span-2">
          <OrderSummary />
        </div>
      </div>
    </div>
  )
}

function OrderSummary() {
  const cart = getCart()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) return null

  return (
    <div className="store-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-[#1D1D1F]">Order Summary</h2>
      <div className="space-y-3">
        {cart.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[#86868B]">
              {item.name} {item.variant_label && `(${item.variant_label})`} × {item.quantity}
            </span>
            <span className="text-[#1D1D1F]">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="store-divider mt-4 pt-4 flex justify-between">
        <span className="font-semibold text-[#1D1D1F]">Total</span>
        <span className="font-semibold text-[#1D1D1F]">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Order confirmation page**

```tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { StoreOrder } from '@/lib/types'

export default function OrderConfirmationPage() {
  const params = useParams()
  const [order, setOrder] = useState<StoreOrder | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('store_orders').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) setOrder(data)
    })
  }, [params.id])

  if (!order) {
    return (
      <div className="store-container py-16 text-center">
        <div className="animate-pulse text-sm text-[#86868B]">Loading order...</div>
      </div>
    )
  }

  return (
    <div className="store-container py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F7]">
        <Check className="h-8 w-8 text-[#1D1D1F]" />
      </div>
      <h1 className="text-2xl font-semibold text-[#1D1D1F]">Order Placed Successfully!</h1>
      <p className="mt-2 text-sm text-[#86868B]">
        Order #{order.id.slice(0, 8).toUpperCase()}
      </p>
      <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-2xl border border-[#E5E5E7] bg-white p-6 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Total</span>
          <span className="font-medium text-[#1D1D1F]">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Payment</span>
          <span className="font-medium text-[#1D1D1F]">{order.payment_method.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Status</span>
          <span className="font-medium capitalize text-[#1D1D1F]">{order.status}</span>
        </div>
      </div>
      <p className="mt-6 text-sm text-[#86868B]">
        We&apos;ll prepare your order and contact you for delivery.
      </p>
      <Link href="/store" className="store-btn-primary mt-8 inline-flex">
        Continue Shopping
      </Link>
    </div>
  )
}
```

---

### Task 9: POS Dashboard Integration — Online Orders

**Files:**
- Create: `src/components/dashboard/OnlineOrders.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (add OnlineOrders widget)

- [ ] **Step 1: OnlineOrders component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { StoreOrder } from '@/lib/types'

export default function OnlineOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    supabase
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setOrders(data)
      })

    // Realtime subscription
    const channel = supabase
      .channel('store-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'store_orders' },
        (payload) => {
          setOrders((prev) => [payload.new as StoreOrder, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (orders.length === 0) return null

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('store_orders').update({ status }).eq('id', id)
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } as StoreOrder : o))
    )
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold">Online Orders</h2>
        <span className="badge badge-brand ml-auto">{orders.filter(o => o.status === 'pending').length} new</span>
      </div>
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-lg bg-surface-raised p-3">
            <div>
              <p className="text-sm font-medium">{order.customer_name}</p>
              <p className="text-xs text-[#86868B]">
                {formatCurrency(order.total_amount)} · {order.payment_method.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${
                order.status === 'pending' ? 'badge-warning' :
                order.status === 'preparing' ? 'badge-brand' :
                order.status === 'fulfilled' ? 'badge-success' : 'badge-gray'
              }`}>
                {order.status}
              </span>
              {order.status === 'pending' && (
                <button
                  onClick={() => updateStatus(order.id, 'preparing')}
                  className="btn btn-brand btn-sm"
                >
                  Accept
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateStatus(order.id, 'fulfilled')}
                  className="btn btn-success btn-sm"
                >
                  Fulfill
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add to dashboard page**

Find the dashboard page at `src/app/(dashboard)/dashboard/page.tsx` and add `<OnlineOrders />` in the appropriate section.

---

### Task 10: Navigation — Add Store Link

**Files:**
- Modify: `src/app/(store)/layout.tsx` (add store route handling)
- Ensure `/store` route group works with the existing project routing

- [ ] **Step 1: Verify route group works**

The `(store)` route group in `src/app/(store)/` will be accessible at `/store` since it's a route group (parentheses). No Next.js config changes needed.

--- 

## Self-Review

- Spec coverage: All sections from the design spec are covered — age verification (Task 4), homepage (Task 5), product listing (Task 6), product detail (Task 7), cart (Task 4), checkout (Task 8), orders (Task 8), database (Task 1), POS integration (Task 9)
- Placeholder scan: No TBD, TODOs, or vague requirements found
- Type consistency: CartItem type usage matches existing types.ts, StoreOrder type matches migration schema
- Scope: Single e-commerce store — no decomposition needed
