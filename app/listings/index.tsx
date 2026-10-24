import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, useWindowDimensions } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentGutter } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { ListingCard } from "@/components/ListingCard";
import { SectionTitle } from "@/components/SectionTitle";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { useFcCategories } from "@/lib/useFcCategories";
import { b2bApi, fcApi, errorMessage } from "@/lib/api";
import type { B2bListing, FcFilters, ListingSort } from "@/lib/types";

const SORTS: { value: ListingSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "moq", label: "Lowest MOQ" },
  { value: "newest", label: "Newest" },
];

function asSort(v: unknown): ListingSort {
  return SORTS.some((s) => s.value === v) ? (v as ListingSort) : "name";
}

function firstParam(v: string | string[] | undefined): string {
  return ((Array.isArray(v) ? v[0] : v) ?? "").trim().slice(0, 140);
}

/**
 * Bulk supply (Storefront §9.1). Category, crop, sort and search live in the URL
 * (?category=fruit-plants&crop=Mango&sort=price_asc&q=alphonso), so Back, shared links and the
 * farm page's "see all" links open the same view. Categories and crops come from the API only —
 * live categories with visible listings, and crops that have visible listings.
 */
export default function Listings() {
  const { colors, fonts, spacing } = useTheme();
  const categories = useFcCategories();
  const { width } = useWindowDimensions();
  const gutter = useContentGutter();
  const columns = width >= 1200 ? 4 : width >= 900 ? 3 : width >= 480 ? 2 : 1;
  const params = useLocalSearchParams<{ category?: string; crop?: string; sort?: string; q?: string }>();

  const category = firstParam(params.category); // a FarmsClub slug, or an old code (PLANT…) — the API accepts both
  const crop = firstParam(params.crop); // crop id or name
  const sort: ListingSort = asSort(firstParam(params.sort));
  const urlQuery = firstParam(params.q);

  const [listings, setListings] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FcFilters | null>(null);
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    fcApi.getFilters().then(setFilters).catch(() => setFilters(null));
  }, []);

  // Typing updates ?q= after a pause; an external change to ?q= updates the box.
  const pushedQuery = useRef(urlQuery);
  useEffect(() => {
    if (urlQuery === pushedQuery.current) return;
    pushedQuery.current = urlQuery;
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const next = query.trim();
    if (next === urlQuery) return;
    const t = setTimeout(() => {
      pushedQuery.current = next;
      router.setParams({ q: next || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [query, urlQuery]);

  const load = useCallback(() => {
    let cancelled = false;
    setError(null);
    b2bApi
      .getListings({ category: category || null, crop: crop || null, q: urlQuery, sort })
      .then((rows) => !cancelled && setListings(Array.isArray(rows) ? rows : []))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [category, crop, urlQuery, sort]);

  useEffect(() => load(), [load]);

  const activeCategory = categories.find((c) => c.slug === category.toLowerCase() || (c.legacy_code && c.legacy_code === category.toUpperCase())) ?? null;
  const crops = filters?.listing_crops ?? [];
  const activeCrop = crop ? crops.find((c) => String(c.id) === crop || c.name?.toLowerCase() === crop.toLowerCase()) ?? null : null;
  const hasFilter = !!category || !!crop || urlQuery !== "";

  const clearFilters = () => {
    setQuery("");
    router.setParams({ category: undefined, crop: undefined, q: undefined });
  };

  const chipRow = (label: string, children: React.ReactNode) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: colors.inkSoft }}>{label}</Text>
      {children}
    </View>
  );

  const filterBar = (
    <View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.lg }}>
      <SectionTitle level={1} title="Bulk supply" subtitle="Plantation stock, priced by quantity." />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search plants, crops, varieties…" accessibilityLabel="Search bulk supply" />

      {categories.length > 0 &&
        chipRow(
          "Category",
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ slug: "", name_en: "All" }, ...categories]}
            keyExtractor={(c) => c.slug || "all"}
            contentContainerStyle={{ gap: spacing.sm }}
            accessibilityLabel="Filter by category"
            renderItem={({ item }) => (
              <CategoryChip
                label={item.name_en}
                active={item.slug ? activeCategory?.slug === item.slug : !category}
                onPress={() => router.setParams({ category: item.slug || undefined })}
              />
            )}
          />,
        )}

      {crops.length > 0 &&
        chipRow(
          "Crop",
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 0, name: "All crops" }, ...crops]}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{ gap: spacing.sm }}
            accessibilityLabel="Filter by crop"
            renderItem={({ item }) => (
              <CategoryChip
                label={item.name}
                active={item.id ? activeCrop?.id === item.id : !crop}
                onPress={() => router.setParams({ crop: item.id ? String(item.id) : undefined })}
              />
            )}
          />,
        )}

      {/* Only five sorts — they wrap onto a second line rather than scroll half-hidden off the edge. */}
      {chipRow(
        "Sort",
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }} accessibilityLabel="Sort listings">
          {SORTS.map((item) => (
            <CategoryChip
              key={item.value}
              label={item.label}
              active={sort === item.value}
              accessibilityLabel={`Sort by ${item.label}`}
              onPress={() => router.setParams({ sort: item.value === "name" ? undefined : item.value })}
            />
          ))}
        </View>,
      )}

      {hasFilter && (
        <Pressable onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Clear all filters" style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.cta }}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );

  const title = activeCategory ? `${activeCategory.name_en} · Bulk supply · FarmsClub` : "Bulk supply · FarmsClub";

  return (
    <AppShell noScroll>
      <SeoHead
        title={title}
        description="Plantation stock in bulk on FarmsClub — fruit plants, spice planting material and more, priced by quantity. Request a quote and our team confirms price and dispatch."
      />

      {listings === null && !error ? (
        <>
          {filterBar}
          <LoadingState label="Loading…" />
        </>
      ) : error ? (
        <>
          {filterBar}
          <ErrorState message={error} onRetry={() => void load()} />
        </>
      ) : (
        <FlatList
          data={listings!}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={columns > 1 ? { gap: spacing.md, paddingHorizontal: gutter } : undefined}
          contentContainerStyle={{ gap: spacing.md }}
          ListHeaderComponent={filterBar}
          ListFooterComponent={<Footer />}
          ListFooterComponentStyle={{ marginTop: spacing.xl }}
          ListEmptyComponent={
            <EmptyState title="No listings here yet." body="Tell us what you need.">
              <Link href="/contact" asChild>
                <Button label="Tell us what you need" />
              </Link>
              {hasFilter ? <Button label="Clear filters" variant="outline" onPress={clearFilters} /> : null}
            </EmptyState>
          }
          renderItem={({ item }) => (
            <View style={columns > 1 ? { flex: 1, maxWidth: `${100 / columns}%` } : { paddingHorizontal: gutter }}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </AppShell>
  );
}
