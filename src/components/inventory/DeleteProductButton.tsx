"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete product");
      }
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
        disabled={deleting}
        className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete product"
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productName}"? It will be marked as inactive and hidden from the POS.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
