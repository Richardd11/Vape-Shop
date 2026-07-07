import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { ProductVariant, ProductType, CartItem, Product } from './types';

// ============================================================
// STYLING HELPERS
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY FORMATTING (PHP)
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}K`;
  }
  return `₱${amount.toFixed(2)}`;
}

// ============================================================
// DATE FORMATTING
// ============================================================
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ============================================================
// SKU GENERATION
// ============================================================
export function generateSKU(
  brandName: string,
  categoryName: string,
  productName: string
): string {
  const brand = brandName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const cat = categoryName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const prod = productName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${brand}-${cat}-${prod}-${rand}`;
}

// ============================================================
// PRODUCT VARIANT HELPERS
// ============================================================
export function getVariantLabel(variant: ProductVariant & { flavors?: { name: string } | null }): string {
  const parts: string[] = [];
  if (variant.flavors?.name) parts.push(variant.flavors.name);
  if (variant.nicotine_strength) parts.push(variant.nicotine_strength);
  if (variant.size_ml) parts.push(`${variant.size_ml}ml`);
  if (variant.puff_count) parts.push(`${variant.puff_count} puffs`);
  if (variant.device_compat) parts.push(`(${variant.device_compat})`);
  return parts.length > 0 ? parts.join(' · ') : 'Default';
}

export function getEffectivePrice(product: Product, variant: ProductVariant | null): number {
  if (variant?.price_override != null) {
    return variant.price_override;
  }
  return product.base_price;
}

// ============================================================
// PRODUCT TYPE HELPERS
// ============================================================
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  device: 'Device',
  juice: 'E-Liquid',
  pod: 'Pod',
  disposable: 'Disposable',
};

export const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  device: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  juice: 'bg-green-500/20 text-green-400 border-green-500/30',
  pod: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  disposable: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const PRODUCT_TYPE_HAS_FLAVOR: Record<ProductType, boolean> = {
  device: false,
  juice: true,
  pod: true,
  disposable: true,
};

export const PRODUCT_TYPE_REQUIRES_FLAVOR: Record<ProductType, boolean> = {
  device: false,
  juice: true,
  pod: false,
  disposable: false,
};

export const PRODUCT_TYPE_HAS_NICOTINE: Record<ProductType, boolean> = {
  device: false,
  juice: true,
  pod: true,
  disposable: true,
};

export const PRODUCT_TYPE_HAS_SIZE: Record<ProductType, boolean> = {
  device: false,
  juice: true,
  pod: false,
  disposable: false,
};

// ============================================================
// CART HELPERS
// ============================================================
export function calculateCartTotals(items: CartItem[]): {
  subtotal: number;
  discount_amount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const discount_amount = items.reduce((sum, item) => sum + item.discount_amount, 0);
  const total = subtotal - discount_amount;
  return { subtotal, discount_amount, total };
}

export function generateCartItemId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================
// STOCK STATUS HELPERS
// ============================================================
export function getStockStatus(stock: number, lowStockAlert: number): 'out' | 'low' | 'ok' {
  if (stock <= 0) return 'out';
  if (stock <= lowStockAlert) return 'low';
  return 'ok';
}

export const STOCK_STATUS_COLORS = {
  out: 'text-red-400 bg-red-500/20 border-red-500/30',
  low: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  ok: 'text-green-400 bg-green-500/20 border-green-500/30',
};

export const STOCK_STATUS_LABELS = {
  out: 'Out of Stock',
  low: 'Low Stock',
  ok: 'In Stock',
};

// ============================================================
// NICOTINE STRENGTH OPTIONS
// ============================================================
export const NICOTINE_OPTIONS = [
  '3mg',
  '6mg',
  '12mg',
  '18mg',
  '25mg',
  '35mg',
  '50mg',
  'Freebase',
  'Salt Nic',
];

// ============================================================
// PAYMENT TYPE HELPERS
// ============================================================
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  mixed: 'Cash + GCash',
};

export const PAYMENT_TYPE_ICONS: Record<string, string> = {
  cash: '💵',
  gcash: '📱',
  maya: '💳',
  mixed: '💵📱',
};
