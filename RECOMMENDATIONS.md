# VapeShop POS+IMS — Recommendations

> Generated from full system audit

---

## Current System Overview

**VapeShop POS+IMS** — a Next.js app on Vercel with Supabase backend. Covers POS transactions, inventory management, sales tracking, stock movements, and reference data (brands/categories/flavors).

### What's already working

- **POS** — product grid, category filtering, variant support (flavors/colors/sizes)
- **Inventory** — full CRUD, stock tracking, low-stock alerts
- **Sales History** — date filtering, individual receipt detail per sale
- **Stock Movements** — audit log of all stock changes
- **Reference Data** — manage brands (20), categories (6), flavors (~35)
- **Dashboard** — today's revenue, monthly stats, recent sales, low stock items, quick actions

---

## Critical Gaps (PH Market)

These are non-negotiable for a retail vape shop in the Philippines.

| # | Feature | Why It Matters |
|---|---------|----------------|
| 1 | **Payment methods** — GCash, Maya, card, online payments | Only CASH right now. Dealbreaker in PH. |
| 2 | **Customer management** — name, contact, purchase history, loyalty points | Drives repeat business. Every vape shop needs this. |
| 3 | **Thermal receipt printing** — ESC/POS support for Epson/Star printers | Physical receipts are expected. |
| 4 | **Cashier role + PIN** — basic permissions per role | Owner can't be the only one ringing up sales. |
| 5 | **Reports** — best-sellers, daily sales summary, profit margin, stock valuation | Currently just a sales list with date filter. |
| 6 | **Barcode/SKU scanning** — type or scan, item pops up | Speeds up POS checkout dramatically. |
| 7 | **Discount engine** — per-item %, per-transaction fixed, promos (B1G1, etc.) | Needed for regular promotions. |
| 8 | **Supplier + purchase orders** — track who you bought from, cost per batch, reorder triggers | Essential for inventory costing and reordering. |

---

## Nice-to-Haves

For polish and convenience once the critical gaps are filled.

- Dark mode toggle (already has a dark theme — lean into it)
- Receipt PDF download / email
- Low stock SMS/email alerts
- Export to CSV/Excel for all tables
- PWA offline caching so POS works during internet outages
- Multi-branch / store management if scaling to multiple locations
- Tax configuration (VAT, GST)

---

## Recommended Priority Order

```
Phase 1 — Core Retail Essentials
├── Payment methods (GCash, Maya, card)
├── Cashier role + PIN login
├── Basic discounts & promos
└── Barcode / SKU scanning

Phase 2 — Business Operations
├── Customer management + loyalty points
├── Thermal receipt printing (ESC/POS)
├── Supplier management + purchase orders
└── Basic reports (best-sellers, profit margin, stock valuation)

Phase 3 — Polish & Scale
├── Low stock notifications (email/SMS)
├── Receipt PDF export
├── CSV/Excel export
├── PWA offline mode
├── Multi-branch support
└── Tax configuration
```

---

## Database Considerations

New tables that will likely be needed:

- `payments` — payment_method (gcash, maya, card, cash), reference_no, amount
- `customers` — name, contact, loyalty_points, total_spent, created_at
- `loyalty_transactions` — points earned/redeemed per customer
- `discounts` — discount_type, value, valid_from, valid_to, applicable_products
- `suppliers` — name, contact, address
- `purchase_orders` — supplier_id, product_id, cost_price, quantity, received_at
- `user_roles` — role_name, permissions (JSON)
- `inventory_alerts` — threshold, notification_method, last_sent

Existing tables (`products`, `sales`, `sale_items`, `stock_movements`, `brands`, `categories`, `flavors`) are solid and just need extension.

---

## Foundation Assessment

The foundation is **solid** — clean UI, good navigation structure, Supabase backend scales fine. The gaps are purely feature completeness for an actual retail environment. No architectural rewrites needed — just incremental feature additions.
