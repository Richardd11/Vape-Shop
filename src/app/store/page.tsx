import Link from 'next/link'
import { ArrowRight, Shield, Truck, Package } from 'lucide-react'
import CategoryGrid from '@/components/store/CategoryGrid'
import FeaturedProducts from '@/components/store/FeaturedProducts'

export default function StoreHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="store-container py-16 text-center sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1D1D1F] sm:text-5xl lg:text-6xl">
          Premium Vaping Products
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-[#86868B] sm:text-lg">
          Authentic devices, pods, e-liquids, and disposables — delivered fast.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/store/products" className="store-btn-primary text-base">
            Shop Now
          </Link>
          <Link href="/store/products" className="store-btn-outline text-base">
            View All
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="store-container pb-16">
        <h2 className="store-section-title mb-6">Shop by Category</h2>
        <CategoryGrid />
      </section>

      {/* Featured Products */}
      <section className="store-container pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="store-section-title">Featured Products</h2>
          <Link
            href="/store/products"
            className="hidden items-center gap-1 text-sm text-[#86868B] hover:text-[#1D1D1F] sm:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <FeaturedProducts />
      </section>

      {/* Trust Badges */}
      <section className="store-container pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Shield, title: 'Authentic Products', desc: '100% genuine items sourced directly from brands' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery within Metro Manila' },
            { icon: Package, title: 'Easy Returns', desc: '14-day return policy on unopened items' },
          ].map((item) => (
            <div key={item.title} className="store-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F7]">
                <item.icon className="h-6 w-6 text-[#1D1D1F]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">{item.title}</h3>
              <p className="mt-1 text-xs text-[#86868B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
