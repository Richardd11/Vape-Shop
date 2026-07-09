'use client'

import Link from 'next/link'
import { MailOpen } from 'lucide-react'

const footerSections = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/store/products' },
      { label: 'Pod Kits / Refillable', href: '/store/products?type=pod' },
      { label: 'E-Juice', href: '/store/products?type=juice' },
      { label: 'Disposable Vape', href: '/store/products?type=disposable' },
      { label: 'Accessories', href: '/store/products?search=accessories' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Shipping Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
  {
    title: 'Info',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'FAQ', href: '#' },
      { label: 'Order Tracking', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
]

export default function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-container">
        <div className="store-footer-grid">
          <div className="store-footer-brand">
            <Link href="/store" className="store-logo small">
              <span>VAPE</span>
              <span>SHOP</span>
            </Link>
            <p>Premium vaping products, authentic devices, pods, e-juice, and disposables. Fast delivery across the Philippines.</p>
            <div className="store-social-row">
              <a href="#" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.62.77-1.62 1.56v1.89h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
                </svg>
              </a>
              <a href="mailto:hello@vapeshop.ph" aria-label="Email"><MailOpen className="h-4 w-4" /></a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="store-footer-bottom">
          <div>
            <span>We accept:</span>
            <strong>GCash</strong>
            <strong>Maya</strong>
            <strong>COD</strong>
          </div>
          <p>&copy; {new Date().getFullYear()} VapeShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
