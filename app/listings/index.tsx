import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { ListingCard } from "@/components/ListingCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { CATEGORIES } from "@/constants/categories";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing, Category } from "@/lib/types";

export default function Listings() {
  const { colors, spacing } = useTheme();
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
      const matchesCategory = !category || l.category === category;
      const haystack = `${l.title} ${l.specification ?? ""}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [all, category, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Header />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
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

      {filtered === null && !error ? (
        <LoadingState label="Loading catalogue…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered!.length === 0 ? (
        <EmptyState title="No matching listings" body="Try a different category or search term." />
      ) : (
        <FlatList
          data={filtered!}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={columns > 1 ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ gap: spacing.md, padding: spacing.lg, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}
