'use client'

import { useEffect, useState } from 'react'
import { isAgeVerified, setAgeVerified } from '@/lib/store'

export default function AgeVerification() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isAgeVerified()) setShow(true)
  }, [])

  const handleYes = () => {
    setAgeVerified()
    setShow(false)
  }

  const handleNo = () => {
    window.location.href = 'https://google.com'
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F7]">
          <span className="text-2xl">🔞</span>
        </div>
        <h2 className="text-xl font-semibold text-[#1D1D1F]">Are you 18 or older?</h2>
        <p className="mt-2 text-sm text-[#86868B]">
          You must be at least 18 years old to view this store.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={handleNo} className="store-btn-outline flex-1">
            No
          </button>
          <button onClick={handleYes} className="store-btn-primary flex-1">
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}
