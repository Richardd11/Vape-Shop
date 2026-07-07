import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/store/ProductCard'
import ProductFilters from '@/components/store/ProductFilters'
import type { Product, Brand, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function ProductsGrid({ type, brand }: { type?: string; brand?: string }) {
  const supabase = createClient()

  let query = supabase
    .from('products_with_stock')
    .select('*')

  if (type) query = query.eq('type', type)
  if (brand) query = query.eq('brand_id', brand)

  const { data: products } = await query
    .order('name', { ascending: true })

  if (!products?.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#86868B]">No products found</p>
        <a href="/store/products" className="store-btn-outline mt-4 inline-flex">
          Clear Filters
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product as unknown as Product} />
      ))}
    </div>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = createClient()

  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="store-container py-8">
      <h1 className="store-section-title mb-8">All Products</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <ProductFilters brands={(brands ?? []) as Brand[]} categories={(categories ?? []) as Category[]} />
        <div className="flex-1">
          <Suspense fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="store-card overflow-hidden">
                  <div className="aspect-square bg-[#F5F5F7] animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 bg-[#F5F5F7] rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[#F5F5F7] rounded animate-pulse" />
                    <div className="h-5 w-20 bg-[#F5F5F7] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <ProductsGrid type={params.type} brand={params.brand} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
