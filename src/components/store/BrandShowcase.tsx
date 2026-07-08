import Link from 'next/link'

const brands = [
  { name: 'OXVA', slug: 'oxva' },
  { name: 'Lost Vape', slug: 'lost-vape' },
  { name: 'Vaporesso', slug: 'vaporesso' },
  { name: 'SMOK', slug: 'smok' },
  { name: 'GeekVape', slug: 'geekvape' },
  { name: 'Uwell', slug: 'uwell' },
]

export default function BrandShowcase() {
  return (
    <section className="store-container py-16">
      <h2 className="mb-8 text-xl font-semibold tracking-tight text-[#1D1D1F]">Top Brands</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/store/products?brand=${brand.slug}`}
            className="flex items-center justify-center border border-[#E5E5E7] px-4 py-6 text-sm font-medium text-[#1D1D1F] transition-all hover:border-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
