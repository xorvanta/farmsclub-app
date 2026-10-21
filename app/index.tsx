import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentWidth } from "@/components/AppShell";
import { SectionTitle } from "@/components/SectionTitle";
import { SearchBar } from "@/components/SearchBar";
import { FarmCard, fromHomeFarmCard } from "@/components/FarmCard";
import { ListingCard } from "@/components/ListingCard";
import { PressableLink } from "@/components/PressableLink";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { FaqList, cleanFaqs } from "@/components/FaqAccordion";
import { LogoMark } from "@/components/graphics/LogoMark";
import { useFcCategories } from "@/lib/useFcCategories";
import { fcApi } from "@/lib/api";
import type { FcContent, FcFilters } from "@/lib/types";

/** Spec §4 draft copy — used until /public/fc/content answers (admin edits the live text). */
const DEFAULT_HERO = {
  headline: "India's trusted farm network",
  subline: "Meet the farms behind India's orchards and plantations, and source planting material in bulk from the same network.",
  searchPlaceholder: "Search a crop or state, e.g. mango, teak, Bihar",
};
const DEFAULT_OFFERS = [
  { title: "Real farm stories", line: "Filmed on the ground by our team" },
  { title: "Bulk planting material", line: "Saplings priced by quantity" },
  { title: "Delivery by road or rail", line: "Arranged from the nearest source" },
  { title: "One point of contact", line: "From quote to dispatch" },
];
const DEFAULT_BANNER = {
  title: "Own a farm?",
  subline: "Share your story with buyers and future farmers across India.",
  buttonLabel: "List your farm (free)",
};

const TRACKS: { title: string; cta: { label: string; href: "/listings" | "/list-your-farm" }; steps: string[] }[] = [
  { title: "Buying in bulk", cta: { label: "Get bulk planting material", href: "/listings" }, steps: ["Choose your plants", "Request a quote", "We confirm price and dispatch"] },
  { title: "Own a farm", cta: { label: "List your farm", href: "/list-your-farm" }, steps: ["List your farm", "Our team reviews it", "Buyers and new farmers discover you"] },
];

const text = (v: string | undefined | null, fallback: string) => (v && v.trim() ? v.trim() : fallback);

export default function Home() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = useContentWidth();
  const wide = width >= 860;
  const compact = width < 560;
  const categories = useFcCategories();

  const [content, setContent] = useState<FcContent | null>(null);
  const [filters, setFilters] = useState<FcFilters | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    fcApi.getContent().then(setContent).catch(() => setContent(null));
    fcApi.getFilters().then(setFilters).catch(() => setFilters(null));
  }, []);
  useEffect(() => load(), [load]);

  const hero = { ...DEFAULT_HERO, ...pickText(content?.hero) };
  const offers = content?.offers?.filter((o) => o?.title?.trim()).slice(0, 4) ?? DEFAULT_OFFERS;
  const banner = { ...DEFAULT_BANNER, ...pickText(content?.banner) };
  const farms = (content?.featuredFarms ?? []).slice(0, 6).map(fromHomeFarmCard);
  const listings = (content?.featuredListings ?? []).slice(0, 6);
  const faqs = cleanFaqs(content?.homeFaqs).slice(0, 5);
  const heroPhoto = farms.find((f) => f.image)?.image ?? null;

  const stateChips = (filters?.states ?? []).filter((s) => s.farms > 0).slice(0, 10);
  const cropChips = (filters?.crops ?? []).filter((c) => c.farms > 0).slice(0, 12);

  const submitSearch = () => {
    const q = query.trim();
    if (q.length >= 1) router.push({ pathname: "/search", params: { q } });
  };

  const listingColumns = contentWidth < 480 ? 1 : contentWidth < 900 ? 2 : 3;
  const listingWidth = Math.floor((contentWidth - spacing.md * (listingColumns - 1)) / listingColumns);
  const farmCardWidth = compact ? Math.min(300, width * 0.78) : 300;
  const tileColumns = contentWidth < 480 ? 2 : contentWidth < 900 ? 3 : 4;
  const tileWidth = Math.floor((contentWidth - spacing.md * (tileColumns - 1)) / tileColumns);

  const section = { width: "100%" as const, maxWidth: 1232, alignSelf: "center" as const, paddingHorizontal: spacing.lg, marginTop: spacing.xxxl };

  return (
    <AppShell>
      <SeoHead
        title="FarmsClub · India's trusted farm network"
        description={hero.subline}
        image={content?.shareImageUrl ?? null}
      />

      {/* 1 · Hero */}
      <View style={[styles.hero, { minHeight: wide ? 480 : compact ? 420 : 460, paddingVertical: compact ? spacing.xxl : spacing.xxxl }]}>
        {heroPhoto ? <Photo uri={heroPhoto} alt="" eager style={StyleSheet.absoluteFill} sizes="100vw" /> : null}
        <LinearGradient
          colors={heroPhoto ? ["rgba(12,41,26,0.86)", "rgba(12,41,26,0.62)"] : [colors.brand, colors.brandDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg }}>
          <View style={{ maxWidth: 640 }}>
            <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: wide ? 48 : compact ? 32 : 38, lineHeight: wide ? 54 : compact ? 38 : 44, color: "#FFFFFF" }}>
              {hero.headline}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: compact ? 15 : 17, lineHeight: compact ? 22 : 26, color: "rgba(255,255,255,0.9)", marginTop: spacing.md }}>
              {hero.subline}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl }}>
              <Link href="/farms" asChild>
                <Button label="Explore farms" />
              </Link>
              <Link href="/listings" asChild>
                <Button label="Get bulk planting material" variant="outline" inverted />
              </Link>
            </View>
            <View style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm, alignItems: "center" }} accessibilityRole="search">
              <View style={{ flex: 1 }}>
                <SearchBar value={query} onChangeText={setQuery} placeholder={hero.searchPlaceholder} onSubmit={submitSearch} />
              </View>
              <Pressable
                onPress={submitSearch}
                accessibilityRole="button"
                accessibilityLabel="Search farms and listings"
                style={({ pressed }) => ({ height: 50, paddingHorizontal: 18, borderRadius: radius.md, backgroundColor: colors.cta, justifyContent: "center", opacity: pressed ? 0.88 : 1 })}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: "#FFFFFF" }}>Search</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* 2 · What we offer */}
      <View style={[section, { marginTop: spacing.xxl }]}>
        <Text accessibilityRole="header" aria-level={2} style={visuallyHidden}>
          What we offer
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {offers.map((o, i) => (
            <View
              key={o.title}
              style={{
                flexGrow: 1,
                flexBasis: compact ? "45%" : 220,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: 8,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                <OfferIcon index={i} color={colors.brand} />
              </View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink }}>{o.title}</Text>
              {o.line ? <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.inkSoft }}>{o.line}</Text> : null}
            </View>
          ))}
        </View>
      </View>

      {/* 3 · Farm stories */}
      {farms.length > 0 ? (
        <View style={section}>
          <SectionTitle title="Real farms, filmed on the ground." linkLabel="See all farms" href="/farms" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.md, marginHorizontal: -spacing.lg }}
            contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 6 }}
            accessibilityLabel="Farm stories"
          >
            {farms.map((f) => (
              <View key={f.slug} style={{ width: farmCardWidth }}>
                <FarmCard farm={f} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 4 · Browse farms */}
      {stateChips.length > 0 || cropChips.length > 0 ? (
        <View style={section}>
          <SectionTitle title="Browse farms" subtitle="By state or by crop" />
          {stateChips.length > 0 ? (
            <ChipRow label="States" items={stateChips.map((s) => ({ key: s.slug, label: s.name, href: { pathname: "/farms", params: { state: s.slug } } }))} />
          ) : null}
          {cropChips.length > 0 ? (
            <ChipRow label="Crops" items={cropChips.map((c) => ({ key: c.slug, label: c.name, href: { pathname: "/farms", params: { crop: c.slug } } }))} />
          ) : null}
        </View>
      ) : null}

      {/* 5 · Bulk planting material */}
      {categories.length > 0 || listings.length > 0 ? (
        <View style={section}>
          <SectionTitle title="Plantation stock, priced by quantity." linkLabel="See all" href="/listings" />
          {categories.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
              {categories.map((c) => (
                <PressableLink
                  key={c.slug}
                  href={{ pathname: "/listings", params: { category: c.slug } }}
                  accessibilityLabel={`${c.name_en} — bulk supply`}
                  style={({ pressed }) => [
                    {
                      width: tileWidth,
                      aspectRatio: 1.35,
                      borderRadius: radius.lg,
                      overflow: "hidden",
                      backgroundColor: colors.brand,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  {c.image_url ? <Photo uri={c.image_url} alt="" style={StyleSheet.absoluteFill} /> : (
                    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                      <LogoMark size={40} onDark />
                    </View>
                  )}
                  <LinearGradient colors={["transparent", "rgba(12,41,26,0.85)"]} style={[StyleSheet.absoluteFill, { top: "35%" }]} />
                  <View style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                    <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 15, color: "#FFFFFF" }}>
                      {c.name_en}
                    </Text>
                  </View>
                </PressableLink>
              ))}
            </View>
          ) : null}
          {listings.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg }}>
              {listings.map((l) => (
                <View key={l.id} style={{ width: listingWidth }}>
                  <ListingCard listing={l} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 6 · How it works — two tracks */}
      <View style={section}>
        <SectionTitle title="How it works" linkLabel="Learn more" href="/about" />
        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.md, marginTop: spacing.md }}>
          {TRACKS.map((t) => (
            <View key={t.title} style={{ flex: wide ? 1 : undefined, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
              <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink }}>
                {t.title}
              </Text>
              {t.steps.map((s, i) => (
                <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.brand }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink }}>{s}</Text>
                </View>
              ))}
              <Link href={t.cta.href} asChild>
                <Button label={t.cta.label} variant="secondary" />
              </Link>
            </View>
          ))}
        </View>
      </View>

      {/* 7 · List your farm banner */}
      <View style={[section, { paddingHorizontal: 0 }]}>
        <SectionBanner title={banner.title} body={banner.subline}>
          {content && content.registrationOpen === false ? (
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: "#FFFFFF" }}>Registrations are paused right now.</Text>
          ) : (
            <Link href="/list-your-farm" asChild>
              <Button label={banner.buttonLabel} />
            </Link>
          )}
        </SectionBanner>
      </View>

      {/* 8 · Short FAQ */}
      {faqs.length > 0 ? (
        <View style={[section, { maxWidth: 820, marginBottom: spacing.xxl }]}>
          <SectionTitle title="Questions, answered" linkLabel="All FAQs" href="/faqs" />
          <View style={{ marginTop: spacing.md }}>
            <FaqList faqs={faqs} />
          </View>
        </View>
      ) : (
        <View style={{ height: spacing.xxl }} />
      )}
    </AppShell>
  );
}

/** Non-empty string fields of an admin content block, so blanks fall back to the spec copy. */
function pickText<T extends object>(block: T | null | undefined): Partial<T> {
  const out: Partial<T> = {};
  if (!block) return out;
  for (const [k, v] of Object.entries(block)) if (typeof v === "string" && v.trim()) (out as Record<string, string>)[k] = v.trim();
  return out;
}

function ChipRow({ label, items }: { label: string; items: { key: string; label: string; href: { pathname: "/farms"; params: Record<string, string> } }[] }) {
  const { colors, fonts, spacing, radius } = useTheme();
  return (
    <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: colors.inkSoft }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {items.map((it) => (
          <PressableLink
            key={it.key}
            href={it.href}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 16,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.brandSoft : colors.surface,
            })}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>{it.label}</Text>
          </PressableLink>
        ))}
      </View>
    </View>
  );
}

/** Simple line icons for the four "What we offer" items (in content order). */
function OfferIcon({ index, color }: { index: number; color: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (index % 4) {
    case 0: // camera — filmed farm stories
      return (
        <Svg {...p}>
          <Rect x={3} y={6.5} width={13} height={11} rx={2} />
          <Path d="m16 10.5 5-3v9l-5-3" />
        </Svg>
      );
    case 1: // sapling
      return (
        <Svg {...p}>
          <Path d="M12 20v-8" />
          <Path d="M12 13c0-3.5 2.5-6 6.5-6.5-.5 4-3 6.5-6.5 6.5Z" />
          <Path d="M12 15c0-3-2-5-5.5-5.5.5 3.3 2.5 5.5 5.5 5.5Z" />
          <Path d="M7 20h10" />
        </Svg>
      );
    case 2: // truck
      return (
        <Svg {...p}>
          <Rect x={2.5} y={8} width={11} height={8} rx={1} />
          <Path d="M13.5 11h3.5l3.5 3.5V16h-7" />
          <Circle cx={7} cy={18.5} r={1.7} />
          <Circle cx={17} cy={18.5} r={1.7} />
        </Svg>
      );
    default: // person / one contact
      return (
        <Svg {...p}>
          <Circle cx={12} cy={8} r={3.5} />
          <Path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </Svg>
      );
  }
}

const visuallyHidden = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" as const, opacity: 0 };

const styles = StyleSheet.create({
  hero: { position: "relative", overflow: "hidden", justifyContent: "center" },
});
