"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  Send,
  Bot,
  Plus,
  Check,
  Loader2,
  AlertOctagon,
  MessageSquare,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useCurrency } from "@/store/useCurrencyStore";
import { sendChatMessage } from "@/lib/api";
import { Product } from "@/types";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  suggestedProducts?: Product[];
}

const DEFAULT_SUGGESTIONS = [
  "Find accessories under $50",
  "What's in stock?",
  "Mechanical keyboards",
  "Noise-canceling headphones",
];

export function AiConcierge() {
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "assistant",
      text: "Hello! I am your Actionable Hardware Concierge. Ask me about custom mechanical switches, noise-canceling audio, or gear within any budget.",
    },
  ]);
  const [addedProductIds, setAddedProductIds] = useState<number[]>([]);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage("");

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.reply,
        suggestedProducts: response.suggested_products || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to connect to recommendation service.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: `Apologies, I encountered an issue: ${errText}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const success = addItem(product, 1);
    if (success) {
      setAddedProductIds((prev) => [...prev, product.id]);
      setTimeout(() => {
        setAddedProductIds((prev) => prev.filter((id) => id !== product.id));
      }, 1500);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Shopping Concierge"
        className="fixed bottom-6 right-6 z-40 rounded-full bg-zinc-900 border border-zinc-700 text-white p-3 shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer group"
      >
        <span className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-6 h-6 text-zinc-300" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            </>
          )}
        </span>
      </button>

      {/* Sliding Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Shopping Concierge"
          className="fixed bottom-22 right-6 z-40 w-[92vw] sm:w-[420px] max-h-[640px] h-[78vh] rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ease-out"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <span>Hardware Concierge</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                    LIVE
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Natural language inventory &amp; stock assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors"
              aria-label="Close concierge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {/* Suggested Prompt Chips */}
            <div className="space-y-1.5 pb-2 border-b border-zinc-850">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Quick Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Bubble History */}
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl ${
                      isUser
                        ? "bg-zinc-800 text-zinc-100 rounded-tr-sm"
                        : "bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 rounded-tl-sm"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span>CONCIERGE AI</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Interactive Mini-Cards in Assistant Bubble */}
                  {!isUser && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="w-full space-y-2 pt-1 pl-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Recommended Hardware ({msg.suggestedProducts.length}):
                      </span>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.suggestedProducts.map((prod) => {
                          const isSoldOut = prod.stock_quantity === 0;
                          const isAdded = addedProductIds.includes(prod.id);
                          const cartItem = cartItems.find((i) => i.product.id === prod.id);
                          const isAtLimit =
                            !isSoldOut && (cartItem?.quantity || 0) >= prod.stock_quantity;

                          return (
                            <div
                              key={prod.id}
                              className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-colors flex items-center gap-3"
                            >
                              {/* Product Thumbnail */}
                              <div className="relative w-13 h-13 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 shrink-0">
                                <Image
                                  src={prod.image_url}
                                  alt={prod.name}
                                  fill
                                  sizes="52px"
                                  className="object-cover"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-zinc-100 truncate">
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-xs font-semibold text-zinc-200" suppressHydrationWarning>
                                    {formatPrice(prod.price_cents)}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {isSoldOut
                                      ? "Sold Out"
                                      : `${prod.stock_quantity} in stock`}
                                  </span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <button
                                onClick={() => handleAddToCart(prod)}
                                disabled={isSoldOut || isAtLimit}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all duration-150 cursor-pointer ${
                                  isSoldOut
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                                    : isAtLimit
                                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                    : isAdded
                                    ? "bg-emerald-500 text-zinc-950 font-semibold hover:scale-[1.02] active:scale-[0.98]"
                                    : "bg-white text-zinc-950 hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98]"
                                }`}
                              >
                                {isSoldOut ? (
                                  <span>Out of Stock</span>
                                ) : isAtLimit ? (
                                  <>
                                    <AlertOctagon className="w-3 h-3" />
                                    <span>Max</span>
                                  </>
                                ) : isAdded ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    <span>Add</span>
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
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="text-[11px] font-mono">Analyzing inventory constraints...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask e.g. 'Show me headphones under $300'..."
              className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-3.5 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
