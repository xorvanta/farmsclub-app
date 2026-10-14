import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, FlatList, useWindowDimensions } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentGutter, CONTENT_MAX_WIDTH } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { SectionBanner } from "@/components/SectionBanner";
import { NURSERY_WIDE_PHOTO } from "@/constants/categoryImages";
import { CATEGORIES, asCategory } from "@/constants/categories";
import { b2bApi, errorMessage } from "@/lib/api";
import type { B2bListing, Category, ListingSort } from "@/lib/types";

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

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Category, sort and search live in the URL (?category=SEED&sort=price_asc&q=rose), and the
 * screen reads them from there — so a footer category link works while already on /listings,
 * Back returns to the same filtered view, and a shared link opens the same filter. Only known
 * categories/sorts are honoured; a hand-typed ?category=xyz is ignored rather than sent to the
 * backend.
 */
export default function Listings() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const gutter = useContentGutter();
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH + spacing.lg * 2);
  const columns = contentWidth >= 980 ? 4 : contentWidth >= 680 ? 3 : 2;
  const params = useLocalSearchParams<{ category?: string; sort?: string; q?: string }>();

  const category: Category | null = asCategory(firstParam(params.category));
  const sort: ListingSort = asSort(firstParam(params.sort));
  const urlQuery = (firstParam(params.q) ?? "").trim();

  const [listings, setListings] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(urlQuery);

  // Typing updates ?q= after a pause; an external change to ?q= (Back, a shared link, "Clear
  // filters") updates the box. `pushedQuery` stops our own debounced update from echoing back
  // and overwriting characters typed in the meantime.
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
    // Previous results stay on screen while a new search loads — swapping to the loading view
    // would remount the search box and drop keyboard focus mid-typing.
    b2bApi
      .getListings({ category, q: urlQuery, sort })
      .then((rows) => !cancelled && setListings(rows))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [category, urlQuery, sort]);

  useEffect(() => load(), [load]);
  const hasFilter = category !== null || urlQuery !== "";

  const clearFilters = () => {
    setQuery("");
    router.setParams({ category: undefined, q: undefined });
  };

  const filterBar = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ paddingTop: spacing.lg }}>
        <SectionBanner eyebrow="Catalogue" title="Every live bulk listing, priced by quantity tier." photo={NURSERY_WIDE_PHOTO} />
      </View>
      <View style={{ paddingHorizontal: gutter, paddingBottom: spacing.sm, gap: spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ value: null, label: "All categories" }, ...CATEGORIES]}
          keyExtractor={(c) => String(c.value)}
          contentContainerStyle={{ gap: spacing.sm }}
          accessibilityLabel="Filter by category"
          renderItem={({ item }) => (
            <CategoryChip
              label={item.label}
              active={category === item.value}
              onPress={() => router.setParams({ category: (item.value as Category | null) ?? undefined })}
            />
          )}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>Sort by</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={SORTS}
            keyExtractor={(s) => s.value}
            contentContainerStyle={{ gap: spacing.sm }}
            accessibilityLabel="Sort listings"
            renderItem={({ item }) => (
              <CategoryChip
                label={item.label}
                active={sort === item.value}
                accessibilityLabel={`Sort by ${item.label}`}
                onPress={() => router.setParams({ sort: item.value === "name" ? undefined : item.value })}
              />
            )}
          />
        </View>
      </View>
    </View>
  );

  const categoryName = category ? CATEGORIES.find((c) => c.value === category)?.label : null;

  return (
    <AppShell noScroll>
      <SeoHead
        title={categoryName ? `${categoryName} in bulk · FarmsClub` : "Catalogue · FarmsClub"}
        description="Browse bulk plants, seeds, pots, tools, and soil & fertiliser listings with quantity-tier pricing on FarmsClub."
      />

      {listings === null && !error ? (
        <>
          {filterBar}
          <LoadingState label="Loading catalogue…" />
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
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: gutter }}
          contentContainerStyle={{ gap: spacing.md }}
          ListHeaderComponent={filterBar}
          ListFooterComponent={<Footer />}
          ListFooterComponentStyle={{ marginTop: spacing.xl }}
          ListEmptyComponent={
            hasFilter ? (
              <EmptyState title="No matching listings" body="Try a different category or search term.">
                <Button label="Clear filters" variant="outline" onPress={clearFilters} />
              </EmptyState>
            ) : (
              <EmptyState title="Listings are going live shortly" body="New bulk listings are being added — send us an enquiry for what you need.">
                <Link href="/contact" asChild>
                  <Button label="Tell us what you need" />
                </Link>
              </EmptyState>
            )
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: `${100 / columns}%` }}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </AppShell>
  );
}
