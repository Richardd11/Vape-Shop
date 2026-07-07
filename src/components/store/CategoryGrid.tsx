import Link from 'next/link'

const categories = [
  { name: 'Devices', slug: 'device', icon: '📱' },
  { name: 'Pods', slug: 'pod', icon: '💨' },
  { name: 'E-Liquids', slug: 'juice', icon: '🧪' },
  { name: 'Disposables', slug: 'disposable', icon: '⚡' },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/store/products?type=${cat.slug}`}
          className="store-card flex flex-col items-center gap-2 p-6 text-center transition-all duration-200 hover:shadow-md"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-sm font-medium text-[#1D1D1F]">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
