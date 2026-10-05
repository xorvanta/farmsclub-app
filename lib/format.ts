/** Indian digit grouping (₹1,20,000, not ₹120,000) — the format every buyer on this platform expects. */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatRupees(amount: number): string {
  return `₹${inr.format(amount)}`;
}

export function formatQty(n: number): string {
  return n.toLocaleString("en-IN");
}
