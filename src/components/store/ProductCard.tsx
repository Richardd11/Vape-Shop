'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from './StoreCartProvider'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const stock = product.total_stock ?? 0
  const isOutOfStock = stock <= 0
  const price = product.base_price
  const comparePrice = product.cost_price && product.cost_price > price ? product.cost_price : null
  const isSale = comparePrice !== null

  return (
    <div className="group">
      <Link href={`/store/product/${product.id}`} className="block relative">
        <div className="aspect-square bg-[#F5F5F7] overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-[#D2D2D7] bg-[#F5F5F7]">
              📦
            </div>
          )}
        </div>
        {isSale && <span className="store-badge-sale">Sale</span>}
        {isOutOfStock && <span className="store-badge-soldout">Sold out</span>}
      </Link>
      <div className="mt-3 space-y-1">
        {product.brand_name && (
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B]">{product.brand_name}</p>
        )}
        <Link href={`/store/product/${product.id}`}>
          <h3 className="text-sm leading-tight text-[#1D1D1F] transition-colors hover:opacity-60">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center">
          <span className={isSale ? 'store-price-sale' : 'text-sm font-medium text-[#1D1D1F]'}>
            {formatCurrency(price)}
          </span>
          {isSale && <span className="store-price-compare">{formatCurrency(comparePrice)}</span>}
        </div>
        {!isOutOfStock && (
          <button
            onClick={() =>
              addItem({
                product_id: product.id,
                name: product.name,
                price,
                quantity: 1,
                image_url: product.image_url || '',
              })
            }
            className="mt-2 w-full border border-[#D2D2D7] py-2 text-xs font-medium uppercase tracking-wider text-[#1D1D1F] transition-all hover:bg-[#1D1D1F] hover:text-white"
          >
            <ShoppingBag className="mr-2 inline h-3.5 w-3.5" />
            Add to cart
          </button>
        )}
      </div>
    </div>
  )
}
