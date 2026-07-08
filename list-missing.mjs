import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, sku, brand_id')
  const { data: images } = await supabase.from('product_images').select('product_id, url')
  const { data: brands } = await supabase.from('brands').select('id, name')

  const brandMap = {}
  for (const b of brands || []) brandMap[b.id] = b.name

  const hasImage = new Set()
  for (const img of images || []) {
    if (img.url && img.url.trim()) hasImage.add(img.product_id)
  }

  const missing = (products || []).filter(p => !hasImage.has(p.id))
  console.log(`\nMissing images: ${missing.length} / ${products.length} products\n`)

  for (const p of missing) {
    const brand = brandMap[p.brand_id] || 'Unknown'
    console.log(`${p.id} | ${brand} | ${p.name}`)
  }
}

main()
