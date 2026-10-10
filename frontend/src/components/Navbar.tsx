"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useCurrency } from "@/store/useCurrencyStore";
import { ShoppingBag, Sparkles, Terminal } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  onOpenAiAssistant?: () => void;
}

export function Navbar({ onOpenAiAssistant }: NavbarProps) {
  const pathname = usePathname();
  const openCart = useCartStore((state) => state.openCart);
  const getTotalCount = useCartStore((state) => state.getTotalCount);
  
  // Mounted check to avoid hydration mismatch with local storage
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { currency, toggleCurrency } = useCurrency();
  const totalCount = mounted ? getTotalCount() : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
              <Terminal className="w-4 h-4 text-zinc-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-wider text-base text-zinc-100 uppercase">
                KURO // LABS
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                CURATED LIFESTYLE &amp; WORKSPACE ESSENTIALS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Featured
            </Link>
            <Link
              href="/shop"
              className={`text-sm font-medium transition-colors ${
                pathname === "/shop"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Catalog
            </Link>
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Recommender Button */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-200 hover:text-white text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Assistant</span>
            </button>
          )}

          {/* Currency Toggle Switcher Pill */}
          <button
            onClick={toggleCurrency}
            type="button"
            aria-label={`Toggle currency switcher: currently ${mounted ? currency : "USD"}`}
            title="Toggle between USD ($) and INR (₹)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:bg-zinc-850 text-xs font-mono font-medium text-zinc-200 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-zinc-100">
              {mounted ? (currency === "USD" ? "USD ($)" : "INR (₹)") : "USD ($)"}
            </span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex items-center gap-2.5 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-100 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm font-medium"
          >
            <ShoppingBag className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium hidden sm:inline">Cart</span>
            {mounted && totalCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-mono font-semibold bg-white text-zinc-950 rounded-full animate-in zoom-in-75 duration-150">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
