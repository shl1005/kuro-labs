"use client";

import Image from "next/image";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useCurrency } from "@/store/useCurrencyStore";
import { Check, Plus, AlertOctagon } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;
  const isSoldOut = product.stock_quantity === 0;
  const isLowStock = !isSoldOut && product.stock_quantity <= 3;
  const isAtLimit = !isSoldOut && cartQuantity >= product.stock_quantity;

  const handleAddToCart = () => {
    if (isSoldOut || isAtLimit) return;
    const success = addItem(product, 1);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  };

  return (
    <div className="group rounded-xl transform transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 p-4 flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 mb-4 border border-zinc-800/60">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={product.id <= 4}
          />

          {/* Minimalist Dot Badge (Floating on image) */}
          <div className="absolute top-2.5 left-2.5">
            {isSoldOut ? (
              <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Sold Out
                </span>
              </div>
            ) : isLowStock ? (
              <div className="backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse text-amber-400 bg-amber-950/40 border border-amber-800/50">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                </span>
                <span className="text-[10px] font-medium tracking-wider">
                  Low Stock ({product.stock_quantity})
                </span>
              </div>
            ) : (
              <div className="backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span className="text-[10px] font-medium tracking-wider">
                  In Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Category */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
          <span className="font-mono uppercase text-[11px] tracking-wider text-zinc-400">
            {product.category}
          </span>
          {cartQuantity > 0 && (
            <span className="text-[11px] font-mono text-zinc-400">
              In Cart: {cartQuantity}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-1 mb-1">
          {product.name}
        </h3>

        {/* Product Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {product.description}
        </p>
      </div>

      {/* Card Footer: Price & Add Button */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase text-zinc-400">Price</span>
          <span className="font-mono text-base font-semibold text-white" suppressHydrationWarning>
            {formatPrice(product.price_cents)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isSoldOut || isAtLimit}
          className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all duration-150 ${
            isSoldOut
              ? "bg-zinc-800/60 text-zinc-500 cursor-not-allowed border border-zinc-800"
              : isAtLimit
              ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-750"
              : justAdded
              ? "bg-emerald-500 text-zinc-950 font-semibold hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              : "bg-white text-zinc-950 hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
          }`}
        >
          {isSoldOut ? (
            <span>Sold Out</span>
          ) : isAtLimit ? (
            <>
              <AlertOctagon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Max in Cart</span>
            </>
          ) : justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
