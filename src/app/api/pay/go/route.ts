import { NextRequest, NextResponse } from 'next/server'
import { getCheckoutSession } from '@/lib/paymongo'

// QR code points to this endpoint — short, clean URL
// Redirects to the actual PayMongo checkout page
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session parameter' }, { status: 400 })
  }

  try {
    const session = await getCheckoutSession(sessionId)
    const checkoutUrl = session.attributes.checkout_url

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Checkout URL not found' }, { status: 404 })
    }

    return NextResponse.redirect(checkoutUrl, 302)
  } catch {
    // Fallback: try constructing the URL directly
    const fallbackUrl = `https://checkout.paymongo.com/${sessionId}`
    return NextResponse.redirect(fallbackUrl, 302)
  }
}
