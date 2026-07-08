import Link from 'next/link'
import CategoryGrid from '@/components/store/CategoryGrid'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import BrandShowcase from '@/components/store/BrandShowcase'
import NewsletterSignup from '@/components/store/NewsletterSignup'

export default function StoreHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#F5F5F7]">
        <div className="store-container py-20 text-center sm:py-28">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] sm:text-4xl lg:text-5xl">
            Premium Vaping Products
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#86868B] sm:text-base">
            Authentic devices, pods, e-liquids, and disposables. Fast delivery across the Philippines.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/store/products"
              className="inline-flex border border-[#1D1D1F] bg-[#1D1D1F] px-8 py-3 text-xs font-medium uppercase tracking-widest text-white transition-all hover:opacity-90"
            >
              Shop Now
            </Link>
            <Link
              href="/store/products"
              className="inline-flex border border-[#D2D2D7] px-8 py-3 text-xs font-medium uppercase tracking-widest text-[#1D1D1F] transition-all hover:bg-[#F5F5F7]"
            >
              View All
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="store-container py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Featured Products</h2>
          <Link
            href="/store/products"
            className="text-xs font-medium uppercase tracking-widest text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            View All &rarr;
          </Link>
        </div>
        <FeaturedProducts />
      </section>

      {/* Categories */}
      <section className="bg-[#F5F5F7]">
        <div className="store-container py-16">
          <h2 className="mb-8 text-xl font-semibold tracking-tight text-[#1D1D1F]">Shop by Category</h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Brands */}
      <BrandShowcase />

      {/* Newsletter */}
      <NewsletterSignup />
    </div>
  )
}
