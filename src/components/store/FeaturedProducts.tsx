import { createClient } from '@/lib/supabase/server'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/types'

interface FeaturedProductsProps {
  offset?: number
}

export default async function FeaturedProducts({ offset = 0 }: FeaturedProductsProps) {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products_with_stock')
    .select('*')
    .gt('total_stock', 0)
    .order('created_at', { ascending: false })
    .range(offset, offset + 4)

  if (!products?.length) return null

  return (
    <div className="store-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product as unknown as Product} />
      ))}
    </div>
  )
}
