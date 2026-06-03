import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Activity, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockMovementsPage() {
  const supabase = await createClient();

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select(`
      *,
      profiles(full_name),
      product_variants(
        sku_variant,
        flavor_id,
        flavors(name),
        nicotine_strength,
        size_ml,
        products(name, type)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-4xl mx-auto pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="btn btn-ghost w-9 h-9 rounded-xl p-0 shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Stock Movements</h1>
          <p className="text-xs md:text-sm text-[var(--color-text-tertiary)]">Recent inventory additions and deductions</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-xs uppercase text-[var(--color-text-secondary)] bg-[var(--color-surface-base)]">
                <th className="table-header-cell px-4 py-3 font-semibold">Date</th>
                <th className="table-header-cell px-4 py-3 font-semibold">Product</th>
                <th className="table-header-cell px-4 py-3 font-semibold text-center">Type</th>
                <th className="table-header-cell px-4 py-3 font-semibold text-right">Qty</th>
                <th className="table-header-cell px-4 py-3 font-semibold">Notes</th>
                <th className="table-header-cell px-4 py-3 font-semibold">User</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {movements?.map((m) => {
                const variant = m.product_variants as any;
                const isAddition = ["purchase_in", "initial", "return"].includes(m.type);
                const parts = [];
                if (variant?.sku_variant) parts.push(variant.sku_variant);
                if (variant?.flavors?.name) parts.push(variant.flavors.name);
                if (variant?.nicotine_strength) parts.push(variant.nicotine_strength);
                if (variant?.size_ml) parts.push(`${variant.size_ml}ml`);
                const variantLabel = parts.join(" · ");

                return (
                  <tr key={m.id} className="border-b border-[var(--color-border-subtle)] transition-colors hover:bg-white/[0.03]">
                    <td className="table-cell px-4 py-3 whitespace-nowrap text-[var(--color-text-secondary)]">{formatDateTime(m.created_at)}</td>
                    <td className="table-cell px-4 py-3">
                      <p className="font-semibold text-[var(--color-text-primary)]">{variant?.products?.name || "Unknown Product"}</p>
                      {variantLabel && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{variantLabel}</p>}
                    </td>
                    <td className="table-cell px-4 py-3 text-center">
                      <span className={cn("badge uppercase text-[10px]", m.type === "sale" ? "badge-info" : m.type === "adjustment" ? "badge-warning" : isAddition ? "badge-success" : "badge-danger")}>
                        {m.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-cell px-4 py-3 text-right">
                      <span className={cn("font-bold flex items-center justify-end gap-1", isAddition ? "text-success" : "text-danger")}>
                        {isAddition ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isAddition ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="table-cell px-4 py-3 text-[var(--color-text-secondary)] text-xs truncate max-w-[200px]" title={m.notes || ""}>{m.notes || "-"}</td>
                    <td className="table-cell px-4 py-3 text-[var(--color-text-tertiary)] text-xs">{(m.profiles as any)?.full_name || "System"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!movements || movements.length === 0) && (
          <div className="py-16 text-center flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <Activity size={40} className="text-[var(--color-text-secondary)]" />
              <p className="text-[var(--color-text-tertiary)]">No movements recorded yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden flex flex-col gap-2">
        {movements?.map((m) => {
          const variant = m.product_variants as any;
          const isAddition = ["purchase_in", "initial", "return"].includes(m.type);
          const parts = [];
          if (variant?.sku_variant) parts.push(variant.sku_variant);
          if (variant?.flavors?.name) parts.push(variant.flavors.name);
          if (variant?.nicotine_strength) parts.push(variant.nicotine_strength);
          if (variant?.size_ml) parts.push(`${variant.size_ml}ml`);
          const variantLabel = parts.join(" · ");

          return (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("badge uppercase text-[0.6rem]", m.type === "sale" ? "badge-info" : m.type === "adjustment" ? "badge-warning" : isAddition ? "badge-success" : "badge-danger")}>
                      {m.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{variant?.products?.name || "Unknown"}</p>
                  {variantLabel && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{variantLabel}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-tertiary)]">
                    <span>{formatDateTime(m.created_at)}</span>
                    <span>by {(m.profiles as any)?.full_name || "System"}</span>
                  </div>
                  {m.notes && <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">{m.notes}</p>}
                </div>
                <span className={cn("text-sm font-bold shrink-0 flex items-center gap-1", isAddition ? "text-success" : "text-danger")}>
                  {isAddition ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {isAddition ? "+" : ""}{m.quantity}
                </span>
              </div>
            </div>
          );
        })}
        {(!movements || movements.length === 0) && (
          <div className="card py-16 text-center">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <Activity size={40} className="text-[var(--color-text-secondary)]" />
              <p className="text-[var(--color-text-tertiary)]">No movements recorded yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
