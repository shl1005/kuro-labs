import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, Product } from "@/types";

export interface ToastState {
  message: string;
  type: "error" | "success" | "info";
  id: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  toast: ToastState | null;

  // Drawer Controls
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Cart Operations
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;

  // Toast Notifications
  showToast: (message: string, type?: "error" | "success" | "info") => void;
  clearToast: () => void;

  // Computed helpers
  getTotalCount: () => number;
  getSubtotalCents: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      toast: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product: Product, quantity = 1) => {
        if (product.stock_quantity <= 0) {
          get().showToast(`"${product.name}" is currently sold out.`, "error");
          return false;
        }

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = currentItems[existingIndex].quantity;
          const maxStock = product.stock_quantity;

          if (currentQty >= maxStock) {
            get().showToast(
              `Maximum stock reached for "${product.name}" (${maxStock} available).`,
              "error"
            );
            return false;
          }

          const targetQty = Math.min(currentQty + quantity, maxStock);
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            product, // update latest product info
            quantity: targetQty,
          };

          set({ items: updatedItems });
          get().showToast(`Updated "${product.name}" quantity to ${targetQty}.`, "success");
          return true;
        } else {
          const addQty = Math.min(quantity, product.stock_quantity);
          set({
            items: [...currentItems, { product, quantity: addQty }],
          });
          get().showToast(`Added "${product.name}" to cart.`, "success");
          return true;
        }
      },

      removeItem: (productId: number) => {
        const itemToRemove = get().items.find((i) => i.product.id === productId);
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
        if (itemToRemove) {
          get().showToast(`Removed "${itemToRemove.product.name}" from cart.`, "info");
        }
      },

      updateQuantity: (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const currentItems = get().items;
        const existing = currentItems.find((i) => i.product.id === productId);
        if (!existing) return;

        const maxStock = existing.product.stock_quantity;
        if (newQuantity > maxStock) {
          get().showToast(
            `Cannot exceed available stock of ${maxStock} for "${existing.product.name}".`,
            "error"
          );
          set({
            items: currentItems.map((i) =>
              i.product.id === productId ? { ...i, quantity: maxStock } : i
            ),
          });
          return;
        }

        set({
          items: currentItems.map((i) =>
            i.product.id === productId ? { ...i, quantity: newQuantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      showToast: (message: string, type = "info") => {
        const id = Date.now();
        set({ toast: { message, type, id } });
      },

      clearToast: () => set({ toast: null }),

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotalCents: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price_cents * item.quantity,
          0
        );
      },
    }),
    {
      name: "tech_store_cart_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
