import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, FlatList, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/Button";
import { CategoryArt } from "@/components/graphics/CategoryArt";
import { SectionBanner } from "@/components/SectionBanner";
import { FaqAccordion } from "@/components/FaqAccordion";
import { TrustBadges } from "@/components/TrustBadges";
import { CATEGORIES } from "@/constants/categories";
import { HERO_PHOTO, WAREHOUSE_PHOTO, NURSERY_WIDE_PHOTO, photoUrl } from "@/constants/categoryImages";
import { b2bApi, ApiError } from "@/lib/api";
import { useChat } from "@/lib/chat-context";
import type { B2bListing } from "@/lib/types";

export default function Home() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 4 : width >= 680 ? 3 : 2;
  const wide = width >= 860;
  const { openChat } = useChat();

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

      {/* ── Hero — real photo banner, full-bleed with a brand-tinted gradient for text legibility ── */}
      <View style={[styles.heroWrap, wide ? { height: 460 } : { height: 560 }]}>
        <Image
          source={{ uri: photoUrl(HERO_PHOTO, { w: Math.max(width, 900) * 1.5, h: wide ? 920 : 1120, q: 72 }) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={wide ? ["rgba(19,50,34,0.88)", "rgba(19,50,34,0.5)", "rgba(19,50,34,0.2)"] : ["rgba(19,50,34,0.55)", "rgba(19,50,34,0.92)"]}
          start={wide ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
          end={wide ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.heroContent, { paddingHorizontal: spacing.lg }, wide && { maxWidth: 560 }]}>
          <View style={[styles.kicker, { backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.3)" }]}>
            <View style={[styles.kickerDot, { backgroundColor: colors.accent }]} />
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.4, color: "#FFFFFF", textTransform: "uppercase" }}>
              Wholesale trade platform
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: wide ? 44 : 32, lineHeight: wide ? 50 : 38, color: "#FFFFFF", marginTop: 14 }}>
            Bulk plants, pots, tools &amp; fertiliser — priced for volume.
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15.5, color: "rgba(255,255,255,0.88)", marginTop: 12, maxWidth: 440, lineHeight: 23 }}>
            FarmsClub is Formulate India's wholesale arm. One flat bulk price per listing, sourced
            and delivered pan-India — our trade desk handles the rest.
          </Text>
          <View style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
            <Button label="Browse the catalogue" onPress={() => router.push("/listings")} />
            <Button label="How sourcing works" variant="outline" onPress={() => router.push("/about")} inverted />
          </View>
        </View>
      </View>

      {/* ── Trust badges — B2B credibility signals, not retail's payment/COD/guarantee badges ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <TrustBadges />
      </View>

      {/* ── Categories — full illustrated tiles, not just icon badges ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <SectionLabel>Shop by category</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => router.push({ pathname: "/listings", params: { category: c.value } })}
              style={({ pressed }) => [
                styles.categoryTile,
                { borderRadius: radius.lg, opacity: pressed ? 0.9 : 1 },
                columns >= 4 ? { width: "18.4%" } : width >= 680 ? { width: "31%" } : { width: "47%" },
              ]}
            >
              <CategoryArt category={c.value} style={StyleSheet.absoluteFill} />
              <View style={[styles.categoryTileLabel, { backgroundColor: "rgba(22,32,26,0.56)" }]}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 13.5, color: "#FFFFFF" }}>{c.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── How it works ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <SectionLabel>How sourcing works</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
          {[
            { step: "01", title: "Find your product", body: "Browse live listings at one flat bulk price, no haggling." },
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

      {/* ── Poster / promo banner — brand statement, breaks up the page rhythm ── */}
      <View style={{ marginTop: spacing.xxl }}>
        <SectionBanner
          eyebrow="Why FarmsClub"
          title="Built for volume. Priced like it."
          body="No per-item markup games, no negotiating from scratch every time — one flat bulk rate, confirmed by a real trade desk."
          photo={WAREHOUSE_PHOTO}
        />
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
          <EmptyCatalogueNote />
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

      {/* ── New-to-bulk promo — second banner, drives the two paths someone unsure might take ── */}
      <View style={{ marginTop: spacing.xxl }}>
        <SectionBanner
          eyebrow="New here?"
          title="Not sure where to start with bulk sourcing?"
          body="Chat with Trellis for quick answers, or tell our trade desk what you need and we'll guide you through it."
          tone="accent"
          photo={NURSERY_WIDE_PHOTO}
        >
          <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
            <Button label="Ask Trellis" onPress={() => openChat(null)} inverted />
            <Button label="Talk to the trade desk" variant="outline" onPress={() => router.push("/contact")} inverted />
          </View>
        </SectionBanner>
      </View>

      {/* ── FAQ teaser ── */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <SectionLabel>Frequently asked</SectionLabel>
          <Pressable onPress={() => router.push("/faqs")}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brand }}>View all →</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <FaqAccordion limit={5} />
        </View>
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

function EmptyCatalogueNote() {
  const { colors, fonts, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.emptyNote,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.md },
      ]}
    >
      <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>
        Listings are going live shortly
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginTop: 6, maxWidth: 420, lineHeight: 19 }}>
        Sellers are flagging their first bulk-priced products. Check back soon, or tell us what
        you're sourcing and our trade desk will get ahead of it for you.
      </Text>
      <View style={{ marginTop: spacing.lg, alignSelf: "flex-start" }}>
        <Button label="Tell us what you need" variant="outline" onPress={() => router.push("/contact")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { position: "relative", overflow: "hidden", justifyContent: "center" },
  heroContent: { width: "100%" },
  kicker: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  kickerDot: { width: 6, height: 6, borderRadius: 3 },
  categoryTile: { aspectRatio: 1.1, overflow: "hidden", position: "relative" },
  categoryTileLabel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingVertical: 8 },
  stepCard: { borderWidth: 1, padding: 16, flexGrow: 1, flexBasis: 220 },
  emptyNote: { borderWidth: 1 },
});
