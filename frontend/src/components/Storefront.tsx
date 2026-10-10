"use client";

import { useState, useEffect, useTransition } from "react";
import { Product } from "@/types";
import { fetchProducts } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { AiAssistantModal } from "@/components/AiAssistantModal";
import { AiConcierge } from "@/components/AiConcierge";
import { Toast } from "@/components/Toast";
import { Search, X, SlidersHorizontal, RefreshCcw, Sparkles } from "lucide-react";

const CATEGORIES = ["All", "Audio", "Keyboards", "Accessories", "Mice"];

interface StorefrontProps {
  initialCategory?: string;
  pageTitle?: string;
}

export function Storefront({ initialCategory = "All", pageTitle }: StorefrontProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Fetch products whenever category changes or search query is submitted
  const loadProducts = async (cat: string, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(cat, search);
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        loadProducts(selectedCategory, searchQuery);
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Navbar */}
      <Navbar onOpenAiAssistant={() => setIsAiModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative border-b border-zinc-800/80 bg-zinc-950/60 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pt-12 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle geometric hairline backdrop effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>KURO LABS // LIFESTYLE &amp; WORKSPACE ESSENTIALS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-100 leading-tight">
              {pageTitle || "Curated Lifestyle & Workspace Essentials."}
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
              Tactile mechanical keyboards, high-fidelity acoustics, and minimalist workstation goods engineered for everyday focus.
            </p>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="mt-8 pt-6 border-t border-zinc-850/80 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by keyword, switch, or feature..."
                className="w-full pl-10 pr-10 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder:text-zinc-400 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-white text-zinc-950 font-medium shadow-sm"
                        : "text-zinc-400 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Product Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]">
        {/* Results Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Showing {loading ? "..." : products.length} {products.length === 1 ? "product" : "products"}
            </span>
            {selectedCategory !== "All" && (
              <span className="font-mono text-[11px] text-zinc-400">
                in <span className="text-zinc-200">{selectedCategory}</span>
              </span>
            )}
            {searchQuery && (
              <span className="font-mono text-[11px] text-zinc-400">
                matching &quot;<span className="text-zinc-200">{searchQuery}</span>&quot;
              </span>
            )}
          </div>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Recommender</span>
          </button>
        </div>

        {/* Loading State: Skeleton Cards */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-rose-900/60 bg-zinc-900/50 p-8 text-center max-w-md mx-auto my-12">
            <p className="text-sm text-rose-300 mb-4">{error}</p>
            <button
              onClick={() => loadProducts(selectedCategory, searchQuery)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-200">No hardware found</h3>
              <p className="text-xs text-zinc-400 mt-1">
                No items match your active filters or keyword search.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400">KURO // LABS</span>
            <span>&bull;</span>
            <span>Curated Lifestyle &amp; Workspace Essentials</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            PORT: 8000 (API) / 3000 (CLIENT)
          </div>
        </div>
      </footer>

      {/* Cart Drawer & Modals */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <AiConcierge />
      <Toast />
    </div>
  );
}
