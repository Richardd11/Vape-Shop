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

export default function ProductFilters({ brands, categories }: ProductFiltersProps) {
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
  const currentCategory = searchParams.get('category') || ''

  const filtersContent = (
    <div className="space-y-6">
      {/* Product Type */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">Type</h4>
        <div className="space-y-1">
          {productTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter('type', t.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
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
        <div className="store-divider pt-6">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">Brand</h4>
          <div className="space-y-1">
            <button
              onClick={() => setFilter('brand', '')}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
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
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
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
        <button
          onClick={clearFilters}
          className="text-sm text-[#86868B] underline hover:text-[#1D1D1F]"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="store-btn-outline mb-4 md:hidden"
      >
        Filters{hasFilters ? ` (${searchParams.toString().split('&').length})` : ''}
      </button>

      <aside className="hidden md:block md:w-56">{filtersContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Filters</h3>
            <button onClick={() => setMobileOpen(false)} className="store-pill">
              <X className="h-4 w-4" />
            </button>
          </div>
          {filtersContent}
        </div>
      )}
    </>
  )
}
