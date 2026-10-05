/** Indian digit grouping (₹1,20,000, not ₹120,000) — the format every buyer on this platform expects. */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatRupees(amount: number): string {
  return `₹${inr.format(amount)}`;
}

export function priceRange(tiers: { buyer_price: number }[]): string {
  if (tiers.length === 0) return "Price on request";
  const prices = tiers.map((t) => t.buyer_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatRupees(min);
  // Largest-quantity tier is always the cheapest (B2B_Admin_Spec_v1.2 §6.2) — "from" the lowest.
  return `${formatRupees(min)} – ${formatRupees(max)}`;
}
