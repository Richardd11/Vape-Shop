'use client'

import { useRouter } from 'next/navigation'

export default function ProductSortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value === 'created-desc') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    params.delete('page')
    router.push(`/store/products?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="store-sort">
      <label>Sort by:</label>
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="store-sort-select"
      >
        <option value="created-desc">Featured</option>
        <option value="name-asc">Alphabetically, A-Z</option>
        <option value="name-desc">Alphabetically, Z-A</option>
        <option value="price-asc">Price, low to high</option>
        <option value="price-desc">Price, high to low</option>
      </select>
    </div>
  )
}
