"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeProducts, useRealtimeSales } from "@/lib/realtime";
import { notify, useRefreshListener } from "@/lib/refreshBus";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2,
  CheckCircle, Tag, Package
} from "lucide-react";
import {
  cn, formatCurrency, getVariantLabel, getEffectivePrice,
  PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS, generateCartItemId,
  calculateCartTotals, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS
} from "@/lib/utils";
import type { Product, ProductVariant, CartItem, PaymentType } from "@/lib/types";
import ReceiptModal from "@/components/pos/ReceiptModal";
import Toast from "@/components/ui/Toast";

type ProductWithVariants = Product & {
  brands?: { name: string };
  categories?: { name: string };
  product_variants: (ProductVariant & { flavors?: { name: string } | null })[];
};

export default function POSPage() {
  const supabase = createClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [gcashAmount, setGcashAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<Record<string, unknown> | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [variantPickerProduct, setVariantPickerProduct] = useState<ProductWithVariants | null>(null);

  const cartTotals = calculateCartTotals(cartItems);

  const loadProducts = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingProducts(true);
    const params = new URLSearchParams({ active_only: "true" });
    if (search) params.set("search", search);
    if (filterType !== "all") params.set("type", filterType);
    const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
    if (res.ok) { const json = await res.json(); setProducts(json.data ?? json); }
    if (!opts?.silent) setLoadingProducts(false);
  }, [search, filterType]);

  useEffect(() => { const t = setTimeout(() => loadProducts(), 200); return () => clearTimeout(t); }, [loadProducts]);
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Background refreshes update stock silently (no skeleton flash over the grid).
  // immediate: false — the debounced effect above already loads on mount.
  useRealtimeProducts(() => loadProducts({ silent: true }));
  useRefreshListener("products", () => loadProducts({ silent: true }));
  useAutoRefresh(() => loadProducts({ silent: true }), { immediate: false });

  function addToCart(product: ProductWithVariants, variant: (ProductVariant & { flavors?: { name: string } | null }) | null) {
    const price = getEffectivePrice(product, variant);
    const existingIdx = cartItems.findIndex((i) => i.product.id === product.id && i.variant?.id === variant?.id);
    if (existingIdx >= 0) {
      updateQty(cartItems[existingIdx].id, cartItems[existingIdx].quantity + 1);
    } else {
      setCartItems((prev) => [...prev, { id: generateCartItemId(), product, variant: variant as ProductVariant | null, quantity: 1, unit_price: price, discount_amount: 0, line_total: price }]);
    }
    setVariantPickerProduct(null);
  }

  const updateQty = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) { setCartItems((prev) => prev.filter((i) => i.id !== itemId)); return; }
    setCartItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: qty, line_total: +(i.unit_price * qty - i.discount_amount).toFixed(2) } : i));
  }, []);

  const updateDiscount = useCallback((itemId: string, discount: number) => {
    setCartItems((prev) => prev.map((i) => i.id === itemId ? { ...i, discount_amount: discount, line_total: +(i.unit_price * i.quantity - discount).toFixed(2) } : i));
  }, []);

  const removeItem = useCallback((itemId: string) => { setCartItems((prev) => prev.filter((i) => i.id !== itemId)); }, []);

  function clearCart() { setCartItems([]); setPaymentType("cash"); setCashTendered(""); setGcashAmount(""); setNotes(""); }

  function handleProductClick(product: ProductWithVariants) {
    const active = product.product_variants?.filter((v) => v.is_active && v.stock > 0) ?? [];
    if (active.length === 1) addToCart(product, active[0]);
    else if (active.length > 1) setVariantPickerProduct(product);
    else if (active.length === 0 && product.product_variants.length === 0) addToCart(product, null);
  }

  async function handleCheckout() {
    setSubmitting(true);
    try {
      const cash = parseFloat(cashTendered) || 0;
      const gcash = parseFloat(gcashAmount) || 0;
      let finalCash: number | null = null, finalGcash: number | null = null, finalChange = 0;
      if (paymentType === "cash") { finalCash = cash || cartTotals.total; finalChange = Math.max(0, finalCash - cartTotals.total); }
      else if (paymentType === "gcash") { finalGcash = gcash || cartTotals.total; }
      else if (paymentType === "mixed") { finalCash = cash; finalGcash = gcash; finalChange = Math.max(0, (cash + gcash) - cartTotals.total); }

      // Save sale first
      const res = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems, payment_type: paymentType, subtotal: cartTotals.subtotal, discount_amount: cartTotals.discount_amount, total_amount: cartTotals.total, cash_tendered: paymentType !== "gcash" ? finalCash : null, gcash_amount: paymentType !== "cash" ? finalGcash : null, change_amount: +finalChange.toFixed(2), notes }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error ?? "Failed to save sale"); setSubmitting(false); return; }
      const sale = await res.json();

      // PayMongo for GCash payments
      if (paymentType === "gcash" && process.env.NEXT_PUBLIC_PAYMONGO_ENABLED === "true") {
        const pmRes = await fetch("/api/paymongo/source", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cartTotals.total, description: `Sale #${sale.id.substring(0, 8)}` }),
        });
        if (!pmRes.ok) { const err = await pmRes.json(); alert("PayMongo: " + (err.error ?? "Failed")); setSubmitting(false); return; }
        const { sourceId, checkoutUrl } = await pmRes.json();
        localStorage.setItem("paymongo_pending", JSON.stringify({ sourceId, saleId: sale.id, amount: cartTotals.total }));
        clearCart(); setCheckoutOpen(false);
        window.open(checkoutUrl, "_blank");
        setToastMsg("Complete payment in GCash window"); setToastOpen(true);
        notify("sales");
        notify("dashboard");
        setSubmitting(false);
        return;
      }

      // Regular (cash/mixed) - show receipt
      notify("sales");
      notify("dashboard");
      setCompletedSale({ ...sale, items: cartItems, subtotal: cartTotals.subtotal, discount_amount: cartTotals.discount_amount, total_amount: cartTotals.total });
      setToastMsg(`Sale complete! Total: ${formatCurrency(cartTotals.total)}`); setToastOpen(true);
      clearCart(); setCheckoutOpen(false); loadProducts();
    } finally { setSubmitting(false); }
  }

  // Check for returning PayMongo payment
  useEffect(() => {
    const pending = localStorage.getItem("paymongo_pending");
    if (pending) {
      const { sourceId, saleId, amount } = JSON.parse(pending);
      localStorage.removeItem("paymongo_pending");
      (async () => {
        try {
          const pmRes = await fetch("/api/paymongo/confirm", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceId, amount, saleId, description: `Sale #${saleId.substring(0, 8)}` }),
          });
          if (pmRes.ok) {
            notify("sales");
            notify("dashboard");
            setToastMsg("GCash payment confirmed!");
          } else {
            const err = await pmRes.json();
            setToastMsg("Payment pending - check GCash app");
          }
          setToastOpen(true);
          loadProducts();
        } catch { /* ignore */ }
      })();
    }
  }, []);

  const changeAmount = (() => {
    const cash = parseFloat(cashTendered) || 0, gcash = parseFloat(gcashAmount) || 0;
    if (paymentType === "cash") return Math.max(0, +(cash - cartTotals.total).toFixed(2));
    if (paymentType === "mixed") return Math.max(0, +((cash + gcash) - cartTotals.total).toFixed(2));
    return 0;
  })();

  const canCheckout = cartItems.length > 0 && (() => {
    if (paymentType === "gcash") { const g = parseFloat(gcashAmount); return !gcashAmount || g >= cartTotals.total; }
    if (paymentType === "mixed") { return (parseFloat(cashTendered) || 0) + (parseFloat(gcashAmount) || 0) >= cartTotals.total; }
    const c = parseFloat(cashTendered); return !cashTendered || c >= cartTotals.total;
  })();

  const TYPE_FILTERS = [{ value: "all", label: "All" }, { value: "device", label: "Devices" }, { value: "juice", label: "E-Liquids" }, { value: "pod", label: "Pods" }, { value: "disposable", label: "Disposables" }];

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-3.5rem)] -m-3 md:-m-6 overflow-hidden pb-14 md:pb-0">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-[var(--color-border-default)]">
        <div className="flex flex-col gap-3 p-4 border-b border-[var(--color-border-default)] shrink-0 bg-[var(--color-surface-raised)]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input ref={searchRef} id="pos-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU..." className="input pl-9 bg-[var(--color-surface-base)] border-[var(--color-border-default)]" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"><X size={14} /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {TYPE_FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => setFilterType(value)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border", filterType === value ? "bg-brand-500/10 text-brand-400 border-brand-500/30" : "bg-transparent text-[var(--color-text-tertiary)] border-transparent")}>{label}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3"><Search size={40} className="text-[var(--color-text-tertiary)]/30" /><p className="text-[var(--color-text-tertiary)]">No products found</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
              {products.map((product) => {
                const totalStock = product.product_variants?.reduce((s: number, v: any) => s + v.stock, 0) ?? 0;
                const outOfStock = totalStock === 0 && product.product_variants.length > 0;
                return (
                  <button key={product.id} onClick={() => !outOfStock && handleProductClick(product)} disabled={outOfStock} className={cn("flex flex-col rounded-xl border p-0 text-left transition-all cursor-pointer overflow-hidden bg-[var(--color-surface-base)] border-[var(--color-border-default)] hover:border-brand-400/30 hover:shadow-lg hover:-translate-y-0.5", outOfStock && "opacity-50 cursor-not-allowed")}>
                    <div className="relative w-full aspect-square bg-[var(--color-surface-root)]">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-[var(--color-text-tertiary)]/30" /></div>}
                      <span className={cn("absolute top-2 left-2 badge", PRODUCT_TYPE_COLORS[product.type])}>{PRODUCT_TYPE_LABELS[product.type]}</span>
                      {outOfStock && <span className="absolute top-2 right-2 badge badge-danger text-[10px]">Out</span>}
                    </div>
                    <div className="p-2.5 flex flex-col flex-1 min-h-0">
                      <p className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)] leading-tight line-clamp-2">{product.name}</p>
                      <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-0.5">{(product.brands as any)?.name}</p>
                      {(() => {
                        const flavors = product.product_variants?.map((v: any) => v.flavors?.name).filter((n: string, i: number, arr: string[]) => n && arr.indexOf(n) === i).slice(0, 3) as string[];
                        if (!flavors.length) return null;
                        const extra = product.product_variants.length > 3 ? product.product_variants.length - 3 : 0;
                        return <div className="flex flex-wrap gap-1 mt-1.5">{flavors.map((f: string) => <span key={f} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04] text-[var(--color-text-tertiary)] leading-none truncate max-w-[80px]">{f}</span>)}{extra > 0 && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04] text-[var(--color-text-tertiary)] leading-none">+{extra}</span>}</div>;
                      })()}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="text-[0.8125rem] font-bold text-brand-400">{formatCurrency(product.base_price)}</p>
                        <p className="text-[0.65rem] text-[var(--color-text-tertiary)]">{product.product_variants.length > 1 ? `${product.product_variants.length} vars` : totalStock > 0 ? `${totalStock}` : ""}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="flex flex-col w-full md:w-80 lg:w-96 shrink-0 bg-[var(--color-surface-raised)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-brand-400" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Cart</span>
            {cartItems.length > 0 && <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white bg-brand-500">{cartItems.length}</span>}
          </div>
          {cartItems.length > 0 && <button onClick={clearCart} className="text-xs flex items-center gap-1 text-red-400"><Trash2 size={12} /> Clear</button>}
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40"><ShoppingCart size={40} className="text-[var(--color-text-tertiary)]" /><p className="text-sm text-[var(--color-text-tertiary)]">Cart is empty</p></div>
          ) : (
            cartItems.map((item) => <CartItemRow key={item.id} item={item} onQtyChange={(q) => updateQty(item.id, q)} onDiscountChange={(d) => updateDiscount(item.id, d)} onRemove={() => removeItem(item.id)} />)
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-[var(--color-border-default)] shrink-0">
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex justify-between text-sm text-[var(--color-text-secondary)]"><span>Subtotal</span><span>{formatCurrency(cartTotals.subtotal)}</span></div>
              {cartTotals.discount_amount > 0 && <div className="flex justify-between text-sm text-[var(--color-success)]"><span>Discount</span><span>-{formatCurrency(cartTotals.discount_amount)}</span></div>}
              <div className="divider my-1" />
              <div className="flex justify-between font-bold"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-lg text-brand-400">{formatCurrency(cartTotals.total)}</span></div>
            </div>
            <button id="checkout-btn" onClick={() => setCheckoutOpen(true)} className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingCart size={18} />
                Proceed to Checkout · {formatCurrency(cartTotals.total)}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>

      {/* Variant Picker */}
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300", variantPickerProduct ? "bg-black/70 backdrop-blur-sm" : "bg-transparent pointer-events-none")} onClick={() => setVariantPickerProduct(null)}>
        <div className={cn("card-glass w-full max-w-sm max-h-[85vh] flex flex-col p-5 mx-auto my-auto transition-all duration-300", variantPickerProduct ? "opacity-100 scale-100" : "opacity-0 scale-95")} onClick={(e) => e.stopPropagation()}>
          {variantPickerProduct && <>
            <div className="flex items-center justify-between mb-4 shrink-0"><h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{variantPickerProduct.name}</h3><button onClick={() => setVariantPickerProduct(null)} className="text-[var(--color-text-tertiary)]"><X size={18} /></button></div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3 shrink-0">Select a variant:</p>
            <div className="flex flex-col gap-2 overflow-y-auto min-h-0 flex-1">
              {variantPickerProduct.product_variants.filter((v: any) => v.is_active).map((variant: any) => (
                <button key={variant.id} onClick={() => addToCart(variantPickerProduct, variant)} disabled={variant.stock <= 0} className={cn("flex items-center justify-between p-3 rounded-lg text-sm transition-all border bg-[var(--color-surface-base)] border-[var(--color-border-default)]", variant.stock <= 0 ? "opacity-40 cursor-not-allowed" : "hover:border-brand-500/50 cursor-pointer")}>
                  <div className="text-left"><p className="font-medium text-[var(--color-text-primary)]">{getVariantLabel(variant)}</p><p className={cn("text-xs mt-0.5", variant.stock <= 0 ? "text-[var(--color-danger)]" : "text-[var(--color-text-tertiary)]")}>{variant.stock <= 0 ? "Out of stock" : `${variant.stock} in stock`}</p></div>
                  <p className="font-bold text-brand-400">{formatCurrency(getEffectivePrice(variantPickerProduct, variant))}</p>
                </button>
              ))}
            </div>
          </>}
        </div>
      </div>

      {/* Checkout Modal */}
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300", checkoutOpen ? "bg-black/80 backdrop-blur-sm" : "bg-transparent pointer-events-none")} onClick={() => setCheckoutOpen(false)}>
        <div className={cn("card-glass w-full max-w-md max-h-[85vh] overflow-y-auto p-6 mx-auto my-auto transition-all duration-300", checkoutOpen ? "opacity-100 scale-100" : "opacity-0 scale-95")} onClick={(e) => e.stopPropagation()}>
          {checkoutOpen && <>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-[var(--color-text-primary)]">Checkout</h3><button onClick={() => setCheckoutOpen(false)} className="text-[var(--color-text-tertiary)]"><X size={20} /></button></div>
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3.5 mb-5">
              <div className="flex justify-between text-sm mb-1 text-[var(--color-text-secondary)]"><span>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span><span>{formatCurrency(cartTotals.subtotal)}</span></div>
              {cartTotals.discount_amount > 0 && <div className="flex justify-between text-sm mb-1 text-[var(--color-success)]"><span>Discount</span><span>-{formatCurrency(cartTotals.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-[var(--color-border-default)]"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-brand-400">{formatCurrency(cartTotals.total)}</span></div>
            </div>
            <div className="mb-4"><p className="text-xs font-semibold mb-2 text-[var(--color-text-tertiary)] uppercase tracking-wider">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "gcash", "mixed"] as PaymentType[]).map((type) => (
                  <button key={type} onClick={() => setPaymentType(type)} className={cn("flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all border", paymentType === type ? type === "gcash" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-brand-500/10 border-brand-500/30 text-brand-400" : "bg-[var(--color-surface-base)] border-transparent text-[var(--color-text-tertiary)]")}><span className="text-lg">{PAYMENT_TYPE_ICONS[type]}</span>{PAYMENT_TYPE_LABELS[type]}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-5">
              {(paymentType === "cash" || paymentType === "mixed") && <div><label className="text-xs font-medium mb-1.5 block text-[var(--color-text-secondary)]">Cash Amount (₱)</label><input type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} placeholder={formatCurrency(cartTotals.total)} className="input" min={0} />{(paymentType === "cash" || paymentType === "mixed") && parseFloat(cashTendered) > 0 && <p className={cn("text-xs mt-1.5 font-medium", changeAmount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-secondary)]")}>Change: {formatCurrency(changeAmount)}</p>}</div>}
              {(paymentType === "gcash" || paymentType === "mixed") && <div><label className="text-xs font-medium mb-1.5 block text-[var(--color-text-secondary)]">GCash Amount (₱)</label><input type="number" value={gcashAmount} onChange={(e) => setGcashAmount(e.target.value)} placeholder={formatCurrency(cartTotals.total)} className="input" min={0} /></div>}
              <div><label className="text-xs font-medium mb-1.5 block text-[var(--color-text-secondary)]">Notes (optional)</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note..." className="input" /></div>
            </div>
            <button id="confirm-sale-btn" onClick={handleCheckout} disabled={submitting || !canCheckout} className={cn("relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white transition-all duration-300 group", (!canCheckout || submitting) ? "opacity-40 cursor-not-allowed bg-[var(--color-surface-base)] border border-[var(--color-border-default)]" : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0")}>
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                {submitting ? (
                  <><svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> Processing...</>
                ) : (
                  <><CheckCircle size={20} /> Confirm Sale · {formatCurrency(cartTotals.total)}</>
                )}
              </span>
              {!submitting && canCheckout && <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
              {canCheckout && !submitting && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />}
            </button>
          </>}
        </div>
      </div>

      {completedSale && <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />}

      {/* Processing overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] shadow-2xl animate-scale-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
              <CheckCircle size={24} className="absolute inset-0 m-auto text-brand-400 opacity-0" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Processing Sale</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} type="success" open={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}

// ── CartItemRow ──
const CartItemRow = memo(function CartItemRow({ item, onQtyChange, onDiscountChange, onRemove }: { item: CartItem; onQtyChange: (qty: number) => void; onDiscountChange: (discount: number) => void; onRemove: () => void }) {
  const [showDiscount, setShowDiscount] = useState(false);
  return (
    <div className="rounded-lg border p-3 bg-[var(--color-surface-base)] border-[var(--color-border-subtle)]">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight truncate">{item.product.name}</p>
          {item.variant && <p className="text-xs mt-0.5 truncate text-[var(--color-text-secondary)]">{getVariantLabel(item.variant as ProductVariant & { flavors?: { name: string } | null })}</p>}
        </div>
        <button onClick={onRemove} className="shrink-0 mt-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]"><X size={14} /></button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <button onClick={() => onQtyChange(item.quantity - 1)} className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 hover:bg-brand-500/25"><Minus size={12} /></button>
          <span className="w-7 text-center text-sm font-semibold text-[var(--color-text-primary)]">{item.quantity}</span>
          <button onClick={() => onQtyChange(item.quantity + 1)} className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 hover:bg-brand-500/25"><Plus size={12} /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDiscount(!showDiscount)} className={cn("flex items-center gap-1 text-xs font-medium", item.discount_amount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]")}><Tag size={11} /> Discount{item.discount_amount > 0 ? ` (-${formatCurrency(item.discount_amount)})` : ""}</button>
          <p className="text-sm font-bold text-brand-400">{formatCurrency(item.line_total)}</p>
        </div>
      </div>
      {showDiscount && (
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[var(--color-border-subtle)]">
          <span className="text-xs text-[var(--color-text-secondary)]">Discount ₱</span>
          <input type="number" value={item.discount_amount || ""} onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)} className="input-sm py-1 px-2 text-xs w-full" placeholder="0.00" min={0} max={item.unit_price * item.quantity} />
        </div>
      )}
    </div>
  );
});
