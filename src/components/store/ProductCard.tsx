'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { addToCart } from '@/lib/store'
import StockBadge from './StockBadge'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0

  return (
    <div className="store-card group overflow-hidden">
      <Link href={`/store/product/${product.id}`} className="block">
        <div className="flex aspect-square items-center justify-center bg-[#F5F5F7] p-8">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="text-4xl text-[#D2D2D7]">📦</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-1">
          <StockBadge stockQty={stock} />
        </div>
        <Link href={`/store/product/${product.id}`}>
          <h3 className="text-sm font-medium text-[#1D1D1F] transition-colors hover:text-[#86868B]">
            {product.name}
          </h3>
        </Link>
        {product.brand_name && (
          <p className="mt-0.5 text-xs text-[#86868B]">{product.brand_name}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-[#1D1D1F]">{formatCurrency(product.base_price)}</span>
          {!isOutOfStock && (
            <button
              onClick={() =>
                addToCart({
                  product_id: product.id,
                  name: product.name,
                  price: product.base_price,
                  quantity: 1,
                  image_url: product.image_url || '',
                })
              }
              className="store-pill h-9 w-9"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
