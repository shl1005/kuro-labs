"use client";

import { useState } from "react";
import Image from "next/image";
import { sendChatMessage } from "@/lib/api";
import { useCurrency } from "@/store/useCurrencyStore";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { Sparkles, X, Send, Loader2, Plus, Check, Bot } from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  "Mechanical keyboard under $250",
  "Noise-canceling headphones",
  "Gaming gear under $100",
  "Desk mat for clean workspace",
];

export function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const { formatPrice } = useCurrency();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const addItem = useCartStore((state) => state.addItem);

  if (!isOpen) return null;

  const handleSend = async (userPrompt?: string) => {
    const textToSend = (userPrompt || message).trim();
    if (!textToSend || isLoading) return;

    if (userPrompt) {
      setMessage(userPrompt);
    }

    setIsLoading(true);
    setReply(null);
    setSuggestedProducts([]);

    try {
      const response = await sendChatMessage(textToSend);
      setReply(response.reply);
      setSuggestedProducts(response.suggested_products || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get AI recommendation";
      setReply(`Sorry, I encountered an issue: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const success = addItem(product, 1);
    if (success) {
      setAddedIds((prev) => [...prev, product.id]);
      setTimeout(() => {
        setAddedIds((prev) => prev.filter((id) => id !== product.id));
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>Hardware Assistant</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    INTENT AI
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Ask for budget constraints, product categories, or ergonomic needs
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              aria-label="Close AI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-5 space-y-4">
            {/* Quick prompt suggestions */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                Sample Inquiries:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation / Results */}
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs font-mono text-zinc-400">
                  Parsing intent, budget constraints, and checking inventory...
                </p>
              </div>
            )}

            {!isLoading && reply && (
              <div className="space-y-4 animate-in fade-in">
                {/* Assistant message */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 flex gap-3 text-xs leading-relaxed text-zinc-200">
                  <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-wrap">{reply}</div>
                </div>

                {/* Suggested Products Cards */}
                {suggestedProducts.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                      Matching Hardware ({suggestedProducts.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestedProducts.map((p) => {
                        const isAdded = addedIds.includes(p.id);
                        const isSoldOut = p.stock_quantity === 0;

                        return (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                          >
                            <div className="flex gap-3 mb-2">
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                                <Image
                                  src={p.image_url}
                                  alt={p.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-medium text-zinc-100 truncate">
                                  {p.name}
                                </h4>
                                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                                  {p.category}
                                </span>
                                <div className="text-xs font-mono font-semibold text-zinc-200 mt-1" suppressHydrationWarning>
                                  {formatPrice(p.price_cents)}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(p)}
                              disabled={isSoldOut}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                isSoldOut
                                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                  : isAdded
                                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                                  : "bg-white text-zinc-950 hover:bg-zinc-200 cursor-pointer"
                              }`}
                            >
                              {isSoldOut ? (
                                <span>Sold Out</span>
                              ) : isAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Add to Cart</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="pt-3 border-t border-zinc-850 flex gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Wireless keyboard under $200 with quiet switches"
              className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-4 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
