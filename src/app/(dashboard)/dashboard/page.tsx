import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS, cn } from "@/lib/utils";
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
  ArrowUpRight, Calendar, BarChart2, Plus
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";

export const revalidate = 5; // ISR: refresh every 5 seconds

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  // Parallel data fetching
  const [
    { data: todaySales },
    { data: monthSales },
    { data: lowStockProducts },
    { data: topProducts },
    { data: recentSales },
    { count: totalProductsCount },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`),
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", monthStart),
    supabase
      .from("products_with_stock")
      .select("*")
      .lt("total_stock", 5)
      .eq("is_active", true)
      .order("total_stock", { ascending: true })
      .limit(5),
    supabase
      .from("sale_items")
      .select("product_name, quantity, line_total")
      .order("quantity", { ascending: false })
      .limit(5),
    supabase
      .from("sales")
      .select("id, total_amount, payment_type, created_at, profiles(full_name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const todayRevenue = todaySales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const todayCount = todaySales?.length ?? 0;
  const monthRevenue = monthSales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const monthCount = monthSales?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0 animate-fade-in">
      {/* Revenue cards - daily + monthly side by side, bigger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card bg-gradient-to-br from-brand-500/10 to-brand-500/5 border-brand-500/20 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20">
              <TrendingUp size={22} className="text-brand-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">{formatCurrency(todayRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--color-text-secondary)]">{todayCount} transaction{todayCount !== 1 ? "s" : ""}</span>
            <span className="text-[var(--color-text-tertiary)]">·</span>
            <span className="text-[var(--color-text-secondary)]">{formatDate(new Date())}</span>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-success/10 to-success/5 border-success/20 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-success/20">
              <Calendar size={22} className="text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider">This Month</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">{formatCurrency(monthRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--color-text-secondary)]">{monthCount} transaction{monthCount !== 1 ? "s" : ""}</span>
            <span className="text-[var(--color-text-tertiary)]">·</span>
            <span className="text-[var(--color-text-secondary)]">Avg {monthCount > 0 ? formatCurrency(monthRevenue / monthCount) : "₱0"}/sale</span>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-info/10">
              <Package size={18} className="text-info" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{totalProductsCount ?? 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Active Products</p>
            </div>
          </div>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10">
              <AlertTriangle size={18} className="text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{lowStockProducts?.length ?? 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Low Stock Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-brand-400" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Sales</h2>
            </div>
            <Link href="/sales" className="text-xs text-[var(--color-brand-400)] hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-root)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {((sale.profiles as any)?.full_name) ?? "Cashier"}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {formatDate(sale.created_at)} &middot; {sale.payment_type.toUpperCase()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-success shrink-0 ml-3">
                    {formatCurrency(sale.total_amount)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-center py-4 text-[var(--color-text-tertiary)]">No sales yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Low Stock Items</h2>
            </div>
            <Link href="/inventory" className="text-xs text-[var(--color-brand-400)] hover:underline">
              Manage &rarr;
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {lowStockProducts && lowStockProducts.length > 0 ? (
              (lowStockProducts as Product[]).map((p) => (
                <Link
                  key={p.id}
                  href={`/inventory/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-root)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("badge", PRODUCT_TYPE_COLORS[p.type])}>
                        {PRODUCT_TYPE_LABELS[p.type]}
                      </span>
                      <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                        {(p as Product & { brand_name?: string }).brand_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        (p as Product & { total_stock?: number }).total_stock === 0
                          ? "text-danger"
                          : "text-warning"
                      )}
                    >
                      {(p as Product & { total_stock?: number }).total_stock ?? 0}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">units</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 gap-2">
                <Package size={32} className="text-success" />
                <p className="text-sm text-success">All items well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              href: "/pos",
              label: "New Sale",
              icon: ShoppingBag,
              iconBg: "bg-brand-500/10",
              iconColor: "text-brand-400",
            },
            {
              href: "/inventory/new",
              label: "Add Product",
              icon: Plus,
              iconBg: "bg-success/10",
              iconColor: "text-success",
            },
            {
              href: "/inventory/movements",
              label: "Stock In",
              icon: ArrowUpRight,
              iconBg: "bg-info/10",
              iconColor: "text-info",
            },
            {
              href: "/sales",
              label: "View Reports",
              icon: BarChart2,
              iconBg: "bg-purple-500/10",
              iconColor: "text-purple-400",
            },
          ].map(({ href, label, icon: Icon, iconBg, iconColor }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-root)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] transition-all"
            >
              <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", iconBg)}>
                <Icon size={18} className={iconColor} />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
