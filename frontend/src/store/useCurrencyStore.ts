import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Currency, formatCurrency } from "@/lib/currency";

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency: Currency) => set({ currency }),
      toggleCurrency: () =>
        set((state) => ({
          currency: state.currency === "USD" ? "INR" : "USD",
        })),
    }),
    {
      name: "kuro-currency-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Convenient React hook to access active currency state, toggler, and bound formatPrice helper.
 */
export function useCurrency() {
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const toggleCurrency = useCurrencyStore((state) => state.toggleCurrency);

  const formatPrice = (cents: number): string => {
    return formatCurrency(cents, currency);
  };

  return {
    currency,
    setCurrency,
    toggleCurrency,
    formatPrice,
  };
}
