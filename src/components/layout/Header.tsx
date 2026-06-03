"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import type { Profile } from "@/lib/types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/inventory": "Inventory",
  "/inventory/new": "Add Product",
  "/inventory/movements": "Stock Movements",
  "/sales": "Sales History",
  "/brands": "Brands",
  "/categories": "Categories",
};

interface HeaderProps {
  profile: Profile | null;
}

export default function Header({ profile }: HeaderProps) {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname === path)?.[1] ??
    (pathname.startsWith("/inventory/") ? "Edit Product" :
     pathname.startsWith("/sales/") ? "Sale Detail" : "VapeShop POS");

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shrink-0">
      <div>
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary bg-[var(--color-surface-root)] hover:text-text-primary hover:bg-[var(--color-surface-raised)] transition-colors">
          <Bell size={16} />
        </button>

        {/* Mobile user avatar */}
        <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
