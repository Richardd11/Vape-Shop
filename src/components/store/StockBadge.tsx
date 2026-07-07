'use client'

import { getStockStatus, STOCK_STATUS_COLORS, STOCK_STATUS_LABELS } from '@/lib/utils'

interface StockBadgeProps {
  stockQty: number
  lowStockAlert?: number
}

export default function StockBadge({ stockQty, lowStockAlert = 5 }: StockBadgeProps) {
  const status = getStockStatus(stockQty, lowStockAlert)

  if (status === 'out') {
    return <span className="store-badge bg-[#FEE2E2] text-[#991B1B]">Out of Stock</span>
  }
  if (status === 'low') {
    return <span className="store-badge bg-[#FEF3C7] text-[#92400E]">Only {stockQty} left</span>
  }
  return null
}
