import type { Category } from "@/lib/types";

/** Matches Listing_Spec_Seller_v1.0 §2.3's fixed category list exactly. */
export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "PLANT", label: "Plants" },
  { value: "SEED", label: "Seeds" },
  { value: "POT", label: "Pots" },
  { value: "TOOL", label: "Tools" },
  { value: "SOIL_FERTILISER", label: "Soil & Fertiliser" },
  { value: "OTHER", label: "Other" },
];

/** The value as a known Category, or null for anything else (absent, typo'd URL param, or a
 *  category the backend added after this build). */
export function asCategory(value: unknown): Category | null {
  return typeof value === "string" && CATEGORIES.some((c) => c.value === value) ? (value as Category) : null;
}

/** Display label — a known category's own label, otherwise a humanised version of the raw value
 *  ("NEW_THING" → "New thing"), and "Other" when there's no value at all. */
export function categoryLabel(value: string | null | undefined): string {
  const known = CATEGORIES.find((c) => c.value === value);
  if (known) return known.label;
  if (!value || !value.trim()) return "Other";
  const words = value.trim().replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
