'use client'

import Link from 'next/link'
import { ArrowLeft, RotateCcw, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { Payment, StoreOrder } from '@/lib/types'

interface PaymentWithOrder extends Payment {
  store_orders: StoreOrder
}

interface Props {
  payment: PaymentWithOrder
}

const statusStyles: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  refunded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partially_refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function PaymentDetails({ payment }: Props) {
  const order = payment.store_orders
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const items = [{ product_id: '', name: '', price: order.total_amount, quantity: 1, image_url: '' }]

      const res = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customer_name,
          email: order.email,
          phone: order.phone,
          items,
          totalAmount: order.total_amount,
          paymentMethod: order.payment_method,
        }),
      })

      const result = await res.json()
      if (res.ok && result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank')
      } else {
        alert(result.error || 'Failed to retry payment')
      }
    } catch {
      alert('Failed to retry payment')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div>
      <Link
        href="/payments"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payments
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Info */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Payment Details</h2>
          <div className="space-y-3">
            <Row label="Payment ID" value={payment.id.slice(0, 8).toUpperCase()} mono />
            <Row label="Status" value={payment.status} status />
            <Row label="Amount" value={formatCurrency(payment.amount)} />
            <Row label="Method" value={payment.payment_method || 'N/A'} />
            <Row label="Transaction Ref" value={payment.transaction_ref || '-'} mono />
            <Row label="Checkout Session ID" value={payment.paymongo_checkout_id?.slice(0, 12) || '-'} mono />
            <Row label="Payment Intent ID" value={payment.paymongo_payment_intent_id?.slice(0, 12) || '-'} mono />
            <Row label="Payment ID (PayMongo)" value={payment.paymongo_payment_id?.slice(0, 12) || '-'} mono />
            <Row label="Created" value={formatDateTime(payment.created_at)} />
            {payment.webhook_received_at && (
              <Row label="Webhook Received" value={formatDateTime(payment.webhook_received_at)} />
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Order Details</h2>
          <div className="space-y-3">
            <Row label="Order #" value={order.id.slice(0, 8).toUpperCase()} mono />
            <Row label="Customer" value={order.customer_name} />
            <Row label="Email" value={order.email} />
            <Row label="Phone" value={order.phone || 'N/A'} />
            <Row label="Total" value={formatCurrency(order.total_amount)} />
            <Row label="Payment Method" value={order.payment_method} />
            <Row label="Order Status" value={order.status} />
            <Row label="Payment Status" value={order.payment_status} status />
          </div>
        </div>
      </div>

      {/* Actions */}
      {(payment.status === 'failed' || payment.status === 'expired') && (
        <div className="mt-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Actions</h2>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Processing...' : 'Retry Payment'}
          </button>
        </div>
      )}

      {/* Refund section (structure only) */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Refund</h2>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Refund functionality is not yet implemented. This section is prepared for future use.
        </p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  status,
}: {
  label: string
  value: string
  mono?: boolean
  status?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      {status ? (
        <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[value] || statusStyles.pending}`}>
          {value}
        </span>
      ) : (
        <span className={`font-medium text-[var(--color-text-primary)] ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </span>
      )}
    </div>
  )
}
