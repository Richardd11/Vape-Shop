"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ReferenceDataFormProps {
  type: "brands" | "categories" | "flavors";
  items: { id: string; name: string }[];
}

export default function ReferenceDataForm({ type, items }: ReferenceDataFormProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reference/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setAdding(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add item");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reference/${type}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Realtime will handle UI update
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete item (likely in use)");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {adding ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input py-1.5 text-sm flex-1"
            placeholder="Name..."
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="btn btn-brand py-1.5 px-3">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          </button>
          <button type="button" onClick={() => setAdding(false)} disabled={loading} className="btn btn-ghost py-1.5 px-3">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-dashed border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-base)] transition-all text-sm font-medium justify-center"
        >
          <Plus size={16} /> Add New
        </button>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-default)] group">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</span>
            <button
              onClick={() => setConfirmDelete({ id: item.id, name: item.name })}
              disabled={deletingId === item.id}
              className="text-[var(--color-text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
            >
              {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        ))}
        {items.length === 0 && !adding && (
          <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-4">No items found.</p>
        )}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title={`Delete ${type.slice(0, -1)}`}
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will fail if products are using this ${type.slice(0, -1)}.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deletingId === confirmDelete?.id}
      />
    </div>
  );
}
