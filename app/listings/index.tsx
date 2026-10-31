import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentGutter } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/Button";
import { Orchard3DPlanner } from "@/components/tools/Orchard3DPlanner";
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
 * Bulk supply Mandi Exchange (Storefront §9.1). Category, crop, sort and search live in the URL
 * (?category=fruit-plants&crop=Mango&sort=price_asc&q=alphonso).
 */
export default function Listings() {
  const { colors, fonts, spacing, radius } = useTheme();
  const categories = useFcCategories();
  const { width } = useWindowDimensions();
  const gutter = useContentGutter();
  const compact = width < 560;
  const columns = width >= 1200 ? 4 : width >= 900 ? 3 : width >= 480 ? 2 : 1;
  const params = useLocalSearchParams<{ category?: string; crop?: string; sort?: string; q?: string }>();

  const category = firstParam(params.category);
  const crop = firstParam(params.crop);
  const sort: ListingSort = asSort(firstParam(params.sort));
  const urlQuery = firstParam(params.q);

  const [listings, setListings] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FcFilters | null>(null);
  const [query, setQuery] = useState(urlQuery);
  const [showPlanner, setShowPlanner] = useState(false);

  useEffect(() => {
    fcApi.getFilters().then(setFilters).catch(() => setFilters(null));
  }, []);

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
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", color: colors.inkSoft }}>{label}</Text>
      {children}
    </View>
  );

  const filterBar = (
    <View style={{ paddingHorizontal: gutter, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.lg }}>
      {/* Mandi Trade Floor Header */}
      <LinearGradient
        colors={["#071A10", "#123824", "#184A30"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.xl,
          padding: compact ? spacing.lg : spacing.xl,
          borderWidth: 1,
          borderColor: "rgba(229,180,98,0.32)",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
          <View style={{ gap: 4, maxWidth: 640 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#52C388" }} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#E5B462" }}>
                WHOLESALE B2B MANDI FLOOR
              </Text>
            </View>
            <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: compact ? 26 : 32, lineHeight: compact ? 32 : 38, color: "#FFFFFF" }}>
              {activeCategory ? activeCategory.name_en : "Bulk Supply & Plantation Stock"}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.82)" }}>
              Quantity-tiered mandi rates · Direct road & rail dispatch from verified grower belts.
            </Text>
          </View>

          <Pressable
            onPress={() => setShowPlanner((v) => !v)}
            accessibilityRole="button"
            style={{
              backgroundColor: showPlanner ? "#E5B462" : "rgba(229,180,98,0.16)",
              borderWidth: 1.5,
              borderColor: "#E5B462",
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: showPlanner ? "#081E12" : "#E5B462" }}>
              {showPlanner ? "✕ Hide 3D Orchard Simulator" : "📐 Open 3D Orchard Simulator"}
            </Text>
          </Pressable>
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search plants, crops, varieties…" accessibilityLabel="Search bulk supply" />
      </LinearGradient>

      {showPlanner ? <Orchard3DPlanner /> : null}

      {/* Filter Matrix */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        }}
      >
        {categories.length > 0 &&
          chipRow(
            "Category",
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ slug: "", name_en: "All Lots" }, ...categories]}
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
            "Crop Belt",
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 0, name: "All crops" }, ...crops]}
              keyExtractor={(c) => String(c.id)}
              contentContainerStyle={{ gap: spacing.sm }}
              accessibilityLabel="Filter by crop"
              renderItem={({ item }) => (
                <CategoryChip
                  label={item.name ?? ""}
                  active={item.id ? activeCrop?.id === item.id : !crop}
                  onPress={() => router.setParams({ crop: item.id ? String(item.id) : undefined })}
                />
              )}
            />,
          )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
          {chipRow(
            "Sort Lots",
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
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              style={{
                alignSelf: "flex-end",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.cta }}>Reset filters ✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {listings && listings.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft }}>
            Showing {listings.length} wholesale {listings.length === 1 ? "lot" : "lots"}
          </Text>
          <Link href="/contact" style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brand }}>
            Need a custom variety? Enquire →
          </Link>
        </View>
      ) : null}
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
          <LoadingState label="Loading wholesale lots…" />
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
            <EmptyState title="No listings here yet." body="Tell us what you need and our trade desk will source it from our farm network.">
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
