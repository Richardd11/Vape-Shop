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
      <main className="min-h-screen pt-[120px] bg-[#F5F5F7] text-[#1D1D1F]">{children}</main>
      <StoreFooter />
      <CartDrawer />
    </StoreCartProvider>
  )
}
