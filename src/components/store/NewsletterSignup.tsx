'use client'

import { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className="store-newsletter-section">
      <div className="store-container">
        <h2>JOIN OUR NEWSLETTER</h2>
        <p>Subscribe for exclusive deals, new arrivals, and restock alerts.</p>
        {subscribed ? (
          <div className="store-newsletter-success">Thanks for subscribing!</div>
        ) : (
          <form onSubmit={handleSubmit} className="store-newsletter-form">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  )
}
