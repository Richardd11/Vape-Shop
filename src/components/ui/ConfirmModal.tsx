"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
}

const variantStyles = {
  danger:  { iconBg: "bg-red-500/10", iconColor: "text-red-400",   btnClass: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" },
  warning: { iconBg: "bg-amber-500/10", iconColor: "text-amber-400", btnClass: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" },
  info:    { iconBg: "bg-brand-500/10", iconColor: "text-brand-400",  btnClass: "btn btn-brand" },
  success: { iconBg: "bg-green-500/10", iconColor: "text-green-400",  btnClass: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" },
};

export default function ConfirmModal({
  open, onClose, onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const v = variantStyles[variant];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md p-6 rounded-2xl border shadow-2xl animate-scale-in",
          "bg-[var(--color-surface-raised)] border-[var(--color-border-default)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={18} />
        </button>

        <div className={cn("flex items-center justify-center w-14 h-14 rounded-2xl mb-5", v.iconBg)}>
          <AlertTriangle size={26} className={v.iconColor} />
        </div>

        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="btn btn-ghost text-sm" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(v.btnClass, "btn text-sm min-w-[100px]", loading && "opacity-60 pointer-events-none")}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Please wait...</>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
