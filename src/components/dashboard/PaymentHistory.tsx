'use client'

import Link from 'next/link'
import { formatDateTime, formatCurrency } from '@/lib/utils'

interface PaymentWithOrder {
  id: string
  order_id: string
  paymongo_checkout_id: string | null
  paymongo_payment_intent_id: string | null
  paymongo_payment_id: string | null
  transaction_ref: string | null
  payment_method: string | null
  amount: number
  status: string
  created_at: string
  store_orders: {
    customer_name: string
    email: string
    total_amount: number
    payment_method: string
    status: string
    payment_status: string
  }
}

interface Props {
  payments: PaymentWithOrder[]
}

const statusStyles: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  refunded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partially_refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function PaymentHistory({ payments }: Props) {
  if (!payments.length) {
    return (
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-12 text-center">
        <p className="text-sm text-[var(--color-text-tertiary)]">No payments yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Date</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Order</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Method</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)]">Ref</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface-root)]/50">
                <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                  {formatDateTime(payment.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--color-text-primary)]">{payment.store_orders.customer_name}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{payment.store_orders.email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
                  #{payment.order_id.slice(0, 8).toUpperCase()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 capitalize text-[var(--color-text-secondary)]">
                  {payment.payment_method || payment.store_orders.payment_method}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text-primary)]">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[payment.status] || statusStyles.pending}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {payment.transaction_ref || payment.paymongo_payment_intent_id?.slice(0, 12) || '-'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/payments/${payment.id}`}
                    className="text-xs font-medium text-brand-500 hover:text-brand-400"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
