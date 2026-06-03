"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname === path)?.[1] ??
    (pathname.startsWith("/inventory/") ? "Edit Product" :
     pathname.startsWith("/sales/") ? "Sale Detail" : "VapeShop POS");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shrink-0">
      <div>
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary bg-[var(--color-surface-root)] hover:text-text-primary hover:bg-[var(--color-surface-raised)] transition-colors">
          <Bell size={16} />
        </button>

        {/* Desktop: user name + avatar (sidebar handles sign out) */}
        <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>

        {/* Mobile: clickable avatar with dropdown */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <ChevronDown
              size={12}
              className={cn(
                "text-text-tertiary transition-transform duration-200",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 card-glass rounded-xl border border-[var(--color-border-default)] shadow-elevated overflow-hidden animate-scale-in z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
                <p className="text-sm font-medium text-text-primary truncate">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="text-xs text-text-tertiary capitalize">
                  {profile?.role ?? "cashier"}
                </p>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger-soft transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
