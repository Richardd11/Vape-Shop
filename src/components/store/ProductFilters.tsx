'use client'

import { X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const productTypes = [
  { value: '', label: 'All' },
  { value: 'device', label: 'Devices' },
  { value: 'pod', label: 'Pods' },
  { value: 'juice', label: 'E-Liquids' },
  { value: 'disposable', label: 'Disposables' },
]

interface ProductFiltersProps {
  brands: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}

export default function ProductFilters({ brands }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`/store/products?${params.toString()}`)
  }

  const clearFilters = () => router.push('/store/products')
  const hasFilters = searchParams.toString().length > 0
  const currentType = searchParams.get('type') || ''
  const currentBrand = searchParams.get('brand') || ''

  const filtersContent = (
    <div className="store-facet-panel">
      {/* Availability */}
      <div>
        <h4>Availability</h4>
        <div className="store-facet-options">
          <label>
            <input type="checkbox" className="accent-[#121212]" defaultChecked />
            <span>In stock</span>
          </label>
          <label>
            <input type="checkbox" className="accent-[#121212]" />
            <span>Out of stock</span>
          </label>
        </div>
      </div>

      {/* Product Type */}
      <div>
        <h4>Product Type</h4>
        <div className="store-facet-buttons">
          {productTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter('type', t.value)}
              className={`store-facet-button ${
                currentType === t.value
                  ? 'active'
                  : ''
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h4>Brand</h4>
          <div className="store-facet-buttons">
            <button
              onClick={() => setFilter('brand', '')}
              className={`store-facet-button ${
                !currentBrand
                  ? 'active'
                  : ''
              }`}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setFilter('brand', brand.id)}
                className={`store-facet-button ${
                  currentBrand === brand.id
                    ? 'active'
                    : ''
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button onClick={clearFilters} className="store-remove-link">
          Remove all
        </button>
      )}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="store-mobile-filter-button"
      >
        Filter{hasFilters ? ` (${searchParams.toString().split('&').length})` : ''}
      </button>

      <aside className="hidden shrink-0 md:block md:w-56 lg:w-64">{filtersContent}</aside>

      {mobileOpen && (
        <div className="store-filter-drawer">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#121212]">Filter</h3>
            <button onClick={() => setMobileOpen(false)} className="p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          {filtersContent}
          <button
            onClick={() => { clearFilters(); setMobileOpen(false) }}
            className="store-button mt-6 w-full"
          >
            Apply
          </button>
        </div>
      )}
    </>
  )
}
