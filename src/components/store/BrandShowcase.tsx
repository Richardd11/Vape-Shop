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
    <section className="store-section">
      <div className="store-container">
        <div className="store-section-head">
          <h2>TOP BRANDS</h2>
        </div>
        <div className="store-brand-grid">
          {brands.map((brand) => (
            <Link key={brand.slug} href={`/store/products?search=${encodeURIComponent(brand.name)}`}>
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
