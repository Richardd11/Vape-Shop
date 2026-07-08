# E-Commerce Online Store — Design Spec

## Overview

A demo e-commerce online store integrated with the VapeShop POS+IMS system. Built to showcase to vape shop prospects what kind of online store their customers would use — fully synced with their POS inventory in real-time.

iOS-inspired minimalistic design: black & white color palette, clean typography, generous whitespace, Apple-level polish.

---

## Architecture

- **Framework:** Next.js (same codebase as POS+IMS, deployable as subdomain or `/store` route)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Same Supabase instance — shared products, categories, brands tables
- **Auth:** None required for browsing; checkout collects customer info

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#FFFFFF`, `#F5F5F7`, `#FAFAFA` |
| Primary text | `#1D1D1F` |
| Secondary text | `#86868B` |
| Border | `#E5E5E7` (1px) |
| Accent | Black / Dark Gray |
| Radius | 12px (cards), 16px (modals), 9999px (buttons) |
| Body font | Inter, 16px, line-height 1.5 |
| Heading font | Inter, 600 weight |
| Shadow | `0 2px 12px rgba(0,0,0,0.04)` (subtle) |
| Spacing | 8px base unit — gap-4/6/8/12/16 |

---

## Pages

### 1. Age Verification Modal
- Full-screen overlay on first visit
- "Are you 18 or older?" — Yes / No buttons (iOS Alert style)
- No = redirect to google.com

### 2. Homepage
- Fixed translucent nav bar (backdrop-blur)
- Hero: full-width featured product + tagline
- Category grid: 2x2 icon cards (Devices, Pods, E-Juices, Coils)
- Featured products row: horizontal scroll
- Trust badges: Fast Delivery, Authentic Products, Secure Checkout

### 3. Product Listing
- 2 col mobile / 3 col desktop grid
- Filter sidebar (desktop): by brand, category, nicotine strength
- Sort: Price (low-high), Name, Newest
- Each card: image, name, price, stock badge
- Stock badges: "In Stock" (none), "Low Stock" (amber), "Out of Stock" (red, dimmed)

### 4. Product Detail
- Large image left, details right (stack on mobile)
- Variant picker: nicotine levels (3/6/12mg) — iOS picker style
- Quantity stepper: - / + buttons
- Add to Cart pill button (black)
- Stock status badge

### 5. Shopping Cart
- Side drawer (desktop) / Full page (mobile)
- Line items: image, name, variant, qty stepper, price
- Swipe-to-delete (mobile gesture)
- Subtotal + Checkout CTA

### 6. Checkout
- Single column form: name, email, phone, address
- Payment method: Cash on Delivery, GCash, Maya
- Order summary sidebar (desktop)
- Place Order button
- Success page: order reference number, summary

### 7. Order Confirmation
- Large checkmark icon
- "Order #XXX placed successfully"
- Summary: items, total, delivery info
- CTA: Continue Shopping

---

## Database Schema Additions

```sql
-- Online store orders
CREATE TABLE store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL, -- cod, gcash, maya
  status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, fulfilled, cancelled
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Online store order items
CREATE TABLE store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_info TEXT, -- e.g. "Nicotine: 6mg"
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Online store customers
CREATE TABLE store_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Integration Points

| Flow | Mechanism |
|------|-----------|
| Product sync | Reads from existing `products` table — real-time |
| Stock check | `products.stock_qty` checked before order placement |
| Order creation | Insert into `store_orders` + `store_order_items` |
| POS notification | New orders appear in POS dashboard (Realtime subscription) |
| Inventory update | New RPC `process_store_order` decrements stock on fulfillment |
| Customer capture | Insert into `store_customers` on checkout |

---

## Non-Goals (Out of Scope)

- User accounts / login (simple checkout only)
- Payment gateway integration (payment recording only — no real GCash/Maya API)
  - Checkout captures selected method + reference number; shop owner confirms payment manually in POS
- Shipping tracking
- Reviews & ratings
- Multi-language
- SEO / blog / CMS

---

## Success Criteria

- Up and running demo store with real vape products from the existing database
- Add to cart → checkout → order appears in POS dashboard
- Stock levels reflect actual inventory in real-time
- iOS-clean design: black & white only, no color accents
