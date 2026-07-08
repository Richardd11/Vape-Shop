'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { StoreCartItem } from '@/lib/types'

const CART_KEY = 'vapeshop-store-cart'

interface CartContextValue {
  items: StoreCartItem[]
  count: number
  total: number
  formattedTotal: string
  addItem: (item: StoreCartItem) => void
  removeItem: (productId: string, variantLabel?: string) => void
  updateQty: (productId: string, quantity: number, variantLabel?: string) => void
  clearCart: () => void
  open: boolean
  setOpen: (v: boolean) => void
  toggleCart: () => void
  hydrated: boolean
}

function loadCart(): StoreCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within StoreCartProvider')
  return ctx
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoreCartItem[]>([])
  const [open, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((item: StoreCartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === item.product_id && i.variant_label === item.variant_label
      )
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id && i.variant_label === item.variant_label
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((productId: string, variantLabel?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === productId && i.variant_label === variantLabel))
    )
  }, [])

  const updateQty = useCallback((productId: string, quantity: number, variantLabel?: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId && i.variant_label === variantLabel
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const toggleCart = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        formattedTotal: formatCurrency(total),
        addItem,
        removeItem,
        updateQty,
        clearCart,
        open,
        setOpen,
        toggleCart,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
