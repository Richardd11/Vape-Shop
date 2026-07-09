import Link from 'next/link'

const categories = [
  { name: 'Devices', slug: 'device', count: 'Devices & Mods' },
  { name: 'Pods', slug: 'pod', count: 'Pod Systems' },
  { name: 'E-Juice', slug: 'juice', count: 'Premium Juices' },
  { name: 'Disposables', slug: 'disposable', count: 'Ready to Vape' },
]

export default function CategoryGrid() {
  return (
    <div className="store-category-grid">
      {categories.map((cat) => (
        <Link key={cat.slug} href={`/store/products?type=${cat.slug}`} className="store-category-card">
          <span>{cat.name}</span>
          <small>{cat.count}</small>
        </Link>
      ))}
    </div>
  )
}
