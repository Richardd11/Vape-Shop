import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/ProductCard'
import ProductFilters from '@/components/store/ProductFilters'
import type { Product, Brand, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function ProductsGrid({ type, brand, sort }: { type?: string; brand?: string; sort?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('products_with_stock')
    .select('*')

  if (type) query = query.eq('type', type)
  if (brand) query = query.eq('brand_id', brand)

  switch (sort) {
    case 'price-asc': query = query.order('base_price', { ascending: true }); break
    case 'price-desc': query = query.order('base_price', { ascending: false }); break
    case 'name-asc': query = query.order('name', { ascending: true }); break
    case 'name-desc': query = query.order('name', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query

  if (!products?.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#86868B]">No products found</p>
        <a href="/store/products" className="mt-4 inline-block border border-[#D2D2D7] px-6 py-2 text-xs font-medium uppercase tracking-wider text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white transition-all">
          Clear Filters
        </a>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-xs text-[#86868B]">{products.length} products</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as unknown as Product} />
        ))}
      </div>
    </>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ])

  const currentSort = params.sort || 'created-desc'

  return (
    <div className="store-container py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mb-1">
        {params.type === 'disposable' ? 'Disposable Vape' :
         params.type === 'pod' ? 'Pod Kits' :
         params.type === 'juice' ? 'E-Liquids' :
         params.type === 'device' ? 'Devices' : 'All Products'}
      </h1>
      <p className="text-sm text-[#86868B] mb-8">Premium vaping products</p>

      <div className="flex flex-col gap-8 md:flex-row">
        <ProductFilters brands={(brands ?? []) as Brand[]} categories={(categories ?? []) as Category[]} />
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="hidden md:block" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#86868B]">Sort by:</label>
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
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i}>
                  <div className="aspect-square bg-[#F5F5F7] animate-pulse" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-16 bg-[#F5F5F7] rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[#F5F5F7] rounded animate-pulse" />
                    <div className="h-5 w-20 bg-[#F5F5F7] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <ProductsGrid type={params.type} brand={params.brand} sort={currentSort} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
