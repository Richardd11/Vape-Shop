'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className="border-t border-[#E5E5E7] bg-[#F5F5F7]">
      <div className="store-container py-16 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Join Our Newsletter</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#86868B]">
          Subscribe for exclusive deals, new arrivals, and restock alerts.
        </p>
        {subscribed ? (
          <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4" />
            Thanks for subscribing!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 border border-[#D2D2D7] bg-white px-4 py-3 text-sm outline-none focus:border-[#1D1D1F]"
            />
            <button
              type="submit"
              className="border border-[#1D1D1F] bg-[#1D1D1F] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition-all hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
