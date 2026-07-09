'use client'

import { useEffect, useRef } from 'react'

export default function CartToast({ message, visible, onHide }: { message: string; visible: boolean; onHide: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onHide()
        timerRef.current = null
      }, 2500)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, onHide])

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full border border-[#E5E5E7] bg-white px-5 py-3 shadow-lg">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D1D1F]">
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm text-[#1D1D1F]">{message}</span>
      </div>
    </div>
  )
}