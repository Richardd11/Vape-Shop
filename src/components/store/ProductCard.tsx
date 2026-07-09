'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from './StoreCartProvider'
import CartToast from './CartToast'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [showToast, setShowToast] = useState(false)
  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0
  const price = product.base_price
  const comparePrice = product.cost_price && product.cost_price > price ? product.cost_price : null
  const isSale = comparePrice !== null

  const handleAdd = useCallback(() => {
    addItem({
      product_id: product.id,
      name: product.name,
      price,
      quantity: 1,
      image_url: product.image_url || '',
    })
    setShowToast(true)
  }, [addItem, product.id, product.name, price, product.image_url])

  const hideToast = useCallback(() => setShowToast(false), [])

  return (
    <article className="store-product-card">
      <Link href={`/store/product/${product.id}`} className="store-product-media" aria-label={product.name}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <span className="store-product-placeholder">VAPE SHOP</span>
        )}
        {isSale && <span className="store-badge-sale">Sale</span>}
        {isOutOfStock && <span className="store-badge-soldout">Sold out</span>}
      </Link>

      <div className="store-product-info">
        <Link href={`/store/product/${product.id}`} className="store-product-title">
          {product.name}
        </Link>
        {product.brand_name && <p className="store-product-vendor">{product.brand_name}</p>}
        <div className="store-price-row">
          <span className={isSale ? 'store-price-sale' : 'store-price'}>
            {formatCurrency(price)}
          </span>
          {isSale && <span className="store-price-compare">{formatCurrency(comparePrice)}</span>}
        </div>
        {!isOutOfStock && (
          <button
            onClick={handleAdd}
            className="store-quick-add"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to cart
          </button>
        )}
      </div>

      <CartToast message="Added to cart" visible={showToast} onHide={hideToast} />
    </article>
  )
}
