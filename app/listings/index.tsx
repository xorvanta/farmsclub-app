import { useEffect, useState, useCallback } from "react";
import { View, FlatList, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { ListingCard } from "@/components/ListingCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { SectionBanner } from "@/components/SectionBanner";
import { NURSERY_WIDE_PHOTO } from "@/constants/categoryImages";
import { CATEGORIES } from "@/constants/categories";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing, Category } from "@/lib/types";

export default function Listings() {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 4 : width >= 680 ? 3 : 2;
  const params = useLocalSearchParams<{ category?: string }>();

  const [listings, setListings] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<Category | null>((params.category as Category) ?? null);

  // Search runs server-side (`q` matches title, specification and brand) — debounced so typing
  // doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(() => {
    let cancelled = false;
    setError(null);
    // Previous results stay on screen while a new search loads — swapping to the loading view
    // would remount the search box and drop keyboard focus mid-typing.
    b2bApi
      .getListings({ category, q: debouncedQuery })
      .then((rows) => !cancelled && setListings(rows))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Couldn't reach FarmsClub right now."));
    return () => {
      cancelled = true;
    };
  }, [category, debouncedQuery]);

  useEffect(() => load(), [load]);
  const filtered = listings;

  const filterBar = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ paddingTop: spacing.lg }}>
        <SectionBanner
          eyebrow="Catalogue"
          title="Every live bulk listing, priced by quantity tier."
          photo={NURSERY_WIDE_PHOTO}
        />
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md }}>
      <SearchBar value={query} onChangeText={setQuery} />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ value: null, label: "All categories" }, ...CATEGORIES]}
        keyExtractor={(c) => String(c.value)}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <CategoryChip label={item.label} active={category === item.value} onPress={() => setCategory(item.value as Category | null)} />
        )}
      />
      </View>
    </View>
  );

  return (
    <AppShell noScroll>
      <Head>
        <title>Catalogue · FarmsClub</title>
        <meta name="description" content="Browse bulk plants, pots, tools, and soil & fertiliser listings with volume pricing on FarmsClub." />
      </Head>

      {filtered === null && !error ? (
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
          data={filtered!}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{ gap: spacing.md }}
          ListHeaderComponent={filterBar}
          ListFooterComponent={<Footer />}
          ListFooterComponentStyle={{ marginTop: spacing.xl }}
          ListEmptyComponent={<EmptyState title="No matching listings" body="Try a different category or search term." />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </AppShell>
  );
}
