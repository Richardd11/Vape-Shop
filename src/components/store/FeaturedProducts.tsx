import { createClient } from '@/lib/supabase/server'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/types'

export default async function FeaturedProducts() {
  const supabase = await createClient()

  // Use products_with_stock view to get total_stock computed from variants
  const { data: products } = await supabase
    .from('products_with_stock')
    .select('*')
    .gt('total_stock', 0)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!products?.length) return null

  return (
    <div className="store-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product as unknown as Product} />
      ))}
    </div>
  )
}
