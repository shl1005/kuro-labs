"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { checkoutOrder } from "@/lib/api";
import { useCurrency } from "@/store/useCurrencyStore";
import { OrderResponse } from "@/types";
import { X, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowUpRight, ShieldCheck, Mail, User, Check, Package, Truck } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { formatPrice } = useCurrency();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotalCents = useCartStore((state) => state.getSubtotalCents);
  const showToast = useCartStore((state) => state.showToast);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null);

  if (!isOpen) return null;

  const subtotalCents = getSubtotalCents();

  const handleClose = () => {
    if (confirmedOrder) {
      clearCart();
      setConfirmedOrder(null);
    }
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      };

      const result = await checkoutOrder(payload);

      if (result.success && result.data) {
        setConfirmedOrder(result.data);
        clearCart();
        showToast(`Order #${result.data.id} confirmed successfully!`, "success");
      } else {
        const err = result.error || "Failed to process order";
        setErrorMessage(err);
        if (result.status === 409) {
          showToast(`Stock Conflict: ${err}`, "error");
        } else {
          showToast(err, "error");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected checkout error";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in"
        onClick={handleClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300 ease-out">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            aria-label="Close checkout modal"
          >
            <X className="w-4 h-4" />
          </button>

          {confirmedOrder ? (
            /* Order Confirmed Screen & Stepper */
            (() => {
              const orderHash = `ORD-${(84900 + confirmedOrder.id).toString()}X`;
              return (
                <div className="text-center py-2 space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                      Transaction Verified
                    </span>
                    <h3 className="text-2xl font-semibold text-zinc-100 tracking-tight mt-1">
                      Order Confirmed
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Receipt and tracking dispatched to{" "}
                      <span className="text-zinc-200 font-mono">{confirmedOrder.customer_email}</span>
                    </p>
                  </div>

                  {/* 3-Step Fulfillment Progress Bar Stepper */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5 text-left flex justify-between items-center">
                      <span>Fulfillment Pipeline</span>
                      <span className="text-emerald-400 font-semibold">Step 1 of 3</span>
                    </div>
                    <div className="relative flex items-center justify-between px-2">
                      {/* Connecting line */}
                      <div className="absolute top-3 left-6 right-6 h-0.5 bg-zinc-800 -z-0" />
                      <div className="absolute top-3 left-6 w-1/4 h-0.5 bg-emerald-500 -z-0 transition-all duration-500" />

                      {/* Step 1: Confirmed (Active) */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-xs font-bold ring-4 ring-zinc-950 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-400 mt-1">Confirmed</span>
                        <span className="text-[9px] font-mono text-emerald-300/80">Active</span>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center justify-center text-[10px] font-mono ring-4 ring-zinc-950">
                          2
                        </div>
                        <span className="text-[11px] font-medium text-zinc-300 mt-1">Processing</span>
                        <span className="text-[9px] font-mono text-zinc-500">Queued</span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-500 flex items-center justify-center text-[10px] font-mono ring-4 ring-zinc-950">
                          3
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400 mt-1">Shipped</span>
                        <span className="text-[9px] font-mono text-zinc-500">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Receipt Details */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 text-left space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span>ORDER HASH</span>
                      <span className="font-semibold text-emerald-400 tracking-wider">{orderHash}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span>ORDER ID</span>
                      <span className="font-semibold text-zinc-100">#{confirmedOrder.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span>CUSTOMER</span>
                      <span className="text-zinc-200">{confirmedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span>STATUS</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-sans text-[11px] font-medium">
                        {confirmedOrder.status}
                      </span>
                    </div>

                    {/* Items Purchased List */}
                    <div className="border-b border-zinc-800/80 pb-2 pt-1">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">
                        Items Purchased ({confirmedOrder.items?.length || 0})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto divide-y divide-zinc-850">
                        {confirmedOrder.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-zinc-300 pt-1">
                            <span className="truncate pr-2 font-sans text-[11px]">
                              {item.quantity}× {item.product?.name || `Product #${item.product_id}`}
                            </span>
                            <span className="font-mono text-zinc-400 shrink-0" suppressHydrationWarning>
                              {formatPrice(item.unit_price_cents * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-zinc-200 pt-1 text-sm font-semibold">
                      <span>TOTAL PAID</span>
                      <span className="text-emerald-400 font-mono" suppressHydrationWarning>
                        {formatPrice(confirmedOrder.total_cents)}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Track in Admin & Continue Shopping */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href="/admin"
                      onClick={handleClose}
                      className="flex-1 py-2.5 px-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <span>Track in Admin Console</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                    </Link>

                    <button
                      onClick={handleClose}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Checkout Form */
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Secure Checkout</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">
                  Complete Your Order
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Provide your recipient details for inventory allocation and shipping confirmation.
                </p>
              </div>

              {/* Inline Error Toast / Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-900/70 bg-rose-950/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-semibold block text-rose-200">Checkout Error</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Order Summary Overview */}
              <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex justify-between">
                  <span>Summary ({items.length} items)</span>
                  <span>Amount</span>
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-zinc-850 text-xs">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="py-1.5 flex justify-between items-center text-zinc-300">
                      <span className="truncate pr-2">
                        {quantity}× {product.name}
                      </span>
                      <span className="font-mono text-zinc-400 shrink-0" suppressHydrationWarning>
                        {formatPrice(product.price_cents * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-semibold">
                  <span className="text-zinc-200">Total</span>
                  <span className="font-mono text-zinc-100" suppressHydrationWarning>{formatPrice(subtotalCents)}</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="customerName" className="block text-xs font-medium text-zinc-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Hunter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="customerEmail" className="block text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customerEmail"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading || items.length === 0}
                    className="w-full py-3 px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Stock &amp; Processing...</span>
                      </>
                    ) : (
                      <>
                        <span suppressHydrationWarning>Confirm &amp; Place Order ({formatPrice(subtotalCents)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
