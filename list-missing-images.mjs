import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cjcptrcqvzxtilqcnyqk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY3B0cmNxdnp4dGlsY3FueXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODUxOTEsImV4cCI6MjA5NjA2MTE5MX0.aDKjdBsV0rktWLWE5SYIvzBK7qVp_-0dgXFyC39EqmU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: products, error: pe } = await supabase.from('products').select('id, name, sku')
  if (pe) { console.error('Products error:', pe); return }

  const { data: images, error: ie } = await supabase.from('product_images').select('product_id, url')
  if (ie) { console.error('Images error:', ie); return }

  const hasImage = new Set()
  for (const img of images || []) {
    if (img.url && img.url.trim()) hasImage.add(img.product_id)
  }

  const missing = (products || []).filter(p => !hasImage.has(p.id))
  console.log(`\nTotal products: ${products.length}`)
  console.log(`With images: ${hasImage.size}`)
  console.log(`Missing images: ${missing.length}\n`)

  for (const p of missing) {
    console.log(`${p.id} | ${p.sku || 'N/A'} | ${p.name}`)
  }
}

main()
