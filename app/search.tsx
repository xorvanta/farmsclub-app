import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentWidth } from "@/components/AppShell";
import { SectionTitle } from "@/components/SectionTitle";
import { SearchBar } from "@/components/SearchBar";
import { FarmCard, fromFarmCard, farmColumns } from "@/components/FarmCard";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { fcApi, errorMessage } from "@/lib/api";
import type { FcFilters, FcSearchResult } from "@/lib/types";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Storefront §9.10: `/search?q=` — farms matching name/crop/state and listings matching
 * title/crop/variety, two sections, each with "See all". The farms "See all" opens the directory
 * pre-filtered when the query is exactly a state or crop that has farms.
 */
export default function Search() {
  const { colors, fonts, spacing } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const urlQ = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const [text, setText] = useState(urlQ);
  const [result, setResult] = useState<FcSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FcFilters | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pushed = useRef(urlQ);
  const contentWidth = useContentWidth();
  const columns = farmColumns(contentWidth);
  const cardWidth = Math.floor((contentWidth - spacing.md * (columns - 1)) / columns);

  useEffect(() => {
    if (urlQ === pushed.current) return;
    pushed.current = urlQ;
    setText(urlQ);
  }, [urlQ]);

  // Typing updates ?q= after a short pause (the page and Back keep the query).
  useEffect(() => {
    const next = text.trim();
    if (next === urlQ) return;
    const t = setTimeout(() => {
      pushed.current = next;
      router.setParams({ q: next || undefined });
    }, 350);
    return () => clearTimeout(t);
  }, [text, urlQ]);

  useEffect(() => {
    fcApi.getFilters().then(setFilters).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (urlQ.length < 2) {
      setResult(null);
      return;
    }
    setResult(null);
    fcApi
      .search(urlQ)
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [urlQ, attempt]);

  const q = norm(urlQ);
  const stateMatch = filters?.states.find((s) => norm(s.name) === q || s.slug === q || (s.code ?? "").toLowerCase() === q);
  const cropMatch = filters?.crops.find((c) => norm(c.name) === q || c.slug === q);
  const farmsHref = stateMatch
    ? ({ pathname: "/farms", params: { state: stateMatch.slug } } as const)
    : cropMatch
      ? ({ pathname: "/farms", params: { crop: cropMatch.slug } } as const)
      : ("/farms" as const);
  const listingCrop = filters?.listing_crops.find((c) => norm(c.name) === q);
  const listingsHref = listingCrop
    ? ({ pathname: "/listings", params: { crop: String(listingCrop.id) } } as const)
    : ({ pathname: "/listings", params: { q: urlQ } } as const);

  const farms = result?.farms ?? [];
  const listings = result?.listings ?? [];

  return (
    <AppShell contentContainerStyle={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl }}>
      <SeoHead title={urlQ ? `Search: ${urlQ} · FarmsClub` : "Search · FarmsClub"} description="Search FarmsClub farms and bulk planting material by crop, state or name." />
      <SectionTitle level={1} title="Search" subtitle="Farms and bulk planting material" />
      <View style={{ marginTop: spacing.lg }}>
        <SearchBar value={text} onChangeText={setText} placeholder="Search a crop or state, e.g. mango, teak, Bihar" />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.xxl }}>
        {urlQ.length < 2 ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft }}>Type at least 2 letters to search.</Text>
        ) : error ? (
          <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
        ) : !result ? (
          <LoadingState label="Searching…" />
        ) : farms.length === 0 && listings.length === 0 ? (
          <EmptyState title={`Nothing found for “${urlQ}”`} body="Try a crop (mango, teak), a state, or browse everything.">
            <Link href="/farms" asChild>
              <Button label="Explore farms" />
            </Link>
            <Link href="/contact" asChild>
              <Button label="Tell us what you need" variant="outline" />
            </Link>
          </EmptyState>
        ) : (
          <>
            {farms.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionTitle title="Farms" linkLabel="See all" href={farmsHref} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                  {farms.map((f) => (
                    <View key={f.slug} style={{ width: cardWidth }}>
                      <FarmCard farm={fromFarmCard(f)} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {listings.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionTitle title="Bulk planting material" linkLabel="See all" href={listingsHref} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                  {listings.map((l) => (
                    <View key={l.id} style={{ width: cardWidth }}>
                      <ListingCard listing={l} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </AppShell>
  );
}
