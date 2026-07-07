'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCartCount } from '@/lib/store'

export default function StoreHeader() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setCartCount(getCartCount())
    const handler = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  return (
    <header className="store-header-blur">
      <div className="store-container flex h-16 items-center justify-between">
        <Link href="/store" className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
          VapeShop
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/store" className="text-sm text-[#86868B] transition-colors hover:text-[#1D1D1F]">
            Home
          </Link>
          <Link href="/store/products" className="text-sm text-[#86868B] transition-colors hover:text-[#1D1D1F]">
            Products
          </Link>
        </nav>

        <button onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))} className="relative">
          <ShoppingBag className="h-5 w-5 text-[#1D1D1F]" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1D1D1F] px-1 text-[10px] font-medium text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
