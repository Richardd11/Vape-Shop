'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/components/store/StoreCartProvider'
import QuantityStepper from '@/components/store/QuantityStepper'
import StockBadge from '@/components/store/StockBadge'
import VariantPicker from '@/components/store/VariantPicker'
import CartToast from '@/components/store/CartToast'
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
  const [showToast, setShowToast] = useState(false)
  const [flavors, setFlavors] = useState<string[]>([])
  const [nicotines, setNicotines] = useState<string[]>([])
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
          const f = [...new Set(variants
            .filter((v) => v.flavors?.name)
            .map((v) => v.flavors!.name))] as string[]
          const n = [...new Set(variants
            .filter((v) => v.nicotine_strength)
            .map((v) => v.nicotine_strength!))]

          setFlavors(f)
          setNicotines(n)
          if (f.length) setSelectedFlavor(f[0])
          if (n.length) setSelectedNicotine(n[0])
        }
      }

      setLoading(false)
    }

    load()
  }, [params.id])

  const handleAddToCart = useCallback(() => {
    const label = [selectedFlavor, selectedNicotine].filter(Boolean).join(' - ')
    addItem({
      product_id: product!.id,
      name: product!.name,
      price: product!.base_price,
      quantity,
      image_url: product!.image_url || '',
      variant_label: label || undefined,
    })
    setShowToast(true)
  }, [addItem, product, quantity, selectedFlavor, selectedNicotine])

  if (loading) {
    return (
      <div className="store-container py-16">
        <div className="md:grid md:grid-cols-2 md:gap-12">
          <div className="aspect-square bg-[#F5F5F7] md:aspect-auto md:h-[520px]" />
          <div className="mt-6 md:mt-0 space-y-4">
            <div className="h-4 w-20 bg-[#F5F5F7]" />
            <div className="h-8 w-64 bg-[#F5F5F7]" />
            <div className="h-4 w-32 bg-[#F5F5F7]" />
            <div className="h-6 w-24 bg-[#F5F5F7]" />
            <div className="h-12 w-full bg-[#F5F5F7]" />
            <div className="h-12 w-full bg-[#F5F5F7]" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-sm text-[#86868B]">Product not found</p>
        <Link href="/store/products" className="store-button-secondary mt-4 inline-flex">
          Back to Products
        </Link>
      </div>
    )
  }

  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0
  const isJuiceOrPod = product.type === 'juice' || product.type === 'pod'

  return (
    <div className="store-container store-product-detail">
      <Link href="/store/products" className="store-back-link">
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="store-product-detail-grid">
        <div className="store-product-gallery group">
          {product.image_url ? (
            <div className="relative overflow-hidden w-full h-full">
              <img
                src={product.image_url}
                alt={product.name}
                className="transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="store-product-placeholder w-full h-full">VAPE SHOP</div>
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

          {isJuiceOrPod && (flavors.length > 0 || nicotines.length > 0) && (
            <div className="store-product-options">
              {flavors.length > 0 && (
                <VariantPicker
                  label="Flavor"
                  options={flavors}
                  selected={selectedFlavor}
                  onChange={setSelectedFlavor}
                />
              )}
              {nicotines.length > 0 && (
                <VariantPicker
                  label="Nicotine Strength"
                  options={nicotines}
                  selected={selectedNicotine}
                  onChange={setSelectedNicotine}
                />
              )}
            </div>
          )}

          <div className="store-product-purchase">
            <div className="store-product-buy-row">
              <QuantityStepper value={quantity} max={Math.max(stock, 99)} onChange={setQuantity} />
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="store-button flex-1 gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CartToast message={`${product.name} added to cart`} visible={showToast} onHide={() => setShowToast(false)} />
    </div>
  )
}
