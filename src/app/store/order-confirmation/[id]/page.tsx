'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Check, Clock, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { StoreOrder, Payment } from '@/lib/types'

type PaymentState = 'loading' | 'paid' | 'pending' | 'failed' | 'expired'

export default function OrderConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentState, setPaymentState] = useState<PaymentState>('loading')
  const [pollAttempts, setPollAttempts] = useState(0)

  const checkPaymentStatus = useCallback(async (orderId: string) => {
    const supabase = createClient()

    const { data } = await supabase
      .from('store_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (data) {
      setOrder(data as StoreOrder)

      if (data.payment_status === 'paid') {
        setPaymentState('paid')
        return true
      }
      if (data.payment_status === 'failed') {
        setPaymentState('failed')
        return true
      }
      if (data.payment_status === 'expired') {
        setPaymentState('expired')
        return true
      }
    }

    // Also check payments table
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (payments?.[0]) {
      setPayment(payments[0] as Payment)
      const paymentStatus = payments[0].status
      if (paymentStatus === 'paid') {
        setPaymentState('paid')
        return true
      }
      if (paymentStatus === 'failed') {
        setPaymentState('failed')
        return true
      }
      if (paymentStatus === 'expired') {
        setPaymentState('expired')
        return true
      }
    }

    return false
  }, [])

  useEffect(() => {
    const orderId = params.id as string

    const poll = async () => {
      const done = await checkPaymentStatus(orderId)
      if (!done && pollAttempts < 30) {
        setPollAttempts((p) => p + 1)
        setTimeout(poll, 2000)
      } else if (!done) {
        setPaymentState('pending')
      }
    }

    poll()
  }, [params.id, checkPaymentStatus, pollAttempts])

  if (!order && paymentState === 'loading') {
    return (
      <div className="store-container py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#86868B]" />
        <p className="mt-4 text-sm text-[#86868B]">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="store-container py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-[#D2D2D7]" />
        <h1 className="mt-4 text-xl font-semibold text-[#1D1D1F]">Order not found</h1>
        <Link href="/store" className="store-btn-primary mt-6 inline-flex">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const isPayMongo = order.payment_method === 'gcash' || order.payment_method === 'maya'

  return (
    <div className="store-container py-16 text-center">
      {paymentState === 'paid' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Payment Successful!</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            Your order has been placed and paid.
          </p>
        </>
      )}

      {paymentState === 'pending' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Order Placed</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            We&apos;re waiting for payment confirmation. This may take a few moments.
          </p>
          {isPayMongo && (
            <p className="mt-1 text-xs text-[#86868B]">
              Please complete your payment via {order.payment_method === 'gcash' ? 'GCash' : 'Maya'} if you haven&apos;t already.
            </p>
          )}
        </>
      )}

      {paymentState === 'failed' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Payment Failed</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            Your payment could not be processed. Please try again.
          </p>
        </>
      )}

      {paymentState === 'expired' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Payment Expired</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            The payment session has expired. Please place a new order.
          </p>
        </>
      )}

      {paymentState === 'loading' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Confirming Payment...</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            Please wait while we confirm your payment.
          </p>
        </>
      )}

      <div className="mx-auto mt-8 max-w-sm space-y-3 rounded-2xl border border-[#E5E5E7] bg-white p-6 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Order #</span>
          <span className="font-medium text-[#1D1D1F]">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Total</span>
          <span className="font-medium text-[#1D1D1F]">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Payment</span>
          <span className="font-medium uppercase text-[#1D1D1F]">{order.payment_method}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Payment Status</span>
          <span className={cn(
            'font-medium capitalize',
            paymentState === 'paid' && 'text-green-600',
            paymentState === 'failed' && 'text-red-600',
            paymentState === 'expired' && 'text-gray-500',
            (paymentState === 'pending' || paymentState === 'loading') && 'text-yellow-600',
          )}>
            {order.payment_status}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#86868B]">Order Status</span>
          <span className="font-medium capitalize text-[#1D1D1F]">{order.status}</span>
        </div>
        {order.paymongo_transaction_ref && (
          <div className="flex justify-between text-sm">
            <span className="text-[#86868B]">Reference</span>
            <span className="font-medium font-mono text-[10px] text-[#1D1D1F]">{order.paymongo_transaction_ref}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {paymentState === 'failed' && isPayMongo && (
          <button
            onClick={async () => {
              const supabase = createClient()
              const { data: orderData } = await supabase
                .from('store_orders')
                .select('*')
                .eq('id', params.id as string)
                .single()

              if (!orderData) return

              const cart = [{
                product_id: '',
                name: '',
                price: orderData.total_amount,
                quantity: 1,
                image_url: '',
              }]

              const res = await fetch('/api/paymongo/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: params.id as string,
                  customerName: orderData.customer_name,
                  email: orderData.email,
                  phone: orderData.phone,
                  items: cart,
                  totalAmount: orderData.total_amount,
                  paymentMethod: orderData.payment_method,
                }),
              })

              const result = await res.json()
              if (res.ok && result.checkoutUrl) {
                window.location.href = result.checkoutUrl
              }
            }}
            className="store-btn-primary"
          >
            Retry Payment
          </button>
        )}
        <Link href="/store" className="store-btn-secondary">
          Continue Shopping
        </Link>
      </div>

      {paymentState === 'pending' && (
        <p className="mt-6 text-sm text-[#86868B]">
          {isPayMongo
            ? 'Your payment is being verified. The page will update automatically.'
            : 'We\'ll prepare your order and contact you for delivery.'}
        </p>
      )}
    </div>
  )
}

function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ')
}
