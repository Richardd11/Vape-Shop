"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: BarChart3 },
];

interface MobileNavProps {
  role: string;
}

export default function MobileNav({ role: _role }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
      <div className="flex items-center justify-around px-2 py-1 pb-safe">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-0",
                active
                  ? "text-brand-400 bg-brand-500/10"
                  : "text-text-tertiary"
              )}
            >
              <Icon size={20} />
              <span className="text-[0.7rem] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
