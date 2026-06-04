"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtimeProducts } from "@/lib/realtime";
import { useRefreshListener } from "@/lib/refreshBus";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { formatCurrency, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS, cn } from "@/lib/utils";
import { Search, Package, AlertTriangle, ChevronRight, Edit3, Plus, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import DeleteProductButton from "@/components/inventory/DeleteProductButton";
import RestockButton from "@/components/inventory/RestockButton";

interface ProductRow {
  id: string;
  name: string;
  brand_name: string;
  type: string;
  sku: string;
  base_price: number;
  total_stock: number;
  low_stock_alert: number;
  variant_count: number;
  is_active: boolean;
  category_name?: string;
}

const TYPE_BADGE_CLASS: Record<string, string> = {
  device: "badge badge-info",
  juice: "badge badge-success",
  pod: "badge badge-brand",
  disposable: "badge badge-warning",
};

export default function RealtimeInventoryList({
  initialProducts,
  isAdmin,
}: {
  initialProducts: ProductRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ view: "with_stock" });
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const list = json.data ?? json;
      if (Array.isArray(list)) {
        setProducts(list);
      }
    }
    setLoading(false);
  }, [q, type]);

  // Refetch when the search/type filters change (mount/focus/polling below).
  useEffect(() => {
    if (mountedRef.current) {
      fetchProducts();
    }
    mountedRef.current = true;
  }, [fetchProducts]);

  useRealtimeProducts(() => fetchProducts());
  useRefreshListener("inventory", fetchProducts);
  // Auto reconcile on mount, focus, tab visibility and a polling interval so
  // edits/restocks show up without a manual refresh.
  useAutoRefresh(fetchProducts);

  const activeType = type || "all";

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-0.5">Inventory</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage your products, variants, and stock</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link href="/inventory/movements" className="btn btn-ghost btn-sm">
              <ArrowRightLeft size={14} /> History
            </Link>
            <Link href="/inventory/new" className="btn btn-brand btn-sm">
              <Plus size={14} /> Add Product
            </Link>
          </div>
        )}
      </div>

      <div className="card p-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <form className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input type="text" name="q" defaultValue={q} placeholder="Search by name or SKU..." className="input input-sm pl-9 w-full" />
            {type && <input type="hidden" name="type" value={type} />}
          </form>
          <div className="flex gap-1.5 overflow-x-auto">
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
                {t === "all" ? "All" : PRODUCT_TYPE_LABELS[t as keyof typeof PRODUCT_TYPE_LABELS]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:block card overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">SKU</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell text-right">Price</th>
                <th className="table-header-cell text-right">Stock</th>
                <th className="table-header-cell text-center">Status</th>
                {isAdmin && <th className="table-header-cell text-center w-[120px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => {
                const isLow = p.total_stock <= p.low_stock_alert;
                const isOut = p.total_stock === 0;
                return (
                  <tr key={p.id} className="border-b border-[var(--color-border-subtle)] transition-colors hover:bg-white/[0.03]">
                    <td className="table-cell">
                      <Link href={isAdmin ? `/inventory/${p.id}` : "#"} className={cn("font-semibold transition-colors", isAdmin ? "text-brand-400 hover:text-brand-300" : "text-[var(--color-text-primary)]")}>{p.name}</Link>
                      <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">{p.brand_name}</p>
                    </td>
                    <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)]">{p.sku}</td>
                    <td className="table-cell"><span className={TYPE_BADGE_CLASS[p.type] ?? "badge"}>{PRODUCT_TYPE_LABELS[p.type as keyof typeof PRODUCT_TYPE_LABELS]}</span></td>
                    <td className="table-cell text-right font-medium text-brand-400">{formatCurrency(p.base_price)}</td>
                    <td className="table-cell text-right">
                      <span className={cn("font-bold", isOut ? "text-danger" : isLow ? "text-warning" : "text-[var(--color-text-primary)]")}>{p.total_stock}</span>
                      {p.variant_count > 1 && <p className="text-[10px] uppercase mt-0.5 text-[var(--color-text-tertiary)]">{p.variant_count} vars</p>}
                    </td>
                    <td className="table-cell text-center">
                      {isOut ? <span className="badge badge-danger">Out</span> : isLow ? <span className="badge badge-warning">Low</span> : <span className="badge badge-success">OK</span>}
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <RestockButton productId={p.id} productName={p.name} />
                          <Link href={`/inventory/${p.id}`} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-brand-400 hover:bg-brand-500/10 transition-all" title="Edit">
                            <Edit3 size={13} />
                          </Link>
                          <DeleteProductButton productId={p.id} productName={p.name} />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!products || products.length === 0) && (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <Package size={40} className="text-[var(--color-text-tertiary)]" />
              <p className="text-[var(--color-text-secondary)]">No products found</p>
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden flex flex-col gap-2">
        {products?.map((p) => {
          const isLow = p.total_stock <= p.low_stock_alert;
          const isOut = p.total_stock === 0;
          return (
            <div key={p.id} className={cn("card p-4 transition-colors", isAdmin && "active:bg-white/[0.04]")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={TYPE_BADGE_CLASS[p.type] ?? "badge"}>{PRODUCT_TYPE_LABELS[p.type as keyof typeof PRODUCT_TYPE_LABELS]}</span>
                    {isOut ? <span className="badge badge-danger text-[0.6rem]">Out</span> : isLow ? <span className="badge badge-warning text-[0.6rem]">Low</span> : null}
                  </div>
                  {isAdmin ? (
                    <Link href={`/inventory/${p.id}`} className="text-sm font-semibold text-brand-400 hover:text-brand-300">{p.name}</Link>
                  ) : (
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name}</p>
                  )}
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{p.brand_name}</p>
                  {p.sku && <p className="text-[0.65rem] font-mono text-[var(--color-text-tertiary)] mt-1">{p.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-400">{formatCurrency(p.base_price)}</p>
                  <p className={cn("text-xs font-bold mt-1", isOut ? "text-danger" : isLow ? "text-warning" : "text-[var(--color-text-secondary)]")}>
                    {p.total_stock} stock
                    {p.variant_count > 1 && <span className="text-[var(--color-text-tertiary)] font-normal ml-1">{p.variant_count}v</span>}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                  <RestockButton productId={p.id} productName={p.name} />
                  <Link href={`/inventory/${p.id}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                    <Edit3 size={12} /> Edit
                  </Link>
                  <div className="flex-1" />
                  <DeleteProductButton productId={p.id} productName={p.name} />
                </div>
              )}
            </div>
          );
        })}
        {(!products || products.length === 0) && (
          <div className="card py-16 text-center">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <Package size={40} className="text-[var(--color-text-tertiary)]" />
              <p className="text-[var(--color-text-secondary)]">No products found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
