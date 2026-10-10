"use client";

import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useCurrency } from "@/store/useCurrencyStore";
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export function CartDrawer({ onProceedToCheckout }: CartDrawerProps) {
  const { formatPrice } = useCurrency();
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotalCents = useCartStore((state) => state.getSubtotalCents);
  const getTotalCount = useCartStore((state) => state.getTotalCount);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const subtotalCents = getSubtotalCents();
  const totalCount = getTotalCount();

  const handleCheckoutClick = () => {
    closeCart();
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950/80 backdrop-blur-md border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-zinc-100" />
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Your Cart</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition-colors px-2 py-1"
                >
                  Clear
                </button>
              )}
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-850">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1">Your cart is empty</h3>
                <p className="text-xs text-zinc-400 max-w-xs mb-6">
                  Add precision-engineered hardware and desk accessories to begin.
                </p>
                <button
                  onClick={closeCart}
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:text-white transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const isAtMaxStock = quantity >= product.stock_quantity;

                return (
                  <div key={product.id} className="py-4 flex gap-4 group">
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-zinc-100 line-clamp-1">
                            {product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-zinc-400 hover:text-rose-400 transition-colors p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                          {product.category}
                        </p>
                      </div>

                      {/* Stock ceiling warning if reached */}
                      {isAtMaxStock && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400/90 my-1">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          <span>Max stock reached ({product.stock_quantity})</span>
                        </div>
                      )}

                      {/* Controls and Price */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-medium text-zinc-200">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={isAtMaxStock}
                            className={`w-7 h-7 flex items-center justify-center transition-colors ${
                              isAtMaxStock
                                ? "text-zinc-600 cursor-not-allowed"
                                : "text-zinc-400 hover:text-white cursor-pointer"
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-sm font-mono font-semibold text-zinc-100" suppressHydrationWarning>
                            {formatPrice(product.price_cents * quantity)}
                          </span>
                          {quantity > 1 && (
                            <div className="text-[10px] font-mono text-zinc-400" suppressHydrationWarning>
                              {formatPrice(product.price_cents)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/80 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Shipping</span>
                  <span className="font-mono text-zinc-300">Free / Priority</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">Subtotal</span>
                  <span className="text-xl font-mono font-semibold text-zinc-100" suppressHydrationWarning>
                    {formatPrice(subtotalCents)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-zinc-400 tracking-wide">
                Atomic stock verification applied upon checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
