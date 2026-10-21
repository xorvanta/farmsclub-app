import { useEffect, useState } from "react";
import { fcApi } from "@/lib/api";
import type { FcCategory } from "@/lib/types";

// One request per page load, shared by every screen that renders category tiles/filters.
let cached: FcCategory[] | null = null;
let inflight: Promise<FcCategory[]> | null = null;

/**
 * Live FarmsClub categories that have at least one visible listing (GET /public/fc/categories,
 * Storefront §3.1, §9.1). Categories are never hard-coded: admin adds, hides and orders them in
 * FarmsClub → Categories. Empty while loading or if the request fails — nothing is invented.
 */
export function useFcCategories(): FcCategory[] {
  const [rows, setRows] = useState<FcCategory[]>(cached ?? []);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    if (!inflight) {
      inflight = fcApi
        .getCategories()
        .then((r) => (cached = Array.isArray(r) ? r : []))
        .catch((e) => {
          inflight = null;
          throw e;
        });
    }
    inflight.then((r) => alive && setRows(r)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}
