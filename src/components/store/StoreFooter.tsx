import Link from 'next/link'
import { Facebook, Instagram, Mail } from 'lucide-react'

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
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="store-social-btn" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="mailto:hello@vapeshop.ph" className="store-social-btn" aria-label="Email">
                <Mail className="h-4 w-4" />
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
