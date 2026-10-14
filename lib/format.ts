/** Indian digit grouping (₹1,20,000, not ₹120,000) — the format every buyer on this platform expects. */
const inrWhole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "₹40" for a whole amount, "₹40.50" (always two decimals) when there are paise. */
export function formatAmount(amount: number): string {
  const n = Number(amount);
  return Number.isInteger(Math.round(n * 100) / 100) ? inrWhole.format(n) : inrPaise.format(n);
}

export function formatRupees(amount: number): string {
  return `₹${formatAmount(amount)}`;
}

export function formatQty(n: number): string {
  return Number(n).toLocaleString("en-IN");
}

/** "500 trays" / "500" — a quantity with its unit, Indian digit grouping. */
export function formatQtyWithUnit(n: number, unit: string | null | undefined): string {
  return unit ? `${formatQty(n)} ${unit}` : formatQty(n);
}

/** "₹40–₹55" (or "₹40" when both ends match). Null when the listing has no price range. */
export function formatPriceRange(from: number | null | undefined, to: number | null | undefined): string | null {
  if (from == null && to == null) return null;
  if (from == null || to == null || Number(from) === Number(to)) return formatRupees(Number(from ?? to));
  return `${formatRupees(Number(from))}–${formatRupees(Number(to))}`;
}

/** "40–55" / "40.50" — the same range without the rupee sign (the chat backend adds "₹" itself). */
export function formatBareRange(from: number | null | undefined, to: number | null | undefined): string | null {
  if (from == null && to == null) return null;
  if (from == null || to == null || Number(from) === Number(to)) return formatAmount(Number(from ?? to));
  return `${formatAmount(Number(from))}–${formatAmount(Number(to))}`;
}

/** Indian mobile number as typed ("+91 98765 43210", "098765 43210", "9876543210") → the bare
 *  10 digits, or the stripped digits unchanged when they don't reduce to 10. */
export function normalizeIndianMobile(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}
