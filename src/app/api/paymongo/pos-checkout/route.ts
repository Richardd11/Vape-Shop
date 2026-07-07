import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, getCheckoutSession } from '@/lib/paymongo'

// POST — create a PayMongo Checkout Session for POS (Maya)
export async function POST(request: NextRequest) {
  try {
    const { amount, description } = await request.json()
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })

    if (!process.env.PAYMONGO_SECRET_KEY) {
      return NextResponse.json({ error: 'PayMongo not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 })

    const session = await createCheckoutSession({
      lineItems: [{ name: description || 'VapeShop Purchase', amount: Math.round(amount * 100), currency: 'PHP', quantity: 1 }],
      billing: { name: 'Customer', email: 'customer@vapeshop.ph' },
      successUrl: `${appUrl}/pos`,
      cancelUrl: `${appUrl}/pos`,
      paymentMethodTypes: ['maya'],
      metadata: { source: 'pos' },
      description: description || 'VapeShop Purchase',
    })

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.attributes.checkout_url,
      paymentIntentId: session.attributes.payment_intent?.id ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET — poll checkout session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const session = await getCheckoutSession(sessionId)

    const paymentIntent = session.attributes.payment_intent
    const payments = session.attributes.payments ?? []
    const paymentStatus = paymentIntent?.attributes?.status ?? 'unknown'
    const isPaid = paymentStatus === 'succeeded' || payments.some((p: any) => p.attributes?.status === 'paid')

    return NextResponse.json({
      status: session.attributes.status,
      paymentStatus,
      isPaid,
      paymentIntentId: paymentIntent?.id ?? null,
      payments,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
