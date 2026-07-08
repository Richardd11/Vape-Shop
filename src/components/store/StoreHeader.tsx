'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X, Search, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCart } from './StoreCartProvider'

const navGroups = [
  {
    label: 'Home',
    href: '/store',
  },
  {
    label: 'Disposable Vape',
    href: '/store/products?type=disposable',
  },
  {
    label: 'Pod Kits',
    href: '/store/products?type=pod',
  },
  {
    label: 'E-Liquids',
    href: '/store/products?type=juice',
  },
  {
    label: 'Devices',
    href: '/store/products?type=device',
  },
  {
    label: 'All Products',
    href: '/store/products',
  },
]

export default function StoreHeader() {
  const { count, toggleCart, hydrated } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/store/products?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="store-announcement">
        ₱799 Order - DISCOUNT ON DELIVERY
      </div>

      <header className={`store-header-blur ${scrolled ? 'scrolled' : ''}`}>
        <div className="store-container flex h-16 items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/store" className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
            VapeShop
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navGroups.map((nav) => (
              <Link
                key={nav.label}
                href={nav.href}
                className="text-[0.8125rem] text-[#1D1D1F] tracking-wide hover:opacity-60 transition-opacity"
              >
                {nav.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-[#1D1D1F] hover:opacity-60 transition-opacity">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={toggleCart} className="relative text-[#1D1D1F] hover:opacity-60 transition-opacity">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1D1D1F] px-1 text-[10px] font-medium text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="border-t border-[#E5E5E7] bg-white">
            <div className="store-container py-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="store-input flex-1"
                />
                <button type="submit" className="store-btn-primary">Search</button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white pt-[120px] md:hidden">
          <div className="store-container flex flex-col gap-4">
            {navGroups.map((nav) => (
              <Link
                key={nav.label}
                href={nav.href}
                className="text-lg text-[#1D1D1F] border-b border-[#E5E5E7] pb-3"
                onClick={() => setMenuOpen(false)}
              >
                {nav.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
