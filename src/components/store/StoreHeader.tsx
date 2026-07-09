'use client'

import Link from 'next/link'
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from './StoreCartProvider'

const navGroups = [
  { label: 'Home', href: '/store' },
  {
    label: 'Pod Kits / Refillable',
    href: '/store/products?type=pod',
    children: [
      { label: 'All Pod Kits', href: '/store/products?type=pod' },
      { label: 'Oxva / Vagend', href: '/store/products?type=pod&search=oxva' },
    ],
  },
  {
    label: 'Coil & Cartridge Replacement',
    href: '/store/products?search=cartridge',
    children: [
      { label: 'All Replacement Cartridge & Coil', href: '/store/products?search=cartridge' },
      { label: 'Lost Vape', href: '/store/products?search=lost%20vape' },
      { label: 'Oxva / Vagend', href: '/store/products?search=oxva' },
    ],
  },
  {
    label: 'E-Juice',
    href: '/store/products?type=juice',
    children: [
      { label: 'All Ejuice', href: '/store/products?type=juice' },
      { label: 'Freebase', href: '/store/products?type=juice&search=freebase' },
      { label: 'Saltnic', href: '/store/products?type=juice&search=saltnic' },
    ],
  },
  { label: 'Disposable Vape', href: '/store/products?type=disposable' },
  {
    label: 'Accessories',
    href: '/store/products?search=accessories',
    children: [
      { label: 'All Accessories', href: '/store/products?search=accessories' },
      { label: 'Cartridge', href: '/store/products?search=cartridge' },
      { label: 'Charger', href: '/store/products?search=charger' },
      { label: 'Coils', href: '/store/products?search=coil' },
    ],
  },
  { label: 'Blog', href: '#' },
]

export default function StoreHeader() {
  const { count, toggleCart, hydrated } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) window.location.href = `/store/products?search=${encodeURIComponent(query)}`
  }

  return (
    <>
      <div className="store-announcement">
        <a href="/store/products">₱799 Order - DISCOUNT ON DELIVERY</a>
        <a href="https://www.facebook.com/wvphvsvistaverde">Check out of FACEBOOK page for more updates! (Click here)</a>
      </div>

      <header className="store-header">
        <div className="store-container store-header-top">
          <button onClick={() => setMenuOpen(true)} className="store-icon-button store-mobile-only" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <button onClick={() => setSearchOpen(!searchOpen)} className="store-icon-button store-desktop-only" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>

          <Link href="/store" className="store-logo" aria-label="VapeShop home">
            <span>VAPE</span>
            <span>SHOP</span>
          </Link>

          <div className="store-header-actions">
            <Link href="/login" className="store-icon-button store-desktop-only" aria-label="Account">
              <UserRound className="h-5 w-5" />
            </Link>
            <button onClick={() => setSearchOpen(!searchOpen)} className="store-icon-button store-mobile-only" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={toggleCart} className="store-icon-button relative" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {hydrated && count > 0 && (
                <span className="store-cart-count">{count > 9 ? '9+' : count}</span>
              )}
            </button>
          </div>
        </div>

        <nav className="store-container store-desktop-nav">
          {navGroups.map((nav) => (
            <div key={nav.label} className="store-nav-item">
              <Link href={nav.href} className="store-nav-link">
                {nav.label}
                {nav.children && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
              {nav.children && (
                <div className="store-nav-dropdown">
                  {nav.children.map((child) => (
                    <Link key={child.label} href={child.href} className="store-dropdown-link">
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {searchOpen && (
          <div className="store-search-panel">
            <div className="store-container">
              <form onSubmit={handleSearch} className="store-search-form">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="store-input"
                />
                <button type="submit" className="store-button">Search</button>
              </form>
            </div>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="store-mobile-menu md:hidden">
          <div className="store-mobile-menu-head">
            <Link href="/store" className="store-logo small" onClick={() => setMenuOpen(false)}>
              <span>VAPE</span>
              <span>SHOP</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="store-icon-button" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="store-container store-mobile-links">
            {navGroups.map((nav) => (
              <Link key={nav.label} href={nav.href} className="store-mobile-link" onClick={() => setMenuOpen(false)}>
                {nav.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
