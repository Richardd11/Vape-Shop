'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Smartphone, CreditCard, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCart, clearCart } from '@/lib/store'
import { formatCurrency, cn } from '@/lib/utils'
import type { StoreCheckoutFormData } from '@/lib/types'

const paymentMethods = [
  {
    id: 'gcash' as const,
    label: 'GCash',
    description: 'Pay via GCash app',
    icon: Smartphone,
    color: 'text-[#00A94D]',
    bgColor: 'bg-[#E8F8F0] border-[#00A94D]/20',
  },
  {
    id: 'maya' as const,
    label: 'Maya',
    description: 'Pay via Maya app',
    icon: Wallet,
    color: 'text-[#00B4D8]',
    bgColor: 'bg-[#E8F6FA] border-[#00B4D8]/20',
  },
  {
    id: 'cod' as const,
    label: 'Cash on Delivery',
    description: 'Pay when you receive',
    icon: CreditCard,
    color: 'text-[#6C6C70]',
    bgColor: 'bg-[#F5F5F7] border-[#E5E5E7]',
  },
]

export default function CheckoutForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<StoreCheckoutFormData>({
    customer_name: '',
    email: '',
    phone: '',
    shipping_address: '',
    payment_method: 'gcash',
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
      unit_price: item.price,
    }))

    try {
      if (form.payment_method === 'cod') {
        // COD flow: create order + deduct inventory immediately via existing RPC
        const { data, error: rpcError } = await supabase.rpc('process_store_order_v2', {
          p_customer_name: form.customer_name,
          p_email: form.email,
          p_phone: form.phone || null,
          p_shipping_address: form.shipping_address,
          p_payment_method: 'cod',
          p_items: JSON.stringify(items),
        })

        if (rpcError) {
          setError(rpcError.message)
          setSubmitting(false)
          return
        }

        clearCart()
        router.push(`/store/order-confirmation/${data.order_id}`)
      } else {
        // GCash / Maya flow: create order as pending, then create PayMongo Checkout Session
        const { data: orderData, error: orderError } = await supabase.rpc('create_store_order', {
          p_customer_name: form.customer_name,
          p_email: form.email,
          p_phone: form.phone || null,
          p_shipping_address: form.shipping_address,
          p_payment_method: form.payment_method,
          p_items: JSON.stringify(items),
          p_total_amount: total,
        })

        if (orderError) {
          setError(orderError.message)
          setSubmitting(false)
          return
        }

        const orderId = orderData.order_id

        const res = await fetch('/api/paymongo/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerName: form.customer_name,
            email: form.email,
            phone: form.phone || null,
            items: cart,
            totalAmount: total,
            paymentMethod: form.payment_method,
          }),
        })

        const result = await res.json()

        if (!res.ok) {
          setError(result.error || 'Failed to start payment')
          setSubmitting(false)
          return
        }

        // Clear cart and redirect to PayMongo hosted checkout
        clearCart()
        window.location.href = result.checkoutUrl
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setSubmitting(false)
    }
  }

  const update = (field: keyof StoreCheckoutFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            placeholder="Juan Dela Cruz"
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
            placeholder="juan@example.com"
          />
        </div>
        <div>
          <label className="store-label">Phone</label>
          <input
            type="tel"
            className="store-input"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            required
            placeholder="0917 123 4567"
          />
        </div>
        <div>
          <label className="store-label">Shipping Address</label>
          <textarea
            className="store-input min-h-[80px] resize-none"
            value={form.shipping_address}
            onChange={(e) => update('shipping_address', e.target.value)}
            required
            placeholder="123 Rizal St., Brgy. San Antonio, Makati City"
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="store-label mb-3">Payment Method</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const selected = form.payment_method === method.id
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => update('payment_method', method.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  selected
                    ? 'border-[#1D1D1F] bg-white shadow-sm'
                    : 'border-[#E5E5E7] bg-white/50 hover:border-[#C7C7C9]',
                )}
              >
                <Icon className={cn('h-6 w-6', method.color)} />
                <div>
                  <div className="text-sm font-semibold text-[#1D1D1F]">{method.label}</div>
                  <div className="mt-0.5 text-[11px] text-[#86868B]">{method.description}</div>
                </div>
                {selected && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1D1D1F]">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="store-btn-primary w-full gap-2"
      >
        {submitting ? (
          'Processing...'
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            {form.payment_method === 'cod' ? `Place Order — ${formatCurrency(total)}` : `Pay ${formatCurrency(total)}`}
          </>
        )}
      </button>
    </form>
  )
}
