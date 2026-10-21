import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentWidth } from "@/components/AppShell";
import { SectionTitle } from "@/components/SectionTitle";
import { FilterSelect } from "@/components/FilterSelect";
import { FarmCard, fromFarmCard, farmColumns } from "@/components/FarmCard";
import { Checkbox } from "@/components/Checkbox";
import { CategoryChip } from "@/components/CategoryChip";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { fcApi, errorMessage } from "@/lib/api";
import type { FarmCardApi, FcFilters } from "@/lib/types";

const PAGE_SIZE = 20;
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "verified", label: "Verified first" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function humanize(slug: string): string {
  const s = slug.replace(/[-_]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Storefront §5 farms directory. Filters (state, farm type, crop, training) come from
 * GET /public/fc/filters — only values that have Live farms — and live in the URL
 * (`/farms?state=bihar&crop=mango&training=1`), so Back, refresh and shared links keep them.
 * The server only ever returns Live farms; Verified/Self-listed comes from each card.
 */
export default function Farms() {
  const { colors, fonts, spacing } = useTheme();
  const params = useLocalSearchParams<{ state?: string; district?: string; type?: string; crop?: string; training?: string; sort?: string }>();
  const state = first(params.state).toLowerCase();
  const district = first(params.district).toLowerCase();
  const type = first(params.type).toLowerCase();
  const crop = first(params.crop).toLowerCase();
  const training = first(params.training) === "1";
  const sortParam = first(params.sort) as Sort;
  const sort: Sort = SORTS.some((s) => s.value === sortParam) ? sortParam : "featured";
  const contentWidth = useContentWidth();
  const columns = farmColumns(contentWidth);
  const gap = spacing.md;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  const [filters, setFilters] = useState<FcFilters | null>(null);
  const [farms, setFarms] = useState<FarmCardApi[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    fcApi.getFilters().then(setFilters).catch(() => setFilters(null));
  }, []);

  const query = { state: state || null, district: district || null, type: type || null, crop: crop || null, training, sort, size: PAGE_SIZE };
  const queryKey = JSON.stringify(query);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setError(null);
    setFarms(null);
    fcApi
      .getFarms({ ...JSON.parse(queryKey), page: 0 })
      .then((res) => {
        if (id !== requestId.current) return;
        setFarms(res.items ?? []);
        setPage(0);
        setHasMore(!!res.has_more);
        setTotal(typeof res.total === "number" ? res.total : null);
      })
      .catch((e) => id === requestId.current && setError(errorMessage(e)));
  }, [queryKey]);

  useEffect(() => load(), [load]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    fcApi
      .getFarms({ ...JSON.parse(queryKey), page: page + 1 })
      .then((res) => {
        if (id !== requestId.current) return;
        setFarms((prev) => {
          const seen = new Set((prev ?? []).map((f) => f.slug));
          return [...(prev ?? []), ...(res.items ?? []).filter((f) => !seen.has(f.slug))];
        });
        setPage(page + 1);
        setHasMore(!!res.has_more);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const setParam = (key: string, value: string | undefined) => router.setParams({ [key]: value || undefined });
  const hasFilter = !!(state || district || type || crop || training);
  const clearFilters = () => router.setParams({ state: undefined, district: undefined, type: undefined, crop: undefined, training: undefined });

  const stateOptions = (filters?.states ?? []).filter((s) => s.farms > 0).map((s) => ({ value: s.slug, label: s.name }));
  const typeOptions = (filters?.farm_types ?? []).filter((t) => t.farms > 0).map((t) => ({ value: t.slug, label: t.name }));
  const cropOptions = (filters?.crops ?? []).filter((c) => c.farms > 0).map((c) => ({ value: c.slug, label: c.name }));
  // A value from a shared/breadcrumb link that isn't in the list (or arrived as an id/code) still shows selected.
  const withCurrent = (opts: { value: string; label: string }[], v: string) =>
    v && !opts.some((o) => o.value === v) ? [{ value: v, label: humanize(v) }, ...opts] : opts;

  const stateName = stateOptions.find((s) => s.value === state)?.label;
  const title = stateName ? `Farms in ${stateName} · FarmsClub` : "Farms · FarmsClub";

  return (
    <AppShell contentContainerStyle={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl }}>
      <SeoHead title={title} description="Real farms across India — their stories, videos, what they grow, services and training. Filter by state, farm type and crop." />

      <SectionTitle level={1} title="Farms" subtitle="Real farms across India" />

      {/* Filters */}
      <View style={{ marginTop: spacing.lg, gap: spacing.md }} accessibilityRole="search" aria-label="Filter farms">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <FilterSelect id="farms-state" label="State" allLabel="All states" value={state} options={withCurrent(stateOptions, state)} onChange={(v) => router.setParams({ state: v || undefined, district: undefined })} />
          <FilterSelect id="farms-type" label="Farm type" allLabel="All farm types" value={type} options={withCurrent(typeOptions, type)} onChange={(v) => setParam("type", v)} />
          <FilterSelect id="farms-crop" label="Crop" allLabel="All crops" value={crop} options={withCurrent(cropOptions, crop)} onChange={(v) => setParam("crop", v)} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
          {filters == null || filters.training_farms > 0 || training ? (
            <Checkbox label="Offers training" checked={training} onChange={(next) => setParam("training", next ? "1" : undefined)} />
          ) : (
            <View />
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft }}>Sort:</Text>
            {SORTS.map((s) => (
              <CategoryChip
                key={s.value}
                label={s.label}
                active={sort === s.value}
                accessibilityLabel={`Sort by ${s.label}`}
                onPress={() => setParam("sort", s.value === "featured" ? undefined : s.value)}
              />
            ))}
          </View>
        </View>
        {district || hasFilter ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
            {district ? (
              <Pressable
                onPress={() => setParam("district", undefined)}
                accessibilityRole="button"
                accessibilityLabel={`Remove district filter ${humanize(district)}`}
                style={{ minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.brandSoft }}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brand }}>District: {humanize(district)} ✕</Text>
              </Pressable>
            ) : null}
            {hasFilter ? (
              <Pressable onPress={clearFilters} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.cta }}>Clear filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Results */}
      <View style={{ marginTop: spacing.lg }}>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : farms === null ? (
          <LoadingState label="Loading farms…" />
        ) : farms.length === 0 ? (
          <EmptyState title="No farms match these filters yet." body={hasFilter ? "Try another state, farm type or crop." : "New farms are being added by our team."}>
            {hasFilter ? <Button label="Clear filters" variant="outline" onPress={clearFilters} /> : null}
            <Link href="/list-your-farm" asChild>
              <Button label="List your farm" />
            </Link>
          </EmptyState>
        ) : (
          <>
            {total != null ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: spacing.md }} accessibilityLiveRegion="polite" aria-live="polite">
                {total === 1 ? "1 farm" : `${total.toLocaleString("en-IN")} farms`}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
              {farms.map((f) => (
                <View key={f.slug} style={{ width: cardWidth }}>
                  <FarmCard farm={fromFarmCard(f)} />
                </View>
              ))}
            </View>
            {hasMore ? (
              <View style={{ alignItems: "center", marginTop: spacing.xl }}>
                <Button label="Load more" variant="outline" loading={loadingMore} onPress={loadMore} />
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <SectionBanner insetHorizontal={false} title="Own a farm?" body="Share your story with buyers and future farmers across India. Listing is free.">
          <Link href="/list-your-farm" asChild>
            <Button label="List your farm (free)" />
          </Link>
        </SectionBanner>
      </View>
    </AppShell>
  );
}
