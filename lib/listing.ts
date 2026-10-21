import { formatBareRange, formatPriceRange, formatQtyWithUnit } from "./format";
import type { B2bListing } from "./types";

/** Display helpers shared by every listing surface (card, detail, sticky bar, search, farm page). */

export function listingUnit(l: Pick<B2bListing, "unit" | "bulk_unit">): string | null {
  return (l.unit ?? l.bulk_unit ?? null) || null;
}

export function listingMoq(l: Pick<B2bListing, "moq" | "bulk_min_quantity">): number | null {
  return l.moq ?? l.bulk_min_quantity ?? null;
}

export function listingCategoryName(l: Pick<B2bListing, "category">): string | null {
  return l.category?.name?.trim() || null;
}

/**
 * Storefront §1.3: no GST labels on prices. Only a listing whose GST rate is above 0 gets a small
 * "+ GST" next to its price (future-proofing — none of the launch categories carry GST).
 */
export function showsGst(l: Pick<B2bListing, "gst_rate">): boolean {
  const r = l.gst_rate == null ? 0 : Number(l.gst_rate);
  return Number.isFinite(r) && r > 0;
}

/** "₹78–₹90 / plant" (or "₹90 / plant", or "₹78–₹90" with no unit). Null when unpriced. */
export function listingPriceLabel(l: Pick<B2bListing, "price_from" | "price_to" | "unit" | "bulk_unit">): string | null {
  const range = formatPriceRange(l.price_from, l.price_to);
  if (!range) return null;
  const unit = listingUnit(l);
  return unit ? `${range} / ${unit}` : range;
}

/** Bare "78–90 per plant" for Trellis's listing context (the backend adds "₹" itself). */
export function listingBarePrice(l: Pick<B2bListing, "price_from" | "price_to" | "unit" | "bulk_unit">): string | null {
  const range = formatBareRange(l.price_from, l.price_to);
  if (!range) return null;
  const unit = listingUnit(l);
  return unit ? `${range} per ${unit}` : range;
}

/** "MOQ 100 plants". Null when the listing has no MOQ. */
export function listingMoqLabel(l: Pick<B2bListing, "moq" | "bulk_min_quantity" | "unit" | "bulk_unit">): string | null {
  const moq = listingMoq(l);
  if (moq == null) return null;
  return `MOQ ${formatQtyWithUnit(Number(moq), pluralUnit(listingUnit(l), Number(moq)))}`;
}

/** "plant" → "plants" for a quantity above 1, when the unit is a plain lower-case word. */
export function pluralUnit(unit: string | null, qty: number): string | null {
  if (!unit) return null;
  if (qty === 1 || !/^[a-z]+$/.test(unit) || unit.endsWith("s")) return unit;
  if (/(ch|sh|x)$/.test(unit)) return `${unit}es`;
  return `${unit}s`;
}

const PROPAGATION_LABELS: Record<string, string> = {
  grafted: "Grafted",
  graft: "Grafted",
  seedling: "Seedling",
  tissue_culture: "Tissue culture",
  "tissue culture": "Tissue culture",
  tc: "Tissue culture",
  cutting: "Cutting",
};

export function propagationLabel(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  return PROPAGATION_LABELS[v.toLowerCase()] ?? PROPAGATION_LABELS[v.toLowerCase().replace(/[-\s]+/g, "_")] ?? v;
}

/** §4.2 spec chips, only filled: variety · propagation · age or height · bag size. */
export function listingSpecChips(l: B2bListing): string[] {
  const chips: string[] = [];
  if (l.variety?.trim()) chips.push(l.variety.trim());
  const prop = propagationLabel(l.propagation);
  if (prop) chips.push(prop);
  if (l.age?.trim()) chips.push(l.age.trim());
  else if (l.height?.trim()) chips.push(l.height.trim());
  if (l.bag_size?.trim()) chips.push(l.bag_size.trim());
  return chips;
}
