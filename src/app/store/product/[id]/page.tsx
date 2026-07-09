'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/components/store/StoreCartProvider'
import QuantityStepper from '@/components/store/QuantityStepper'
import StockBadge from '@/components/store/StockBadge'
import VariantPicker from '@/components/store/VariantPicker'
import type { Product } from '@/lib/types'

interface ProductWithStock extends Product {
  total_stock?: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<ProductWithStock | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null)
  const [selectedNicotine, setSelectedNicotine] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const id = params.id as string

      const { data: productData } = await supabase
        .from('products_with_stock')
        .select('*')
        .eq('id', id)
        .single()

      if (productData) {
        setProduct(productData as unknown as ProductWithStock)

        const { data: variants } = await supabase
          .from('product_variants')
          .select('*, flavors(name)')
          .eq('product_id', id)
          .eq('is_active', true)

        if (variants?.length) {
          const flavors = [...new Set(variants
            .filter((variant) => variant.flavors?.name)
            .map((variant) => variant.flavors!.name))] as string[]
          const nicotines = [...new Set(variants
            .filter((variant) => variant.nicotine_strength)
            .map((variant) => variant.nicotine_strength!))]

          if (flavors.length) setSelectedFlavor(flavors[0])
          if (nicotines.length) setSelectedNicotine(nicotines[0])
        }
      }

      setLoading(false)
    }

    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="store-container py-16">
        <div className="animate-pulse space-y-4">
          <div className="aspect-square bg-[#f5f5f5] md:aspect-auto md:h-[520px]" />
          <div className="h-6 w-48 rounded bg-[#f5f5f5]" />
          <div className="h-4 w-24 rounded bg-[#f5f5f5]" />
          <div className="h-8 w-32 rounded bg-[#f5f5f5]" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-sm text-[#767676]">Product not found</p>
        <Link href="/store/products" className="store-button-secondary mt-4">
          Back to Products
        </Link>
      </div>
    )
  }

  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0

  const handleAddToCart = () => {
    const label = [selectedFlavor, selectedNicotine].filter(Boolean).join(' - ')
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.base_price,
      quantity,
      image_url: product.image_url || '',
      variant_label: label || undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="store-container store-product-detail">
      <Link href="/store/products" className="store-back-link">
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="store-product-detail-grid">
        <div className="store-product-gallery">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="store-product-placeholder">VAPE SHOP</div>
          )}
        </div>

        <div className="store-product-summary">
          <StockBadge stockQty={stock} />
          <h1>{product.name}</h1>
          {product.brand_name && <p className="store-product-detail-vendor">{product.brand_name}</p>}
          <p className="store-product-detail-price">{formatCurrency(product.base_price)}</p>

          {product.description && (
            <p className="store-product-description">{product.description}</p>
          )}

          <div className="store-product-options">
            {(product.type === 'juice' || product.type === 'pod') && selectedFlavor && (
              <VariantPicker
                label="Flavor"
                options={[selectedFlavor]}
                selected={selectedFlavor}
                onChange={setSelectedFlavor}
              />
            )}
            {(product.type === 'juice' || product.type === 'pod') && selectedNicotine && (
              <VariantPicker
                label="Nicotine Strength"
                options={[selectedNicotine]}
                selected={selectedNicotine}
                onChange={setSelectedNicotine}
              />
            )}
          </div>

          <div className="store-product-purchase">
            <div className="store-product-buy-row">
              <QuantityStepper value={quantity} max={Math.max(stock, 99)} onChange={setQuantity} />
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="store-button flex-1 gap-2"
              >
                {added ? 'Added!' : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
