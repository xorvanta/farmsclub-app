import type { Category } from "@/lib/types";

/**
 * Real photography for the hero/category/banner treatment, per the user's explicit direction —
 * "real banners with real photos", not abstract graphics. Sourced from Unsplash (free license,
 * no attribution required for commercial use — https://unsplash.com/license) and hotlinked
 * directly to Unsplash's CDN, which supports Imgix-style resize params (see `photoUrl` below).
 *
 * This is a placeholder until Formulate India has its own nursery/warehouse photography — swap
 * these base URLs for R2-hosted real photos once there are keys + actual shots to upload
 * (see farmsclub_app_repo memory for the R2 status).
 */
export const CATEGORY_PHOTOS: Record<Category, string> = {
  PLANT: "https://images.unsplash.com/photo-1668962225017-12ef9d7981c2",
  POT: "https://images.unsplash.com/photo-1468531390554-9f62f9767a87",
  TOOL: "https://images.unsplash.com/photo-1573561368183-fd88bdb4503d",
  SOIL_FERTILISER: "https://images.unsplash.com/photo-1678101631231-99967c6e49ad",
  OTHER: "https://images.unsplash.com/photo-1553413077-190dd305871c",
};

export const HERO_PHOTO = "https://images.unsplash.com/photo-1637987327476-5c77df3cb16d";
export const WAREHOUSE_PHOTO = "https://images.unsplash.com/photo-1553413077-190dd305871c";
export const NURSERY_WIDE_PHOTO = "https://images.unsplash.com/photo-1623136299195-570a06bdae6b";

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
