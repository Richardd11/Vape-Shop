"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  open: boolean;
  onClose: () => void;
  duration?: number;
}

const configs = {
  success: { icon: CheckCircle, bg: "bg-green-500/15", border: "border-green-500/30", text: "text-green-400" },
  error:   { icon: XCircle,      bg: "bg-red-500/15",   border: "border-red-500/30",   text: "text-red-400" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400" },
  info:    { icon: Info,         bg: "bg-brand-500/15",  border: "border-brand-500/30",  text: "text-brand-400" },
};

export default function Toast({ message, type = "success", open, onClose, duration = 4000 }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!mounted || !open) return null;

  const cfg = configs[type];
  const Icon = cfg.icon;

  return createPortal(
    <div className="fixed top-6 right-6 z-[300] animate-slide-up">
      <div className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-lg",
        cfg.bg, cfg.border
      )}>
        <Icon size={18} className={cn(cfg.text, "shrink-0")} />
        <p className={cn("text-sm font-medium", cfg.text)}>{message}</p>
        <button
          onClick={onClose}
          className={cn("ml-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity", cfg.text)}
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
}
