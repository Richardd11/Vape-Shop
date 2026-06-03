"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Zap, LayoutDashboard, ShoppingCart, Package,
  BarChart3, Tag, ArrowRightLeft, LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales History", icon: BarChart3 },
];

const adminItems = [
  { href: "/inventory/reference-data", label: "Reference Data", icon: Tag },
  { href: "/inventory/movements", label: "Stock Movements", icon: ArrowRightLeft },
];

interface SidebarProps {
  profile: Profile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile?.role === "admin";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[var(--color-surface-base)] border-r border-[var(--color-border-subtle)] overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-gradient-to-br from-brand-500 to-brand-600">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary leading-none">VapeShop</div>
          <div className="text-[0.65rem] text-text-tertiary mt-0.5 font-medium tracking-wide">POS+IMS</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <p className="text-[0.6rem] font-semibold mb-2 px-2 text-text-tertiary uppercase tracking-[0.1em]">MAIN</p>
        {mainItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} prefetch={true} className={cn("nav-link", active && "active")}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="text-[0.6rem] font-semibold mt-4 mb-2 px-2 text-text-tertiary uppercase tracking-[0.1em]">ADMIN</p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link key={href} href={href} prefetch={true} className={cn("nav-link", active && "active")}>
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info + Sign out */}
      <div className="p-3 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3 p-2 rounded-lg mb-2 bg-[var(--color-surface-root)]">
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{profile?.full_name ?? "User"}</p>
            <p className="text-xs text-text-secondary capitalize">{profile?.role ?? "cashier"}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="nav-link w-full text-danger hover:bg-danger-soft hover:text-danger">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
