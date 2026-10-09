/** Indian digit grouping (₹1,20,000, not ₹120,000) — the format every buyer on this platform expects. */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatRupees(amount: number): string {
  return `₹${inr.format(amount)}`;
}

export function formatQty(n: number): string {
  return n.toLocaleString("en-IN");
}

/** "₹40–₹55" (or "₹40" when both ends match). Null when the listing has no price range. */
export function formatPriceRange(from: number | null | undefined, to: number | null | undefined): string | null {
  if (from == null && to == null) return null;
  if (from == null || to == null || Number(from) === Number(to)) return formatRupees(Number(from ?? to));
  return `${formatRupees(Number(from))}–${formatRupees(Number(to))}`;
}
