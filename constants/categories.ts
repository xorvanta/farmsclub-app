import type { Category } from "@/lib/types";

/** Matches Listing_Spec_Seller_v1.0 §2.3's fixed category list exactly. */
export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "PLANT", label: "Plants" },
  { value: "POT", label: "Pots" },
  { value: "TOOL", label: "Tools" },
  { value: "SOIL_FERTILISER", label: "Soil & Fertiliser" },
  { value: "OTHER", label: "Other" },
];

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
