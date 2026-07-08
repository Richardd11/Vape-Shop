'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { StoreOrder } from '@/lib/types'

export default function OnlineOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setOrders(data as StoreOrder[])
      })

    const channel = supabase
      .channel('store-orders-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'store_orders' },
        (payload) => {
          setOrders((prev) => [payload.new as StoreOrder, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_orders' },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? payload.new as StoreOrder : o))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('store_orders').update({ status }).eq('id', id)
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (orders.length === 0) return null

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-brand-400" />
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Online Orders</h2>
        {pendingCount > 0 && (
          <span className="badge badge-warning ml-auto">{pendingCount} new</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg bg-[var(--color-surface-root)] p-3 border border-[var(--color-border-subtle)]"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {order.customer_name}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {formatCurrency(order.total_amount)} · {order.payment_method.toUpperCase()} · {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`badge ${
                order.status === 'pending' ? 'badge-warning' :
                order.status === 'preparing' ? 'badge-info' :
                order.status === 'fulfilled' ? 'badge-success' : 'badge-danger'
              }`}>
                {order.status}
              </span>
              {order.status === 'pending' && (
                <button
                  onClick={() => updateStatus(order.id, 'preparing')}
                  className="btn btn-brand btn-sm"
                >
                  Accept
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateStatus(order.id, 'fulfilled')}
                  className="btn btn-success btn-sm"
                >
                  Fulfill
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
