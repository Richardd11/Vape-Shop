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
    <div className="space-y-8">
      {/* Availability */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#86868B]">Availability</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="accent-[#1D1D1F]" defaultChecked />
            <span className="text-sm text-[#1D1D1F]">In stock (23)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="accent-[#1D1D1F]" />
            <span className="text-sm text-[#1D1D1F]">Out of stock (17)</span>
          </label>
        </div>
      </div>

      {/* Product Type */}
      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#86868B]">Product Type</h4>
        <div className="space-y-1">
          {productTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter('type', t.value)}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                currentType === t.value
                  ? 'bg-[#F5F5F7] font-medium text-[#1D1D1F]'
                  : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
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
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#86868B]">Brand</h4>
          <div className="space-y-1">
            <button
              onClick={() => setFilter('brand', '')}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                !currentBrand
                  ? 'bg-[#F5F5F7] font-medium text-[#1D1D1F]'
                  : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
              }`}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setFilter('brand', brand.id)}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  currentBrand === brand.id
                    ? 'bg-[#F5F5F7] font-medium text-[#1D1D1F]'
                    : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button onClick={clearFilters} className="text-xs text-[#86868B] underline hover:text-[#1D1D1F]">
          Remove all
        </button>
      )}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="mb-4 w-full border border-[#D2D2D7] py-2.5 text-xs font-medium uppercase tracking-widest md:hidden"
      >
        Filter{hasFilters ? ` (${searchParams.toString().split('&').length})` : ''}
      </button>

      <aside className="hidden md:block md:w-56 lg:w-64 shrink-0">{filtersContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#1D1D1F]">Filter</h3>
            <button onClick={() => setMobileOpen(false)} className="p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          {filtersContent}
          <button
            onClick={() => { clearFilters(); setMobileOpen(false) }}
            className="mt-6 w-full border border-[#1D1D1F] py-3 text-xs font-medium uppercase tracking-widest text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white transition-all"
          >
            Apply
          </button>
        </div>
      )}
    </>
  )
}
