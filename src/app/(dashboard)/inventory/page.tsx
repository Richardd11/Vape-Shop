import { createClient } from "@/lib/supabase/server";
import { formatCurrency, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS } from "@/lib/utils";
import { Plus, Search, Package, AlertTriangle, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DeleteProductButton from "@/components/inventory/DeleteProductButton";
import RestockButton from "@/components/inventory/RestockButton";

export const revalidate = 5;

const TYPE_BADGE_CLASS: Record<string, string> = {
  device: "badge badge-info",
  juice: "badge badge-success",
  pod: "badge badge-brand",
  disposable: "badge badge-warning",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products_with_stock")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data: products } = await query;

  const activeType = type || "all";

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Inventory</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage your products, variants, and stock</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Link href="/inventory/movements" className="btn btn-ghost">
              <ArrowRightLeft size={16} /> Stock History
            </Link>
            <Link href="/inventory/new" className="btn btn-brand">
              <Plus size={16} /> Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Card Container */}
      <div className="card overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row gap-4 sm:items-center">
          <form className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name or SKU..."
              className="input pl-9"
            />
            {type && <input type="hidden" name="type" value={type} />}
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", "device", "juice", "pod", "disposable"].map((t) => (
              <Link
                key={t}
                href={`/inventory?type=${t}${q ? `&q=${q}` : ""}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                  activeType === t
                    ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                    : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-white/5"
                )}
              >
                {t === "all" ? "All Types" : PRODUCT_TYPE_LABELS[t as keyof typeof PRODUCT_TYPE_LABELS]}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full max-w-full table-fixed text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header-cell px-2 sm:px-4 w-[40%] sm:w-auto">Product</th>
                <th className="table-header-cell px-2 sm:px-4 hidden sm:table-cell">SKU</th>
                <th className="table-header-cell px-2 sm:px-4 hidden md:table-cell">Type</th>
                <th className="table-header-cell px-2 sm:px-4 text-right w-[15%] sm:w-auto">Price</th>
                <th className="table-header-cell px-2 sm:px-4 text-right w-[15%] sm:w-auto">Stock</th>
                <th className="table-header-cell px-2 sm:px-4 text-center w-[15%] sm:w-auto">Status</th>
                {isAdmin && <th className="table-header-cell px-2 sm:px-4 text-center w-[15%] sm:w-auto">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => {
                const isLow = p.total_stock <= p.low_stock_alert;
                const isOut = p.total_stock === 0;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-border-subtle)] transition-colors hover:bg-white/[0.03] group"
                  >
                    <td className="table-cell px-2 sm:px-4">
                      <Link
                        href={isAdmin ? `/inventory/${p.id}` : "#"}
                        className={cn(
                          "font-semibold transition-colors",
                          isAdmin
                            ? "text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)]"
                            : "text-[var(--color-text-primary)]"
                        )}
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{p.brand_name}</p>
                    </td>
                    <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)] hidden sm:table-cell">{p.sku}</td>
                    <td className="table-cell hidden md:table-cell">
                      <span className={TYPE_BADGE_CLASS[p.type] ?? "badge"}>
                        {PRODUCT_TYPE_LABELS[p.type as keyof typeof PRODUCT_TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="table-cell text-right font-medium text-[var(--color-brand-400)]">
                      {formatCurrency(p.base_price)}
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={cn(
                          "font-bold",
                          isOut
                            ? "text-[var(--color-danger)]"
                            : isLow
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-text-primary)]"
                        )}
                      >
                        {p.total_stock}
                      </span>
                      {p.variant_count > 1 && (
                        <p className="text-[10px] uppercase mt-0.5 text-[var(--color-text-tertiary)]">
                          {p.variant_count} vars
                        </p>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      {isOut ? (
                        <span className="badge badge-danger">Out</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <RestockButton productId={p.id} productName={p.name} />
                          <Link
                            href={`/inventory/${p.id}`}
                            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-400)] hover:bg-brand-500/10 transition-all"
                            title="Edit product"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </Link>
                          <DeleteProductButton productId={p.id} productName={p.name} />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <Package size={40} className="text-[var(--color-text-tertiary)]" />
                      <p className="text-[var(--color-text-secondary)]">No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
