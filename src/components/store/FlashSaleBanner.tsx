import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface FlashSale {
  id: string
  product_id: string
  sale_price: number
  ends_at: string
  product_name: string
  original_price: number
  product_image_url: string | null
  product_slug: string | null
  discount_percentage: number
}

export default async function FlashSaleBanner() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from('active_flash_sales')
    .select('*')
    .limit(1)

  if (!sales?.length) return null

  const sale = sales[0] as unknown as FlashSale

  return (
    <section className="store-flash-sale">
      <div className="store-container py-6">
        <Link
          href={`/store/product/${sale.product_slug || sale.product_id}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Flash Sale</p>
              <p className="text-xs text-white/60">{sale.product_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60 line-through">{formatCurrency(sale.original_price)}</span>
            <span className="text-lg font-bold text-white">{formatCurrency(sale.sale_price)}</span>
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              -{sale.discount_percentage}%
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
