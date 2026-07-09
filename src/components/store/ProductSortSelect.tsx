'use client'

export default function ProductSortSelect({ currentSort }: { currentSort: string }) {
  return (
    <div className="store-sort">
      <label>Sort by:</label>
      <select
        defaultValue={currentSort}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search)
          params.set('sort', e.target.value)
          window.location.href = `/store/products?${params.toString()}`
        }}
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
