import Link from 'next/link'

const categories = [
  { name: 'Devices', slug: 'device', count: 'Devices & Mods' },
  { name: 'Pods', slug: 'pod', count: 'Pod Systems' },
  { name: 'E-Liquids', slug: 'juice', count: 'Premium Juices' },
  { name: 'Disposables', slug: 'disposable', count: 'Ready to Vape' },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/store/products?type=${cat.slug}`}
          className="group relative aspect-square overflow-hidden bg-white"
        >
          <div className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:bg-[#F5F5F7]">
            <span className="text-3xl mb-3">
              {cat.slug === 'device' ? '⚡' : cat.slug === 'pod' ? '💨' : cat.slug === 'juice' ? '🧪' : '📱'}
            </span>
            <span className="text-sm font-medium text-[#1D1D1F]">{cat.name}</span>
            <span className="mt-1 text-[0.65rem] uppercase tracking-wider text-[#86868B]">{cat.count}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
