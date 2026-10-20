import { useEffect, useState } from "react";
import { CATEGORIES } from "@/constants/categories";
import { b2bApi } from "@/lib/api";
import type { Category } from "@/lib/types";

type CategoryOption = { value: Category; label: string };

// One request per page load, shared by every screen that renders the category navigation.
let shown: Promise<Set<string>> | null = null;

/**
 * The categories FarmsClub shows — the ones switched on by the trade desk (B2B Admin Spec Changes v1.4
 * §7.4). Listings in other categories never reach the storefront, so their links would only open empty
 * pages. Until the answer arrives (or if it fails) the full list is used, so navigation never blanks.
 */
export function useShownCategories(): CategoryOption[] {
  const [codes, setCodes] = useState<Set<string> | null>(null);
  useEffect(() => {
    let alive = true;
    if (!shown) {
      shown = b2bApi.getCategories().then((rows) => new Set(rows.map((r) => r.code)));
      shown.catch(() => { shown = null; });
    }
    shown.then((s) => { if (alive) setCodes(s); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return codes ? CATEGORIES.filter((c) => codes.has(c.value)) : CATEGORIES;
}
