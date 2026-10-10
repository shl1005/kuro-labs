"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export function Toast() {
  const toast = useCartStore((state) => state.toast);
  const clearToast = useCartStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      clearToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
  };

  const borders = {
    error: "border-rose-900/60 bg-zinc-950/95 text-rose-200",
    success: "border-emerald-900/60 bg-zinc-950/95 text-emerald-200",
    info: "border-zinc-800 bg-zinc-950/95 text-zinc-200",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${borders[toast.type]}`}
      >
        {icons[toast.type]}
        <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
        <button
          onClick={clearToast}
          className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
