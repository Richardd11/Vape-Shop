export default function StoreFooter() {
  return (
    <footer className="border-t border-[#E5E5E7] bg-white">
      <div className="store-container py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#86868B]">
            &copy; {new Date().getFullYear()} VapeShop. All rights reserved.
          </p>
          <p className="text-xs text-[#86868B]">
            Powered by VapeShop POS+IMS
          </p>
        </div>
      </div>
    </footer>
  )
}
