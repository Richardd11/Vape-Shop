import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/ProductCard'
import ProductFilters from '@/components/store/ProductFilters'
import ProductSortSelect from '@/components/store/ProductSortSelect'
import type { Product, Brand, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function ProductsGrid({ type, brand, sort, search }: { type?: string; brand?: string; sort?: string; search?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('products_with_stock')
    .select('*')

  if (type) query = query.eq('type', type)
  if (brand) query = query.eq('brand_id', brand)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand_name.ilike.%${search}%`)

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
        <a href="/store/products" className="store-button-secondary mt-4 inline-flex">
          Clear Filters
        </a>
      </div>
    )
  }

  return (
    <>
      <p className="store-product-count">{products.length} products</p>
      <div className="store-product-grid collection-grid">
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
  const currentTitle = params.search
    ? `Search: ${params.search}`
    : params.type === 'disposable' ? 'Disposable Vape' :
      params.type === 'pod' ? 'Pod Kits / Refillable' :
      params.type === 'juice' ? 'E-Juice' :
      params.type === 'device' ? 'Devices' : 'Products'

  return (
    <div className="store-container store-collection-page">
      <div className="store-collection-hero">
        <h1>{currentTitle}</h1>
      </div>

      <div className="store-collection-layout">
        <ProductFilters brands={(brands ?? []) as Brand[]} categories={(categories ?? []) as Category[]} />
        <div className="store-collection-results">
          <div className="store-collection-toolbar">
            <span className="store-filter-label">Filter:</span>
            <ProductSortSelect currentSort={currentSort} />
          </div>

          <Suspense fallback={
            <div className="store-product-grid collection-grid">
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
            <ProductsGrid type={params.type} brand={params.brand} sort={currentSort} search={params.search} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
