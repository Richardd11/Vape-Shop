'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import { getCart, removeFromCart, updateCartQuantity } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import QuantityStepper from './QuantityStepper'
import type { StoreCartItem } from '@/lib/types'

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<StoreCartItem[]>([])

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
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E7] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Cart</h2>
          <button onClick={() => setOpen(false)} className="store-pill">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-sm text-[#86868B]">Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, i) => (
                <li key={`${item.product_id}-${item.variant_label}-${i}`} className="flex gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F7]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full rounded-xl object-contain p-2" />
                    ) : (
                      <span className="text-2xl text-[#D2D2D7]">📦</span>
                    )}
                  </div>
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
