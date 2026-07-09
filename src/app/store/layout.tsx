import { Suspense } from 'react'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import AgeVerification from '@/components/store/AgeVerification'
import CartDrawer from '@/components/store/CartDrawer'
import { StoreCartProvider } from '@/components/store/StoreCartProvider'

function StoreFallback() {
  return (
    <div className="storefront min-h-screen bg-white">
      <div className="store-container py-32">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="mx-auto h-8 w-64 skeleton" />
          <div className="mx-auto h-4 w-48 skeleton" />
        </div>
      </div>
    </div>
  )
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreCartProvider>
      <AgeVerification />
      <StoreHeader />
      <Suspense fallback={<StoreFallback />}>
        <main className="storefront min-h-screen bg-white text-[#121212]">{children}</main>
      </Suspense>
      <StoreFooter />
      <CartDrawer />
    </StoreCartProvider>
  )
}
