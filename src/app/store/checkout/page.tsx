'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShoppingBag, AlertCircle } from 'lucide-react'
import { getCart } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import CheckoutForm from '@/components/store/CheckoutForm'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === 'true'
  const cart = getCart()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="store-container py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-[#D2D2D7]" />
        <h1 className="mt-4 text-xl font-semibold text-[#1D1D1F]">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[#86868B]">Add some products before checking out.</p>
        <a href="/store/products" className="store-btn-primary mt-6 inline-flex">
          Browse Products
        </a>
      </div>
    )
  }

  return (
    <>
      {cancelled && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Payment cancelled</p>
            <p className="mt-0.5 text-yellow-700">You cancelled the payment. Your order was not charged. You can try again.</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <CheckoutForm />
        </div>
        <div className="md:col-span-2">
          <div className="store-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-[#1D1D1F]">Order Summary</h2>
            <div className="space-y-3">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#86868B]">
                    {item.name} {item.variant_label && `(${item.variant_label})`} &times; {item.quantity}
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
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <div className="store-container py-8">
      <h1 className="store-section-title mb-8">Checkout</h1>
      <Suspense fallback={<div className="text-center text-sm text-[#86868B]">Loading...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
