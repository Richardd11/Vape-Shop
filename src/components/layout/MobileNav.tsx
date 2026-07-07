"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, BarChart3, ArrowRightLeft, Tag, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const mainTabs = [
  { href: "/dashboard", label: "Dash", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/store", label: "Store", icon: Store },
  { href: "/inventory", label: "Items", icon: Package },
  { href: "/sales", label: "Sales", icon: BarChart3 },
];

const adminTabs = [
  { href: "/inventory/movements", label: "Stock", icon: ArrowRightLeft },
  { href: "/inventory/reference-data", label: "Refs", icon: Tag },
];

interface MobileNavProps {
  role: string;
}

export default function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const tabs = isAdmin ? [...mainTabs, ...adminTabs] : mainTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
      <div className="flex items-center justify-around px-1 py-1 pb-safe">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl transition-all min-w-0 px-1.5 py-1.5",
                active
                  ? "text-brand-400 bg-brand-500/10"
                  : "text-text-tertiary"
              )}
            >
              <Icon size={18} />
              <span className="text-[0.6rem] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
