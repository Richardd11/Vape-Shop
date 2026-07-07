import { type StoreCartItem } from './types'

const CART_KEY = 'vapeshop-store-cart'
const AGE_VERIFIED_KEY = 'vapeshop-age-verified'

// ===== Cart (localStorage) =====

export function getCart(): StoreCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items: StoreCartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: items }))
}

export function addToCart(item: StoreCartItem): void {
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
