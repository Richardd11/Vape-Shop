"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, Upload, ImageIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_HAS_FLAVOR,
  PRODUCT_TYPE_HAS_NICOTINE,
  PRODUCT_TYPE_HAS_SIZE,
  NICOTINE_OPTIONS,
} from "@/lib/utils";
import type { ProductType } from "@/lib/types";

interface ReferenceItem {
  id: string;
  name: string;
}

interface ProductFormProps {
  brands: ReferenceItem[];
  categories: ReferenceItem[];
  flavors: ReferenceItem[];
}

export default function ProductForm({ brands, categories, flavors }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core product details
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<ProductType>("device");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("5");

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Variants
  const [variants, setVariants] = useState<any[]>([]);

  function addVariant() {
    setVariants([
      ...variants,
      {
        id: crypto.randomUUID(),
        flavor_id: "",
        nicotine_strength: "",
        size_ml: "",
        puff_count: "",
        device_compat: "",
        sku_variant: "",
        price_override: "",
        stock: "0",
      },
    ]);
  }

  function updateVariant(id: string, field: string, value: string) {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  function removeVariant(id: string) {
    setVariants(variants.filter((v) => v.id !== id));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err: any) {
      throw new Error(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Upload image first
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const formattedVariants = variants.map((v) => ({
        flavor_id: v.flavor_id || null,
        nicotine_strength: v.nicotine_strength || null,
        size_ml: v.size_ml ? Number(v.size_ml) : null,
        puff_count: v.puff_count ? Number(v.puff_count) : null,
        device_compat: v.device_compat || null,
        sku_variant: v.sku_variant || null,
        price_override: v.price_override ? Number(v.price_override) : null,
        stock: Number(v.stock),
      }));

      const payload = {
        name,
        brand_id: brandId,
        category_id: categoryId,
        type,
        sku: sku || null,
        base_price: Number(basePrice),
        cost_price: costPrice ? Number(costPrice) : null,
        low_stock_alert: Number(lowStockAlert),
        image_url: imageUrl,
        variants: formattedVariants,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/inventory");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Product Image Upload */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Product Image</label>
        {imagePreview ? (
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-[var(--color-border-default)]">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-40 h-40 rounded-xl border-2 border-dashed border-[var(--color-border-default)] flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)] hover:border-brand-400/40 hover:text-brand-400 transition-all"
          >
            <ImageIcon size={28} />
            <span className="text-xs">Upload Image</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <p className="text-[0.65rem] text-[var(--color-text-tertiary)] mt-1.5">JPEG, PNG or WebP. Max 5MB.</p>
      </div>

      <div className="divider" />

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Product Name *</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g. Xros 3 Pod Kit"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Product Type *</label>
          <select
            required
            value={type}
            onChange={(e) => {
              setType(e.target.value as ProductType);
              setVariants([]); // Reset variants on type change
            }}
            className="input"
          >
            {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {PRODUCT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Brand *</label>
          <select
            required
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="input"
          >
            <option value="" className="bg-slate-900 text-slate-400">Select Brand...</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Category *</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="" className="bg-slate-900 text-slate-400">Select Category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="divider" />

      {/* Pricing & Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Base Price (₱) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Cost Price (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="input"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="input"
            placeholder="Auto-generated if empty"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Low Stock Alert *</label>
          <input
            required
            type="number"
            min="0"
            value={lowStockAlert}
            onChange={(e) => setLowStockAlert(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="divider" />

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Variants</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">Add flavors, colors, or sizes</p>
          </div>
          <button type="button" onClick={addVariant} className="btn btn-ghost py-1.5 text-xs">
            <Plus size={14} /> Add Variant
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="p-6 border border-dashed border-[var(--color-border-default)] rounded-xl text-center text-[var(--color-text-tertiary)] text-sm">
            No variants added. Product will be treated as a single item.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {variants.map((v, index) => (
              <div key={v.id} className="p-4 bg-[var(--color-surface-base)] border border-[var(--color-border-default)] rounded-xl relative group">
                <button
                  type="button"
                  onClick={() => removeVariant(v.id)}
                  className="absolute top-3 right-3 text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-xs font-semibold text-indigo-400 mb-3 uppercase tracking-wider">
                  Variant {index + 1}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {PRODUCT_TYPE_HAS_FLAVOR[type] && (
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Flavor</label>
                      <select
                        value={v.flavor_id}
                        onChange={(e) => updateVariant(v.id, "flavor_id", e.target.value)}
                        className="input py-1.5 text-sm"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">None</option>
                        {flavors.map((f) => (
                          <option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {PRODUCT_TYPE_HAS_NICOTINE[type] && (
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Nicotine</label>
                      <select
                        value={v.nicotine_strength}
                        onChange={(e) => updateVariant(v.id, "nicotine_strength", e.target.value)}
                        className="input py-1.5 text-sm"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">None</option>
                        {NICOTINE_OPTIONS.map((n) => (
                          <option key={n} value={n} className="bg-slate-900 text-white">{n}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {PRODUCT_TYPE_HAS_SIZE[type] && (
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Size (ml)</label>
                      <input
                        type="number"
                        min="0"
                        value={v.size_ml}
                        onChange={(e) => updateVariant(v.id, "size_ml", e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="e.g. 30"
                      />
                    </div>
                  )}

                  {type === "disposable" && (
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Puff Count</label>
                      <input
                        type="number"
                        min="0"
                        value={v.puff_count}
                        onChange={(e) => updateVariant(v.id, "puff_count", e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="e.g. 5000"
                      />
                    </div>
                  )}

                  {type === "pod" && (
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Device Compat</label>
                      <input
                        type="text"
                        value={v.device_compat}
                        onChange={(e) => updateVariant(v.id, "device_compat", e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="e.g. Relx Infinity"
                      />
                    </div>
                  )}

                  {type === "device" && (
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Variant Name / Color</label>
                      <input
                        type="text"
                        value={v.sku_variant}
                        onChange={(e) => updateVariant(v.id, "sku_variant", e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="e.g. Matte Black"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Initial Stock *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                      className="input py-1.5 text-sm font-semibold text-indigo-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--color-text-secondary)] mb-1 block">Price Override (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price_override}
                      onChange={(e) => updateVariant(v.id, "price_override", e.target.value)}
                      className="input py-1.5 text-sm"
                      placeholder="Same as base"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[var(--color-border-default)] flex justify-end gap-3 mt-2">
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn btn-brand min-w-[140px]">
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> {uploading ? "Uploading image..." : "Saving..."}</>
          ) : (
            <><Save size={16} /> Save Product</>
          )}
        </button>
      </div>
    </form>
  );
}
