import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookSignature, parseWebhookEvent } from '@/lib/paymongo'
import type { SupabaseClient } from '@supabase/supabase-js'

async function handlePaymentPaid(
  supabase: SupabaseClient,
  checkoutSessionId: string,
  paymentIntentId: string | null,
  paymentId: string | null,
  externalRef: string | null
) {
  // Find the order by checkout session ID
  const { data: orders, error: findError } = await supabase
    .from('store_orders')
    .select('id, payment_status')
    .eq('paymongo_checkout_id', checkoutSessionId)

  if (findError) {
    console.error('Webhook: error finding order:', findError)
    return
  }

  if (!orders || orders.length === 0) {
    console.error('Webhook: no order found for checkout session:', checkoutSessionId)
    return
  }

  for (const order of orders) {
    // Prevent duplicate processing
    if (order.payment_status === 'paid') {
      console.log('Webhook: order already paid, skipping:', order.id)
      continue
    }

    // Update payment record
    const { data: payments } = await supabase
      .from('payments')
      .select('id, status')
      .eq('paymongo_checkout_id', checkoutSessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    const paymentRecord = payments?.[0]
    if (paymentRecord && paymentRecord.status === 'paid') {
      console.log('Webhook: payment already recorded as paid, skipping')
      continue
    }

    if (paymentRecord) {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          paymongo_payment_id: paymentId,
          paymongo_payment_intent_id: paymentIntentId,
          transaction_ref: externalRef,
          webhook_received_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.id)
    }

    // Update order payment status to paid
    await supabase.rpc('update_store_order_payment_status', {
      p_order_id: order.id,
      p_payment_status: 'paid',
      p_paymongo_payment_intent_id: paymentIntentId,
      p_paymongo_transaction_ref: externalRef,
    })

    // Deduct inventory (only on first payment confirmation)
    await supabase.rpc('deduct_store_order_inventory', {
      p_order_id: order.id,
    })

    console.log('Webhook: order paid successfully:', order.id)
  }
}

async function handlePaymentFailed(
  supabase: SupabaseClient,
  checkoutSessionId: string,
  paymentIntentId: string | null
) {
  const { data: orders } = await supabase
    .from('store_orders')
    .select('id, payment_status')
    .eq('paymongo_checkout_id', checkoutSessionId)

  if (!orders) return

  for (const order of orders) {
    if (order.payment_status === 'paid') continue

    await supabase.rpc('update_store_order_payment_status', {
      p_order_id: order.id,
      p_payment_status: 'failed',
    })

    // Update payment record
    const { data: payments } = await supabase
      .from('payments')
      .select('id')
      .eq('paymongo_checkout_id', checkoutSessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (payments?.[0]) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          paymongo_payment_intent_id: paymentIntentId,
          webhook_received_at: new Date().toISOString(),
        })
        .eq('id', payments[0].id)
    }
  }
}

async function handleCheckoutExpired(
  supabase: SupabaseClient,
  checkoutSessionId: string
) {
  const { data: orders } = await supabase
    .from('store_orders')
    .select('id, payment_status')
    .eq('paymongo_checkout_id', checkoutSessionId)

  if (!orders) return

  for (const order of orders) {
    if (order.payment_status === 'paid' || order.payment_status === 'failed') continue

    await supabase.rpc('update_store_order_payment_status', {
      p_order_id: order.id,
      p_payment_status: 'expired',
    })

    const { data: payments } = await supabase
      .from('payments')
      .select('id')
      .eq('paymongo_checkout_id', checkoutSessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (payments?.[0]) {
      await supabase
        .from('payments')
        .update({ status: 'expired', webhook_received_at: new Date().toISOString() })
        .eq('id', payments[0].id)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = Buffer.from(await request.arrayBuffer())
    const signature = request.headers.get('paymongo-signature') ?? ''

    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const event = parseWebhookEvent(payload)
    const supabase = createAdminClient()

    switch (event.eventType) {
      case 'checkout_session.payment.paid':
      case 'payment.paid':
        await handlePaymentPaid(
          supabase,
          event.checkoutSessionId,
          event.paymentIntentId,
          event.paymentId,
          event.externalRef
        )
        break

      case 'checkout_session.payment.failed':
      case 'payment.failed':
        await handlePaymentFailed(supabase, event.checkoutSessionId, event.paymentIntentId)
        break

      case 'checkout_session.expired':
        await handleCheckoutExpired(supabase, event.checkoutSessionId)
        break

      default:
        console.log('Webhook: unhandled event type:', event.eventType)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed'
    console.error('Webhook error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
