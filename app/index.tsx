import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/Button";
import { CATEGORIES } from "@/constants/categories";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function Home() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 4 : width >= 680 ? 3 : 2;

  const [listings, setListings] = useState<B2bListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    b2bApi
      .getListings()
      .then(setListings)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't reach FarmsClub right now."));
  }, []);

  useEffect(() => void load(), [load]);

  return (
    <AppShell>
      <Head>
        <title>FarmsClub — Bulk Plants, Pots, Tools &amp; Fertiliser</title>
        <meta
          name="description"
          content="Formulate India's B2B wholesale trade platform for bulk plants, pots, tools, and soil & fertiliser — tiered pricing, sourced and delivered pan-India."
        />
      </Head>

      {/* ── Hero — search-first, per B2B convention: the job to be done up top, not a mood shot ── */}
      <View style={[styles.hero, { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl }]}>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink, maxWidth: 560 }}>
          Bulk plants, pots, tools &amp; fertiliser — sourced and delivered pan-India.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, marginTop: 10, maxWidth: 520 }}>
          FarmsClub is Formulate India's wholesale trade platform. Compare tiered pricing, submit a
          requirement, and our team confirms sourcing, invoicing and dispatch — direct to your site.
        </Text>
        <View style={{ marginTop: spacing.lg, flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
          <Button label="Browse the catalogue" onPress={() => router.push("/listings")} />
          <Button label="How sourcing works" variant="outline" onPress={() => router.push("/about")} />
        </View>
      </View>

      {/* ── Categories ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <SectionLabel>Shop by category</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => router.push({ pathname: "/listings", params: { category: c.value } })}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
              ]}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: colors.ink }}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── How it works — sets the right expectation: this is enquiry-led, not self-checkout ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <SectionLabel>How sourcing works</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
          {[
            { step: "01", title: "Compare tiers", body: "Browse live listings with volume pricing by quantity band." },
            { step: "02", title: "Submit your requirement", body: "Tell us quantity, delivery city and destination station." },
            { step: "03", title: "We confirm the order", body: "Our team sources, invoices and dispatches — one point of contact." },
          ].map((s) => (
            <View
              key={s.step}
              style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.accent }}>{s.step}</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, marginTop: 6 }}>{s.title}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4, lineHeight: 18 }}>
                {s.body}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Listings ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <SectionLabel>Live on FarmsClub</SectionLabel>
          <Pressable onPress={() => router.push("/listings")}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brand }}>View all →</Text>
          </Pressable>
        </View>

        {listings === null && !error ? (
          <LoadingState label="Loading live listings…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : listings!.length === 0 ? (
          <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, marginTop: spacing.lg }}>
            No listings are live yet — check back soon.
          </Text>
        ) : (
          <FlatList
            data={listings!.slice(0, 8)}
            key={columns}
            numColumns={columns}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            columnWrapperStyle={columns > 1 ? { gap: spacing.md } : undefined}
            contentContainerStyle={{ gap: spacing.md, marginTop: spacing.md }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <ListingCard listing={item} />
              </View>
            )}
          />
        )}
      </View>
    </AppShell>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: colors.inkFaint }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  hero: {},
  categoryCard: { borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16, minWidth: 140 },
  stepCard: { borderWidth: 1, padding: 16, flexGrow: 1, flexBasis: 220 },
});
