import { useEffect, useState, useCallback, useMemo } from "react";
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
import { CATEGORIES } from "@/constants/categories";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing, Category } from "@/lib/types";

export default function Listings() {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 4 : width >= 680 ? 3 : 2;
  const params = useLocalSearchParams<{ category?: string }>();

  const [all, setAll] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>((params.category as Category) ?? null);

  const load = useCallback(() => {
    setError(null);
    b2bApi
      .getListings()
      .then(setAll)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't reach FarmsClub right now."));
  }, []);

  useEffect(() => void load(), [load]);

  // Backend doesn't expose a text-search param on /public/b2b/listings yet — filtered client-side
  // against the already-fetched (small, admin-curated) catalogue. Revisit server-side if the
  // live listing count grows past what's reasonable to ship in one response.
  const filtered = useMemo(() => {
    if (!all) return null;
    return all.filter((l) => {
      const matchesCategory = !category || l.bulk_category === category;
      const haystack = `${l.title} ${l.specification ?? ""}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [all, category, query]);

  const filterBar = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ paddingTop: spacing.lg }}>
        <SectionBanner
          eyebrow="Catalogue"
          title="Every live bulk listing, one flat rate each."
          tone="accent"
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
          <ErrorState message={error} onRetry={load} />
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
