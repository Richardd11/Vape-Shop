"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, ImageIcon, X, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_TYPE_LABELS } from "@/lib/utils";
import type { ProductType } from "@/lib/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ReferenceItem {
  id: string;
  name: string;
}

interface EditProductFormProps {
  product: any;
  brands: ReferenceItem[];
  categories: ReferenceItem[];
}

export default function EditProductForm({ product, brands, categories }: EditProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product.name);
  const [brandId, setBrandId] = useState(product.brand_id);
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [sku, setSku] = useState(product.sku || "");
  const [basePrice, setBasePrice] = useState(product.base_price.toString());
  const [costPrice, setCostPrice] = useState(product.cost_price?.toString() || "");
  const [lowStockAlert, setLowStockAlert] = useState(product.low_stock_alert.toString());
  const [isActive, setIsActive] = useState(product.is_active);

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url || null);
  const [uploading, setUploading] = useState(false);

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
    if (!imageFile) return imagePreview; // Keep existing if no new file
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
      let imageUrl = product.image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          brand_id: brandId,
          category_id: categoryId,
          sku: sku || null,
          base_price: Number(basePrice),
          cost_price: costPrice ? Number(costPrice) : null,
          low_stock_alert: Number(lowStockAlert),
          is_active: isActive,
          image_url: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update product");
      }

      router.push("/inventory");
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Product Image */}
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
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Product Type (Locked)</label>
          <div className="input opacity-50 cursor-not-allowed flex items-center">
            {PRODUCT_TYPE_LABELS[product.type as ProductType]}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Brand *</label>
          <select
            required
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="input"
          >
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
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="input"
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

      <div className="flex items-center gap-3 mt-2 bg-[var(--color-surface-base)] border border-[var(--color-border-default)] rounded-xl p-4 w-max">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer">
          Product is Active (Visible in POS)
        </label>
      </div>

      <div className="pt-4 border-t border-[var(--color-border-default)] flex justify-between items-center mt-2">
        <button type="button" onClick={() => setDeleteConfirmOpen(true)} disabled={deleting} className="btn btn-danger-ghost">
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
          Delete Product
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-brand min-w-[140px]">
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> {uploading ? "Uploading..." : "Saving..."}</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? It will be marked as inactive and hidden from the POS.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </form>
  );
}
