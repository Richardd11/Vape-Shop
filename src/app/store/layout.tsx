import { Inter } from 'next/font/google'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import AgeVerification from '@/components/store/AgeVerification'
import CartDrawer from '@/components/store/CartDrawer'
import { StoreCartProvider } from '@/components/store/StoreCartProvider'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VapeShop Online Store',
  description: 'Premium vaping products — authentic, fast delivery',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F5F7] text-[#1D1D1F] antialiased`}>
        <StoreCartProvider>
          <AgeVerification />
          <StoreHeader />
          <main className="min-h-screen pt-16">{children}</main>
          <StoreFooter />
          <CartDrawer />
        </StoreCartProvider>
      </body>
    </html>
  )
}
