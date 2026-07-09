import Link from 'next/link'
import { Suspense } from 'react'
import CategoryGrid from '@/components/store/CategoryGrid'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import BrandShowcase from '@/components/store/BrandShowcase'
import NewsletterSignup from '@/components/store/NewsletterSignup'
import AnimatedSection from '@/components/store/AnimatedSection'

export const dynamic = 'force-dynamic'

function FeaturedSkeleton() {
  return (
    <div className="store-product-grid">
      {[1,2,3,4,5].map(i => (
        <div key={i}>
          <div className="aspect-square bg-[#F5F5F7]" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-16 bg-[#F5F5F7]" />
            <div className="h-4 w-32 bg-[#F5F5F7]" />
            <div className="h-5 w-20 bg-[#F5F5F7]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StoreHomePage() {
  return (
    <div className="store-home">
      <AnimatedSection>
        <section className="store-section">
          <div className="store-container">
            <div className="store-section-head">
              <h1>NEW ARRIVAL</h1>
              <Link href="/store/products?sort=created-desc" className="store-view-link">View all</Link>
            </div>
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedProducts offset={0} />
            </Suspense>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="store-section">
          <div className="store-container">
            <div className="store-section-head">
              <h2>PROMO PRICE</h2>
              <Link href="/store/products" className="store-view-link">View all</Link>
            </div>
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedProducts offset={5} />
            </Suspense>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="store-section">
          <div className="store-container">
            <div className="store-section-head">
              <h2>SHOP BY CATEGORY</h2>
            </div>
            <CategoryGrid />
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <BrandShowcase />
      </AnimatedSection>

      <AnimatedSection>
        <NewsletterSignup />
      </AnimatedSection>
    </div>
  )
}
