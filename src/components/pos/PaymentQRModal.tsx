'use client'

import { useEffect, useState, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, Smartphone, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  checkoutUrl: string
  sourceId: string
  saleId: string
  amount: number
  paymentMethod: 'gcash' | 'maya'
  onComplete: () => void
  onClose: () => void
}

type QrStatus = 'waiting' | 'confirmed' | 'failed'

const paymentConfig = {
  gcash: {
    name: 'GCash',
    icon: Smartphone,
    color: '#00A94D',
    bgColor: 'bg-[#00A94D]',
    hoverBg: 'hover:bg-[#008C3A]',
    spinColor: 'text-[#00A94D]',
  },
  maya: {
    name: 'Maya',
    icon: Wallet,
    color: '#00B4D8',
    bgColor: 'bg-[#00B4D8]',
    hoverBg: 'hover:bg-[#0098B8]',
    spinColor: 'text-[#00B4D8]',
  },
}

export default function PaymentQRModal({
  checkoutUrl,
  sourceId,
  saleId,
  amount,
  paymentMethod,
  onComplete,
  onClose,
}: Props) {
  const [status, setStatus] = useState<QrStatus>('waiting')
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const attemptsRef = useRef(0)

  const config = paymentConfig[paymentMethod]
  const Icon = config.icon

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkoutUrl)}&margin=10`

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      attemptsRef.current++
      if (attemptsRef.current > 30) {
        clearInterval(pollRef.current)
        setError('Payment timeout. Please try again.')
        setStatus('failed')
        return
      }

      try {
        const res = await fetch('/api/paymongo/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId,
            amount,
            saleId,
            description: `Sale #${saleId.substring(0, 8)}`,
          }),
        })

        if (res.ok) {
          clearInterval(pollRef.current)
          setStatus('confirmed')
          setTimeout(onComplete, 1500)
        }
      } catch {
        // Silently retry
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [sourceId, saleId, amount, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {status === 'waiting' && (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: config.color + '20' }}>
              <Icon className="h-6 w-6" style={{ color: config.color }} />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-1">{config.name} Payment</h3>
            <p className="text-sm text-[#86868B] mb-4">Scan the QR code with your {config.name} app</p>

            <div className="mx-auto w-[300px] h-[300px] rounded-xl border-2 border-dashed border-[#E5E5E7] flex items-center justify-center bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt={`${config.name} QR Code`}
                className="w-full h-full object-contain"
                onError={() => setError('Failed to load QR code. Open the link below instead.')}
              />
            </div>

            <p className="text-xs text-[#86868B] mt-3">
              Amount: <span className="font-bold text-[#1D1D1F]">{formatCurrency(amount)}</span>
            </p>

            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 className={`h-4 w-4 animate-spin ${config.spinColor}`} />
              <span className="text-xs text-[#86868B]">Waiting for payment...</span>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-xl ${config.bgColor} py-2.5 text-sm font-semibold text-white ${config.hoverBg} transition-colors`}
              >
                Open {config.name} Page
              </a>
              <button onClick={onClose} className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                Cancel Payment
              </button>
            </div>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-1">Payment Received!</h3>
            <p className="text-sm text-[#86868B]">{formatCurrency(amount)} via {config.name}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-1">Payment Failed</h3>
            <p className="text-sm text-[#86868B]">{error || 'Could not process payment'}</p>
            <button onClick={onClose} className="mt-4 text-sm" style={{ color: config.color }}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
