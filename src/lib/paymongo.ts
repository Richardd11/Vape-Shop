import crypto from 'crypto'

const PAYMONGO_BASE = 'https://api.paymongo.com/v1'

function auth(): string {
  return 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')
}

function getWebhookSecret(): string | null {
  return process.env.PAYMONGO_WEBHOOK_SECRET ?? null
}

interface PayMongoLineItem {
  name: string
  amount: number
  currency: string
  quantity: number
}

interface PayMongoBilling {
  name: string
  email: string
  phone?: string
}

interface CreateCheckoutSessionParams {
  lineItems: PayMongoLineItem[]
  billing: PayMongoBilling
  successUrl: string
  cancelUrl: string
  paymentMethodTypes: string[]
  metadata?: Record<string, string>
  description?: string
}

interface PayMongoCheckoutResponse {
  id: string
  type: string
  attributes: {
    billing: PayMongoBilling
    billing_address: Record<string, unknown>
    cancel_url: string
    checkout_url: string
    currency: string
    description: string | null
    line_items: {
      name: string
      amount: number
      currency: string
      quantity: number
    }[]
    metadata: Record<string, string>
    payment_intent: {
      id: string
      attributes: {
        amount: number
        currency: string
        status: string
        payment_method_options: Record<string, unknown>
        payments: { id: string; attributes: Record<string, unknown> }[]
        last_payment_error: unknown
        next_action: unknown
        statement_descriptor: string
        metadata: Record<string, string>
        setup_future_usage: unknown
        created_at: number
      }
    }
    payment_method_types: string[]
    payments: {
      id: string
      type: string
      attributes: {
        amount: number
        currency: string
        description: string
        status: string
        external_reference_number: string | null
        billing: Record<string, unknown>
        fee: number
        net_amount: number
        source: {
          id: string
          type: string
        }
        payout: unknown
        metadata: Record<string, string>
        payment_intent_id: string
        refunds: unknown[]
        available_at: number
        created_at: number
        paid_at: number | null
        updated_at: number
      }
    }[]
    reference_number: string
    status: string
    success_url: string
    created_at: number
  }
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<PayMongoCheckoutResponse> {
  const body = {
    data: {
      attributes: {
        billing: {
          name: params.billing.name,
          email: params.billing.email,
          phone: params.billing.phone,
        },
        line_items: params.lineItems.map((item) => ({
          name: item.name,
          amount: item.amount,
          currency: item.currency,
          quantity: item.quantity,
        })),
        payment_method_types: params.paymentMethodTypes,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata ?? {},
        description: params.description ?? 'VapeShop Purchase',
        send_email_receipt: true,
      },
    },
  }

  const res = await fetch(`${PAYMONGO_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: auth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    const detail = err?.errors?.[0]?.detail ?? err?.errors?.[0]?.message ?? 'PayMongo checkout session creation failed'
    throw new Error(detail)
  }

  const json = await res.json()
  return json.data as PayMongoCheckoutResponse
}

export async function getCheckoutSession(sessionId: string): Promise<PayMongoCheckoutResponse> {
  const res = await fetch(`${PAYMONGO_BASE}/checkout_sessions/${sessionId}`, {
    headers: { Authorization: auth() },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.errors?.[0]?.detail ?? 'Failed to retrieve checkout session')
  }

  const json = await res.json()
  return json.data as PayMongoCheckoutResponse
}

interface WebhookPayload {
  data: {
    id: string
    type: string
    attributes: {
      type: string
      data: {
        id: string
        type: string
        attributes: Record<string, unknown>
      }
      previous_data?: Record<string, unknown>
      created_at: number
    }
  }
}

export function verifyWebhookSignature(
  payload: Buffer,
  signatureHeader: string
): boolean {
  const webhookSecret = getWebhookSecret()
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PAYMONGO_WEBHOOK_SECRET not set — skipping signature verification')
      return true
    }
    return false
  }

  const parts = signatureHeader.split(',')
  const timestampPart = parts.find((p) => p.startsWith('t='))
  const signaturePart = parts.find((p) => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) return false

  const timestamp = timestampPart.slice(2)
  const receivedSig = signaturePart.slice(3)

  const signedPayload = `${timestamp}.${payload.toString('utf8')}`
  const computedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(receivedSig))
}

export type PayMongoEventType =
  | 'checkout_session.payment.paid'
  | 'checkout_session.payment.failed'
  | 'checkout_session.expired'
  | 'checkout_session.completed'
  | 'payment.paid'
  | 'payment.failed'
  | 'payment.refunded'

export function parseWebhookEvent(payload: Buffer): {
  eventType: PayMongoEventType
  checkoutSessionId: string
  paymentIntentId: string | null
  paymentId: string | null
  status: string
  metadata: Record<string, string>
  externalRef: string | null
} {
  const parsed: WebhookPayload = JSON.parse(payload.toString('utf8'))
  const attrs = parsed.data.attributes

  const eventType = attrs.type as PayMongoEventType
  const dataAttrs = attrs.data.attributes as Record<string, unknown>

  const checkoutSessionId = parsed.data.id
  const metadata = (dataAttrs.metadata as Record<string, string>) ?? {}
  const paymentIntentId = (dataAttrs.payment_intent_id as string) ?? (dataAttrs.id as string) ?? null
  const paymentId = (dataAttrs.id as string) ?? null
  const status = (dataAttrs.status as string) ?? ''
  const externalRef = (dataAttrs.external_reference_number as string) ?? null

  return {
    eventType,
    checkoutSessionId,
    paymentIntentId,
    paymentId,
    status,
    metadata,
    externalRef,
  }
}

// ============================================================
// LEGACY: Source API — kept for POS GCash flow compatibility
// ============================================================

export async function createSource(amount: number, description: string, paymentType: 'gcash' | 'maya' = 'gcash') {
  const res = await fetch(`${PAYMONGO_BASE}/sources`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: 'PHP',
          type: paymentType,
          redirect: { success: `${process.env.NEXT_PUBLIC_APP_URL}/pos`, failed: `${process.env.NEXT_PUBLIC_APP_URL}/pos` },
          billing: { name: 'Customer', email: 'customer@vapeshop.ph', phone: '' },
          description,
        },
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.errors?.[0]?.detail || 'PayMongo source creation failed')
  }
  return res.json()
}

export async function getSource(sourceId: string) {
  const res = await fetch(`${PAYMONGO_BASE}/sources/${sourceId}`, {
    headers: { Authorization: auth() },
  })
  return res.json()
}

export async function createPayment(sourceId: string, amount: number, description: string) {
  const res = await fetch(`${PAYMONGO_BASE}/payments`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: 'PHP',
          source: { id: sourceId, type: 'source' },
          description,
        },
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.errors?.[0]?.detail || 'PayMongo payment failed')
  }
  return res.json()
}
