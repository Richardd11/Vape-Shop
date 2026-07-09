import { Suspense } from 'react'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import AgeVerification from '@/components/store/AgeVerification'
import CartDrawer from '@/components/store/CartDrawer'
import { StoreCartProvider } from '@/components/store/StoreCartProvider'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreCartProvider>
      <AgeVerification />
      <StoreHeader />
      <Suspense fallback={null}>
        <main className="storefront min-h-screen bg-white text-[#121212]">{children}</main>
      </Suspense>
      <StoreFooter />
      <CartDrawer />
    </StoreCartProvider>
  )
}
