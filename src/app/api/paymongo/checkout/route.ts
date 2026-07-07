import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/paymongo'
import type { StoreCartItem } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerName, email, phone, items, totalAmount, paymentMethod } = await request.json()

    if (!orderId || !customerName || !email || !items?.length || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.PAYMONGO_SECRET_KEY) {
      return NextResponse.json({ error: 'PayMongo not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 })
    }

    const paymentMethodTypes = paymentMethod === 'maya' ? ['paymaya'] : ['gcash', 'paymaya']

    const lineItems = items.map((item: StoreCartItem) => ({
      name: item.name + (item.variant_label ? ` (${item.variant_label})` : ''),
      amount: Math.round(item.price * 100),
      currency: 'PHP',
      quantity: item.quantity,
    }))

    const session = await createCheckoutSession({
      lineItems,
      billing: { name: customerName, email, phone },
      successUrl: `${appUrl}/store/order-confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/store/checkout?cancelled=true`,
      paymentMethodTypes,
      metadata: { order_id: orderId },
      description: `VapeShop Order #${orderId.slice(0, 8).toUpperCase()}`,
    })

    // Save checkout session info to order
    const supabase = await createClient()
    await supabase.rpc('update_store_order_payment_status', {
      p_order_id: orderId,
      p_payment_status: 'pending',
      p_paymongo_checkout_id: session.id,
      p_paymongo_payment_intent_id: session.attributes.payment_intent?.id ?? null,
    })

    // Insert payment record
    await supabase.from('payments').insert({
      order_id: orderId,
      paymongo_checkout_id: session.id,
      paymongo_payment_intent_id: session.attributes.payment_intent?.id ?? null,
      amount: totalAmount,
      status: 'pending',
    })

    return NextResponse.json({
      checkoutUrl: session.attributes.checkout_url,
      sessionId: session.id,
      paymentIntentId: session.attributes.payment_intent?.id ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('PayMongo checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
