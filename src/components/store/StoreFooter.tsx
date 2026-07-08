'use client'

import Link from 'next/link'
import { MailOpen } from 'lucide-react'

const footerSections = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/store/products' },
      { label: 'Disposable Vape', href: '/store/products?type=disposable' },
      { label: 'Pod Kits', href: '/store/products?type=pod' },
      { label: 'E-Liquids', href: '/store/products?type=juice' },
      { label: 'Devices', href: '/store/products?type=device' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Shipping Info', href: '#' },
      { label: 'Return Policy', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms & Conditions', href: '#' },
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
    <footer className="border-t border-[#E5E5E7] bg-white">
      <div className="store-container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/store" className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
              VapeShop
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#86868B]">
              Premium vaping products — authentic devices, pods, e-liquids, and disposables. Fast delivery across the Philippines.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="store-social-btn" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="#" className="store-social-btn" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="mailto:hello@vapeshop.ph" className="store-social-btn" aria-label="Email">
                <MailOpen className="h-4 w-4" />
              </a>
            </div>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="store-footer-heading">{section.title}</h3>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="store-footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-10 border-t border-[#E5E5E7] pt-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="store-footer-heading mb-1">Newsletter</h3>
              <p className="text-sm text-[#86868B]">Subscribe for exclusive deals and new arrivals.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = (e.target as HTMLFormElement).querySelector('input')!
                if (input.value) {
                  alert('Thanks for subscribing!')
                  input.value = ''
                }
              }}
              className="flex w-full max-w-sm gap-2"
            >
              <input
                type="email"
                placeholder="your@email.com"
                required
                className="flex-1 border border-[#D2D2D7] px-4 py-2 text-sm outline-none focus:border-[#1D1D1F]"
              />
              <button type="submit" className="border border-[#1D1D1F] bg-[#1D1D1F] px-6 py-2 text-xs font-medium uppercase tracking-wider text-white hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E5E7] pt-6">
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] uppercase tracking-wider text-[#86868B]">We accept:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#86868B]">GCash</span>
              <span className="text-xs text-[#86868B]">Maya</span>
              <span className="text-xs text-[#86868B]">COD</span>
            </div>
          </div>
          <p className="text-[0.65rem] text-[#86868B]">
            &copy; {new Date().getFullYear()} VapeShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
