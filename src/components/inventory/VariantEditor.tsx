"use client";

import { useState } from "react";
import { Save, Loader2, Plus, Minus, ToggleLeft, ToggleRight } from "lucide-react";
import { cn, formatCurrency, getVariantLabel } from "@/lib/utils";

interface Variant {
  id: string;
  flavor_id: string | null;
  sku_variant: string | null;
  flavors: { name: string } | null;
  nicotine_strength: string | null;
  size_ml: number | null;
  puff_count: number | null;
  device_compat: string | null;
  price_override: number | null;
  stock: number;
  is_active: boolean;
}

export default function VariantEditor({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [edited, setEdited] = useState<Record<string, { stock: number; price: number | null; active: boolean }>>(() => {
    const init: Record<string, { stock: number; price: number | null; active: boolean }> = {};
    for (const v of variants) {
      init[v.id] = { stock: v.stock, price: v.price_override, active: v.is_active };
    }
    return init;
  });

  const changedCount = variants.filter((v) => {
    const e = edited[v.id];
    return e.stock !== v.stock || e.price !== v.price_override || e.active !== v.is_active;
  }).length;

  function update(id: string, field: "stock" | "price" | "active", value: number | boolean | null) {
    setEdited((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = variants
        .filter((v) => {
          const e = edited[v.id];
          return e.stock !== v.stock || e.price !== v.price_override || e.active !== v.is_active;
        })
        .map((v) => ({
          id: v.id,
          stock: edited[v.id].stock,
          price_override: edited[v.id].price,
          is_active: edited[v.id].active,
        }));

      if (payload.length === 0) return;

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update variants");
      }

      setSuccess(true);
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (!variants.length) return null;

  return (
    <div className="card p-4 md:p-6 mt-4">
      {/* Header with Save */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-bold text-[var(--color-text-primary)]">Variants ({variants.length})</h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 hidden sm:block">Edit stock, prices, and status</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || changedCount === 0}
          className={cn(
            "flex items-center gap-1.5 rounded-xl font-semibold text-sm transition-all duration-200 shrink-0",
            "py-2.5 px-4 sm:py-2 sm:px-3.5",
            changedCount === 0 || saving
              ? "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] cursor-not-allowed"
              : "bg-brand-500 text-white hover:bg-brand-600 active:scale-95 shadow-lg shadow-brand-500/20"
          )}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : success ? (
            "Saved!"
          ) : (
            <><Save size={16} /> Save{changedCount > 0 ? ` (${changedCount})` : ""}</>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] text-xs uppercase text-[var(--color-text-secondary)] bg-[var(--color-surface-base)]">
              <th className="table-header-cell px-4 py-3 font-semibold">Label / Config</th>
              <th className="table-header-cell px-4 py-3 font-semibold text-center w-[130px]">Stock</th>
              <th className="table-header-cell px-4 py-3 font-semibold text-right">Price (₱)</th>
              <th className="table-header-cell px-4 py-3 font-semibold text-center w-[90px]">Active</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const e = edited[v.id];
              const isChanged = e.stock !== v.stock || e.price !== v.price_override || e.active !== v.is_active;
              return (
                <tr key={v.id} className={cn("border-b border-[var(--color-border-subtle)] transition-colors", !e.active && "opacity-40", isChanged && "bg-brand-500/5")}>
                  <td className="table-cell px-4 py-3">
                    <p className="font-medium text-[var(--color-text-primary)] text-sm">{getVariantLabel(v as any)}</p>
                    {v.sku_variant && <p className="text-[0.65rem] text-[var(--color-text-tertiary)] mt-0.5 font-mono">{v.sku_variant}</p>}
                  </td>
                  <td className="table-cell px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => update(v.id, "stock", Math.max(0, e.stock - 1))} disabled={e.stock <= 0} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-red-400 hover:border-red-500/30 disabled:opacity-30 transition-all"><Minus size={12} /></button>
                      <input type="number" value={e.stock} onChange={(ev) => update(v.id, "stock", Math.max(0, parseInt(ev.target.value) || 0))} min={0} className={cn("w-14 text-center text-sm font-bold py-1.5 rounded-lg border transition-all bg-[var(--color-surface-root)] border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-brand-500/50 focus:outline-none", e.stock > v.stock && "text-green-400 border-green-500/30", e.stock < v.stock && "text-red-400 border-red-500/30")} />
                      <button onClick={() => update(v.id, "stock", e.stock + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-green-400 hover:border-green-500/30 transition-all"><Plus size={12} /></button>
                    </div>
                  </td>
                  <td className="table-cell px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-[var(--color-text-tertiary)]">₱</span>
                      <input type="number" value={e.price ?? ""} onChange={(ev) => { const val = ev.target.value ? parseFloat(ev.target.value) : null; update(v.id, "price", val); }} placeholder={formatCurrency(0)} min={0} step={0.01} className={cn("w-24 text-right text-sm font-medium py-1.5 px-2 rounded-lg border transition-all bg-[var(--color-surface-root)] border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-brand-500/50 focus:outline-none", e.price !== v.price_override && "text-brand-400 border-brand-500/30")} />
                    </div>
                  </td>
                  <td className="table-cell px-4 py-3 text-center">
                    <button onClick={() => update(v.id, "active", !e.active)} className={cn("px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-wider border transition-all", e.active ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20")}>{e.active ? "Active" : "Off"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden flex flex-col gap-2">
        {variants.map((v) => {
          const e = edited[v.id];
          const isChanged = e.stock !== v.stock || e.price !== v.price_override || e.active !== v.is_active;
          return (
            <div key={v.id} className={cn("p-3 rounded-xl border transition-colors", isChanged ? "bg-brand-500/5 border-brand-500/20" : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)]", !e.active && "opacity-40")}>
              {/* Label & Active toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{getVariantLabel(v as any)}</p>
                  {v.sku_variant && <p className="text-[0.65rem] text-[var(--color-text-tertiary)] mt-0.5 font-mono">{v.sku_variant}</p>}
                </div>
                <button onClick={() => update(v.id, "active", !e.active)} className="shrink-0 transition-colors ml-2 p-1">
                  {e.active ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-red-400" />}
                </button>
              </div>

              {/* Stock controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => update(v.id, "stock", Math.max(0, e.stock - 1))} disabled={e.stock <= 0} className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] disabled:opacity-30 active:bg-red-500/10 transition-colors"><Minus size={16} /></button>
                  <input type="number" value={e.stock} onChange={(ev) => update(v.id, "stock", Math.max(0, parseInt(ev.target.value) || 0))} min={0} className={cn("w-14 text-center text-sm font-bold py-1.5 rounded-lg border bg-[var(--color-surface-root)] border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-brand-500/50 focus:outline-none", e.stock > v.stock && "text-green-400 border-green-500/30", e.stock < v.stock && "text-red-400 border-red-500/30")} />
                  <button onClick={() => update(v.id, "stock", e.stock + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] active:bg-green-500/10 transition-colors"><Plus size={16} /></button>
                </div>

                {/* Price input */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-tertiary)]">₱</span>
                  <input type="number" value={e.price ?? ""} onChange={(ev) => { const val = ev.target.value ? parseFloat(ev.target.value) : null; update(v.id, "price", val); }} placeholder={formatCurrency(0)} min={0} step={0.01} className={cn("w-24 text-right text-sm font-medium py-1.5 px-2 rounded-lg border bg-[var(--color-surface-root)] border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:border-brand-500/50 focus:outline-none", e.price !== v.price_override && "text-brand-400 border-brand-500/30")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
