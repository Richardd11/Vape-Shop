'use client'

import { X, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCart } from './StoreCartProvider'
import QuantityStepper from './QuantityStepper'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

export default function CartDrawer() {
  const { items, formattedTotal, open, setOpen, removeItem, updateQty } = useCart()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-400 ease-out ${
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E7] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">Cart ({items.length})</h2>
          <button onClick={() => setOpen(false)} className="store-pill" aria-label="Close cart">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F7]">
                <ShoppingBag className="h-7 w-7 text-[#D2D2D7]" />
              </div>
              <p className="text-sm text-[#86868B]">Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, i) => (
                <li key={`${item.product_id}-${item.variant_label}-${i}`} className="flex gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F7]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full rounded-lg object-contain p-2" />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-[#D2D2D7]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1D1D1F] truncate">{item.name}</h3>
                    {item.variant_label && (
                      <p className="text-xs text-[#86868B] truncate">{item.variant_label}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(qty) => updateQty(item.product_id, qty, item.variant_label)}
                      />
                      <span className="text-sm font-medium text-[#1D1D1F]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_label)}
                      className="mt-1 flex items-center gap-1 text-xs text-[#86868B] hover:text-[#991B1B] transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
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
              <span className="text-lg font-semibold text-[#1D1D1F]">{formattedTotal}</span>
            </div>
            <Link
              href="/store/checkout"
              onClick={() => setOpen(false)}
              className="store-btn-primary w-full"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
