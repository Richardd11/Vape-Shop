"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Package, Plus, Minus, Loader2, Save, X } from "lucide-react";
import { cn, formatCurrency, getVariantLabel } from "@/lib/utils";

interface Variant {
  id: string;
  sku_variant: string | null;
  flavor_id: string | null;
  flavors: { name: string } | null;
  nicotine_strength: string | null;
  size_ml: number | null;
  puff_count: number | null;
  device_compat: string | null;
  price_override: number | null;
  stock: number;
  is_active: boolean;
}

interface ProductWithVariants {
  id: string;
  name: string;
  type: string;
  base_price: number;
  product_variants: Variant[];
}

export default function RestockButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Record<string, number>>({});

  async function openModal() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load variants");
      const data = await res.json();
      setProduct(data);
      
      // Initialize stock values
      const initial: Record<string, number> = {};
      for (const v of data.product_variants || []) {
        initial[v.id] = v.stock;
      }
      setStocks(initial);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setProduct(null);
    setStocks({});
  }

  function adjustStock(variantId: string, delta: number) {
    setStocks((prev) => ({
      ...prev,
      [variantId]: Math.max(0, (prev[variantId] || 0) + delta),
    }));
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    setError(null);

    try {
      const variants = product.product_variants
        .filter((v) => stocks[v.id] !== v.stock)
        .map((v) => ({ id: v.id, stock: stocks[v.id] }));

      if (variants.length === 0) {
        closeModal();
        return;
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update stock");
      }

      router.refresh();
      closeModal();
      // Force reload after short delay if router.refresh doesn't work
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); openModal(); }}
        className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-success)] hover:bg-green-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Restock variants"
      >
        <Package size={14} />
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl animate-scale-in bg-[var(--color-surface-raised)] border-[var(--color-border-default)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Restock</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{productName}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[var(--color-text-secondary)]" />
                </div>
              ) : product && product.product_variants?.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {product.product_variants.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        "bg-[var(--color-surface-base)] border-[var(--color-border-default)]",
                        !v.is_active && "opacity-40"
                      )}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {getVariantLabel(v as any)}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                          SKU: {v.sku_variant || "N/A"} · Price: {formatCurrency(v.price_override || product.base_price)}
                        </p>
                      </div>

                      {/* Stock controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => adjustStock(v.id, -1)}
                          disabled={stocks[v.id] <= 0}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:border-red-500/30 disabled:opacity-30 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={stocks[v.id] ?? v.stock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setStocks((prev) => ({ ...prev, [v.id]: Math.max(0, val) }));
                          }}
                          min={0}
                          className={cn(
                            "w-16 text-center text-sm font-bold py-1.5 rounded-lg border transition-all",
                            "bg-[var(--color-surface-root)] border-[var(--color-border-default)] text-[var(--color-text-primary)]",
                            "focus:border-brand-500/50 focus:outline-none",
                            stocks[v.id] > v.stock && "text-[var(--color-success)] border-green-500/30",
                            stocks[v.id] < v.stock && "text-[var(--color-danger)] border-red-500/30"
                          )}
                        />
                        <button
                          onClick={() => adjustStock(v.id, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-root)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-success)] hover:border-green-500/30 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                  <Package size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No variants found for this product</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-surface-base)] rounded-b-2xl">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {product ? `${product.product_variants?.length || 0} variants` : ""}
              </p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="btn btn-ghost text-sm" disabled={saving}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading || !product}
                  className={cn("btn btn-success text-sm min-w-[110px]", (saving || loading) && "opacity-60 pointer-events-none")}
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Stock</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
