import type { Category } from "@/lib/types";

/**
 * Real photography for the hero/category/banner treatment, per the user's explicit direction —
 * "real banners with real photos", not abstract graphics. Sourced from Unsplash (free license,
 * no attribution required for commercial use — https://unsplash.com/license) and hotlinked
 * directly to Unsplash's CDN, which supports Imgix-style resize params (see `photoUrl` below).
 *
 * 2026-10-06: fully re-picked for an explicitly green, gardening-first look — the original set
 * included a literal cardboard-boxes warehouse (not garden-related at all) and several brown/
 * amber-toned shots (dark stacked pots, dark soil bags) that read more "industrial" than "green
 * trade platform." Every URL here is deliberately distinct from paudhewale-dashboard-frontend's
 * own retail imagery — none of these were pulled from or match the retail storefront's posters.
 *
 * This is a placeholder until Formulate India has its own nursery photography — swap these base
 * URLs for R2-hosted real photos once there are keys + actual shots to upload (see
 * farmsclub_app_repo memory for the R2 status).
 */
export const CATEGORY_PHOTOS: Record<Category, string> = {
  PLANT: "https://images.unsplash.com/photo-1644615339756-0afa02e886f0", // lush green trellis rows inside a polytunnel
  POT: "https://images.unsplash.com/photo-1785964165946-ba4a58eebcb6", // potted nursery stock on tables under green tree cover
  TOOL: "https://images.unsplash.com/photo-1748164089130-1311c43b83b7", // wheelbarrow, rake and fork on a grass path
  SOIL_FERTILISER: "https://images.unsplash.com/photo-1611843467160-25afb8df1074", // hands planting seedlings in a garden bed
  OTHER: "https://images.unsplash.com/photo-1775681150219-b3d45dcd03f2", // rows of potted plants down a garden-centre aisle
};

export const HERO_PHOTO = "https://images.unsplash.com/photo-1708796705570-33fd29ef67d0"; // bright green lettuce rows, wide polytunnel
export const TRADE_DESK_PHOTO = "https://images.unsplash.com/photo-1775681150189-0c76d017d869"; // sunlit outdoor nursery shelving — promo/trade-desk banners
export const NURSERY_WIDE_PHOTO = "https://images.unsplash.com/photo-1752401966871-fcda5b645160"; // garden-centre plant tables under a green shade canopy

/** Request a specific size/crop from Unsplash's CDN instead of shipping one oversized image everywhere. */
export function photoUrl(base: string, { w, h, q = 75 }: { w: number; h?: number; q?: number }) {
  const params = new URLSearchParams({
    w: String(Math.round(w)),
    q: String(q),
    auto: "format",
    fit: "crop",
    crop: "entropy",
  });
  if (h) params.set("h", String(Math.round(h)));
  return `${base}?${params.toString()}`;
}
