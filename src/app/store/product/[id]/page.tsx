'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { addToCart } from '@/lib/store'
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

        // Fetch variants for flavor/nicotine options
        const { data: variants } = await supabase
          .from('product_variants')
          .select('*, flavors(name)')
          .eq('product_id', id)
          .eq('is_active', true)

        if (variants?.length) {
          const flavors = [...new Set(variants
            .filter(v => v.flavors?.name)
            .map(v => v.flavors!.name))] as string[]
          const nicotines = [...new Set(variants
            .filter(v => v.nicotine_strength)
            .map(v => v.nicotine_strength!))]

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
          <div className="aspect-square rounded-2xl bg-[#F5F5F7] md:aspect-auto md:h-[400px]" />
          <div className="h-6 w-48 bg-[#F5F5F7] rounded" />
          <div className="h-4 w-24 bg-[#F5F5F7] rounded" />
          <div className="h-8 w-32 bg-[#F5F5F7] rounded" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-sm text-[#86868B]">Product not found</p>
        <Link href="/store/products" className="store-btn-outline mt-4 inline-flex">
          Back to Products
        </Link>
      </div>
    )
  }

  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0

  const handleAddToCart = () => {
    const label = [selectedFlavor, selectedNicotine].filter(Boolean).join(' · ')
    addToCart({
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
    <div className="store-container py-8">
      <Link
        href="/store/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#86868B] hover:text-[#1D1D1F]"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-[#F5F5F7] p-12">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-[400px] w-full object-contain"
            />
          ) : (
            <div className="text-6xl text-[#D2D2D7]">📦</div>
          )}
        </div>

        <div>
          <StockBadge stockQty={stock} />
          <h1 className="mt-3 text-2xl font-semibold text-[#1D1D1F] sm:text-3xl">{product.name}</h1>
          {product.brand_name && (
            <p className="mt-1 text-sm text-[#86868B]">{product.brand_name}</p>
          )}
          <p className="mt-4 text-3xl font-semibold text-[#1D1D1F]">{formatCurrency(product.base_price)}</p>

          {product.description && (
            <p className="store-divider mt-6 pt-6 text-sm leading-relaxed text-[#86868B]">
              {product.description}
            </p>
          )}

          <div className="store-divider mt-6 space-y-6 pt-6">
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

          <div className="store-divider mt-6 pt-6">
            <div className="flex items-center gap-4">
              <QuantityStepper value={quantity} max={Math.max(stock, 99)} onChange={setQuantity} />
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="store-btn-primary flex-1 gap-2"
              >
                {added ? '✓ Added!' : (
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
