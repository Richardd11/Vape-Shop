import Link from 'next/link'
import CategoryGrid from '@/components/store/CategoryGrid'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import BrandShowcase from '@/components/store/BrandShowcase'
import NewsletterSignup from '@/components/store/NewsletterSignup'

export const dynamic = 'force-dynamic'

export default function StoreHomePage() {
  return (
    <div className="store-home">
      <section className="store-section">
        <div className="store-container">
          <div className="store-section-head">
            <h1>PROMO PRICE</h1>
            <Link href="/store/products" className="store-view-link">View all</Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      <section className="store-section">
        <div className="store-container">
          <div className="store-section-head">
            <h2>NEW ARRIVAL</h2>
            <Link href="/store/products?sort=created-desc" className="store-view-link">View all</Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      <section className="store-section">
        <div className="store-container">
          <div className="store-section-head">
            <h2>SHOP BY CATEGORY</h2>
          </div>
          <CategoryGrid />
        </div>
      </section>

      <BrandShowcase />
      <NewsletterSignup />
    </div>
  )
}
