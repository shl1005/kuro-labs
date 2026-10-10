export type Currency = "USD" | "INR";

/**
 * Fixed conversion rate: 1 USD = 83 INR
 */
export const USD_TO_INR_RATE = 83;

/**
 * Formats a base cent amount (USD cents) into either USD ($) or INR (₹).
 * 
 * - USD: Render formatted dollars with two decimals, e.g. "$120.00"
 * - INR: Render formatted rupees with Indian numbering notation without decimals, e.g. "₹9,960"
 * 
 * @param cents Base amount in USD cents (e.g., 12000 for $120.00)
 * @param currency Target currency ("USD" | "INR")
 */
export function formatCurrency(cents: number, currency: Currency = "USD"): string {
  if (currency === "INR") {
    // 1 USD = 100 cents. Convert cents to USD then multiply by fixed conversion rate 83.
    const inrValue = Math.round((cents / 100) * USD_TO_INR_RATE);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(inrValue);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
