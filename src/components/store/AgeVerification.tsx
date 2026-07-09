'use client'

import { useEffect, useState } from 'react'
import { isAgeVerified, setAgeVerified } from '@/lib/store'

export default function AgeVerification() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(!isAgeVerified()), 0)
    return () => window.clearTimeout(timer)
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
    <div className="store-age-overlay">
      <div className="store-age-modal" role="dialog" aria-modal="true" aria-labelledby="age-title">
        <div className="store-age-mark">18+</div>
        <h2 id="age-title">AGE VERIFICATION!</h2>
        <p>
          To use the Vape Shop website you must be at least 18 years old or above.
          Please verify your age before entering the site.
        </p>
        <div className="store-age-actions">
          <button onClick={handleYes} className="store-age-button">I am 18+</button>
          <button onClick={handleNo} className="store-age-button">Under 18</button>
        </div>
        <p className="store-age-warning">
          WARNING: Some of our products may contain nicotine. Nicotine is addictive.
          Minors are strictly prohibited from entering this website.
        </p>
      </div>
    </div>
  )
}
