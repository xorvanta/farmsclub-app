import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, type Href } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell, useContentWidth } from "@/components/AppShell";
import { SectionTitle } from "@/components/SectionTitle";
import { SearchBar } from "@/components/SearchBar";
import { FarmCard, fromHomeFarmCard, placeLine, type FarmCardData } from "@/components/FarmCard";
import { ListingCard } from "@/components/ListingCard";
import { PressableLink } from "@/components/PressableLink";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { FaqList, cleanFaqs } from "@/components/FaqAccordion";
import { LogoMark } from "@/components/graphics/LogoMark";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { Rail } from "@/components/home/Rail";
import { VideoShowcase, mergeVideos } from "@/components/home/VideoShowcase";
import { Orchard3DPlanner } from "@/components/tools/Orchard3DPlanner";
import { HOME_PHOTOS } from "@/constants/homePhotos";
import { useFcCategories } from "@/lib/useFcCategories";
import { fcApi } from "@/lib/api";
import { useChat } from "@/lib/chat-context";
import { useTour } from "@/lib/tour-context";
import type { FcContent, FcFilters } from "@/lib/types";

/** Spec §4 draft copy — used until /public/fc/content answers (admin edits the live text). */
const DEFAULT_HERO = {
  headline: "India's trusted farm network",
  subline: "Meet the farms behind India's orchards and plantations, and source planting material in bulk from the same network.",
  searchPlaceholder: "Search a crop or state, e.g. mango, teak, Bihar",
};
const DEFAULT_OFFERS = [
  { title: "Real farm stories", line: "Filmed on the ground" },
  { title: "Bulk planting material", line: "Tiered volume pricing" },
  { title: "Road & rail dispatch", line: "Nearest verified source" },
  { title: "One point of contact", line: "Quote to delivery" },
];
const HELP_BANNER = {
  title: "Planning a commercial orchard or bulk procurement?",
  body: "Simulate your acreage above, ask Trellis AI any time, or send our trade desk your requirement for a custom wholesale quote.",
};
const DEFAULT_BANNER = {
  title: "Own a farm?",
  subline: "Share your story with buyers and future farmers across India.",
  buttonLabel: "List your farm (free)",
};

const TRACKS: {
  badge: string;
  title: string;
  photo: string;
  cta: { label: string; href: "/listings" | "/list-your-farm" };
  steps: { tag: string; label: string }[];
}[] = [
  {
    badge: "FOR COMMERCIAL BUYERS",
    title: "Buying in bulk",
    photo: HOME_PHOTOS.seedlings,
    cta: { label: "Browse Bulk Supply →", href: "/listings" },
    steps: [
      { tag: "STEP 01", label: "Pick crop & quantity slab" },
      { tag: "STEP 02", label: "Submit 1-click quote request" },
      { tag: "STEP 03", label: "Road or rail dispatch arranged" },
    ],
  },
  {
    badge: "FOR GROWERS & NURSERIES",
    title: "Own a farm",
    photo: HOME_PHOTOS.trellis,
    cta: { label: "List Your Farm (Free) →", href: "/list-your-farm" },
    steps: [
      { tag: "STEP 01", label: "2-minute free registration" },
      { tag: "STEP 02", label: "On-ground team review & film" },
      { tag: "STEP 03", label: "Discovered by pan-India buyers" },
    ],
  },
];

const GOLD = "#E5B462";

export default function Home() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = useContentWidth();
  const wide = width >= 860;
  const compact = width < 560;
  const categories = useFcCategories();
  const { openChat } = useChat();
  const { openTour } = useTour();

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
  const featured = content?.featuredFarms ?? [];
  const farms = featured.slice(0, 6).map(fromHomeFarmCard);
  const listings = (content?.featuredListings ?? []).slice(0, 8);
  const faqs = cleanFaqs(content?.homeFaqs).slice(0, 5);
  const registrationOpen = !(content && content.registrationOpen === false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slides = useMemo(() => buildSlides(content, hero, banner, farms, registrationOpen), [content, registrationOpen]);
  const videos = mergeVideos(
    (content?.homeVideos ?? []).map((v) => ({ videoId: v.videoId, title: v.title, farmSlug: v.farmSlug ?? null, farmName: v.farmName ?? null })),
    featured.filter((f) => f.heroVideoId).map((f) => ({ videoId: f.heroVideoId as string, title: f.name, farmSlug: f.slug, farmName: f.name })),
  );

  const stateChips = (filters?.states ?? []).filter((s) => s.farms > 0).slice(0, 10);
  const cropChips = (filters?.crops ?? []).filter((c) => c.farms > 0).slice(0, 12);
  const popular = cropChips.slice(0, compact ? 4 : 6);

  const submitSearch = () => {
    const q = query.trim();
    if (q.length >= 1) router.push({ pathname: "/search", params: { q } });
  };

  const listingWidth = compact ? Math.min(285, Math.floor(width * 0.76)) : 290;
  const farmCardWidth = compact ? Math.min(300, Math.floor(width * 0.78)) : 300;
  const tileColumns = contentWidth < 480 ? 2 : contentWidth < 900 ? 3 : Math.min(6, Math.max(4, categories.length));
  const tileWidth = Math.floor((contentWidth - spacing.md * (tileColumns - 1)) / tileColumns);
  const heroHeight = wide ? 590 : compact ? 370 : 510;

  const section = { width: "100%" as const, maxWidth: 1232, alignSelf: "center" as const, paddingHorizontal: spacing.lg, marginTop: wide ? 68 : 40 };

  return (
    <AppShell>
      <SeoHead
        title="FarmsClub · India's trusted farm network"
        description={hero.subline}
        image={content?.shareImageUrl ?? null}
      />

      {/* 1 · Executive B2B Hero Carousel */}
      <HeroCarousel slides={slides} height={heroHeight}>
        <Text accessibilityRole="header" aria-level={1} style={visuallyHidden}>
          {hero.headline}
        </Text>
      </HeroCarousel>

      {/* 2 · Floating B2B Trade Command Dock */}
      <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, marginTop: compact ? -28 : -48, zIndex: 3 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: compact ? 14 : spacing.xl,
            gap: compact ? 12 : spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#081E12",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 8,
          }}
        >
          {/* Search Command Input */}
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }} accessibilityRole="search">
            <View style={{ flex: 1, minWidth: 0 }}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder={compact ? shortPlaceholder(hero.searchPlaceholder) : hero.searchPlaceholder}
                onSubmit={submitSearch}
              />
            </View>
            <Pressable
              onPress={submitSearch}
              accessibilityRole="button"
              accessibilityLabel="Search farms and listings"
              style={({ pressed }) => ({
                height: 48,
                paddingHorizontal: compact ? 16 : 28,
                borderRadius: radius.md,
                backgroundColor: pressed ? "#A54C12" : colors.cta,
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: "#A54C12",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 3,
              })}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: compact ? 13.5 : 14.5, color: "#FFFFFF" }}>Search</Text>
            </Pressable>
          </View>

          {/* Instant Crop Pills + Desktop Quick Tour Trigger */}
          {popular.length > 0 || !compact ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
              {popular.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: colors.inkSoft }}>
                    Top Crops:
                  </Text>
                  {popular.map((c) => (
                    <PressableLink
                      key={c.slug}
                      href={{ pathname: "/farms", params: { crop: c.slug } }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: radius.pill,
                        backgroundColor: pressed ? colors.brandSoft : colors.paper,
                        borderWidth: 1,
                        borderColor: colors.border,
                      })}
                    >
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink }}>{c.name}</Text>
                    </PressableLink>
                  ))}
                </View>
              ) : <View />}

              {!compact ? (
                <Pressable
                  onPress={() => openTour(0)}
                  accessibilityRole="button"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    backgroundColor: colors.goldSoft,
                    borderWidth: 1,
                    borderColor: colors.gold,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.goldDark }}>✦ Platform Overview (30s Tour) →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <Text accessibilityRole="header" aria-level={2} style={visuallyHidden}>
            What we offer
          </Text>

          {/* 4 Visual B2B Pillar Badges — Full text legibility on mobile (zero ellipsis truncation) */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: compact ? 8 : spacing.md, columnGap: compact ? 8 : spacing.md }}>
            {offers.map((o, i) => (
              <View
                key={o.title}
                style={{
                  flexGrow: 1,
                  flexBasis: compact ? "46%" : 200,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: compact ? 8 : spacing.sm,
                  backgroundColor: colors.paper,
                  paddingVertical: compact ? 9 : 10,
                  paddingHorizontal: compact ? 10 : 12,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: compact ? 28 : 38,
                    height: compact ? 28 : 38,
                    borderRadius: compact ? 14 : 19,
                    backgroundColor: i % 2 ? colors.accentSoft : colors.brandSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  <OfferIcon index={i} color={i % 2 ? colors.accentDark : colors.brand} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <Text style={{ fontFamily: fonts.heading, fontSize: compact ? 12.5 : 13.5, lineHeight: compact ? 16 : 18, color: colors.ink }}>
                    {o.title}
                  </Text>
                  {o.line ? (
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: compact ? 11 : 11.5, lineHeight: compact ? 14.5 : 16, color: colors.inkSoft }}>
                      {o.line}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 3 · Bulk Planting Material — Category Bento + Live Lots Rail */}
      {categories.length > 0 || listings.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="WHOLESALE SUPPLY LOTS" title="Bulk planting stock, priced by volume." linkLabel="Explore Bulk Supply" href="/listings" />
          {categories.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg }}>
              {categories.map((c) => (
                <PressableLink
                  key={c.slug}
                  href={{ pathname: "/listings", params: { category: c.slug } }}
                  accessibilityLabel={`${c.name_en} — bulk supply`}
                  style={({ pressed }) => [
                    {
                      width: tileWidth,
                      aspectRatio: 0.94,
                      borderRadius: radius.lg,
                      overflow: "hidden",
                      backgroundColor: colors.brandDark,
                      borderWidth: 1,
                      borderColor: "rgba(229,180,98,0.28)",
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  {c.image_url ? (
                    <Photo uri={c.image_url} alt="" style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                      <LogoMark size={42} onDark />
                    </View>
                  )}
                  <LinearGradient colors={["rgba(8,30,18,0.25)", "transparent", "rgba(8,30,18,0.92)"]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />

                  {c.listing_count ? (
                    <View style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(8,30,18,0.82)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(229,180,98,0.35)" }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: GOLD }}>{c.listing_count} Lots</Text>
                    </View>
                  ) : null}

                  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12, gap: 3 }}>
                    <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: compact ? 14.5 : 16, lineHeight: compact ? 19 : 21, color: "#FFFFFF" }}>
                      {c.name_en}
                    </Text>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: GOLD }}>Wholesale Slabs →</Text>
                  </View>
                </PressableLink>
              ))}
            </View>
          ) : null}

          {listings.length > 0 ? (
            <View style={{ marginTop: categories.length > 0 ? spacing.xxl : spacing.lg }}>
              {categories.length > 0 ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                    <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.ink }}>
                      {content?.featuredListingsSource === "admin" ? "Featured Bulk Lots" : "Live Bulk Lots"}
                    </Text>
                  </View>
                  <Link href="/listings" style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.brand }}>
                    View all lots →
                  </Link>
                </View>
              ) : null}
              <Rail items={listings} itemWidth={listingWidth} keyOf={(l) => String(l.id)} render={(l) => <ListingCard listing={l} />} label="Bulk planting material" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={section}>
          <PhotoPanel
            photo={HOME_PHOTOS.seedlings}
            eyebrow="WHOLESALE SUPPLY"
            title="Planting material in bulk"
            body="Select your crop and quantity slab. Our trade desk confirms live batch availability and dispatch."
          >
            <Link href="/contact" asChild>
              <Button label="Send a bulk enquiry" fullWidth={compact} />
            </Link>
            <Link href="/listings" asChild>
              <Button label="See bulk supply" variant="outline" inverted fullWidth={compact} />
            </Link>
          </PhotoPanel>
        </View>
      )}

      {/* 4 · Flagship Interactive 3D Orchard & Bulk Load Visualizer */}
      <View style={section}>
        <Orchard3DPlanner />
      </View>

      {/* 5 · See the farms — documentary video showcase */}
      <VideoShowcase videos={videos} title="See the farms on the ground" subtitle={offers[0]?.line || undefined} />

      {/* 6 · Verified Farm Stories Rail */}
      {farms.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="VERIFIED GROWER NETWORK" title="Real farms, filmed on the ground." linkLabel="Explore all farms" href="/farms" />
          <View style={{ marginTop: spacing.lg }}>
            <Rail items={farms} itemWidth={farmCardWidth} keyOf={(f) => f.slug} render={(f) => <FarmCard farm={f} />} label="Farm stories" />
          </View>
        </View>
      ) : null}

      {/* 7 · Visual Pan-India Network Explorer (States & Crops Matrix) */}
      {stateChips.length > 0 || cropChips.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="PAN-INDIA NETWORK" title="Explore farms by state or crop belt" linkLabel="Directory" href="/farms" />
          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: compact ? spacing.lg : spacing.xl,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.lg,
            }}
          >
            {stateChips.length > 0 ? (
              <VisualFilterGrid
                label="STATE BELTS"
                icon="📍"
                items={stateChips.map((s) => ({
                  key: s.slug,
                  label: s.name,
                  count: s.farms,
                  href: { pathname: "/farms", params: { state: s.slug } },
                }))}
              />
            ) : null}
            {stateChips.length > 0 && cropChips.length > 0 ? <View style={{ height: 1, backgroundColor: colors.border }} /> : null}
            {cropChips.length > 0 ? (
              <VisualFilterGrid
                label="MAJOR CROPS"
                icon="🌱"
                items={cropChips.map((c) => ({
                  key: c.slug,
                  label: c.name,
                  count: c.farms,
                  href: { pathname: "/farms", params: { crop: c.slug } },
                }))}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {/* 8 · Visual Dual-Track Trade Architecture */}
      <View style={section}>
        <SectionHead eyebrow="TRADE ARCHITECTURE" title="Two ways to use FarmsClub" linkLabel="How it works" href="/about" />
        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, marginTop: spacing.lg }}>
          {TRACKS.map((t) => (
            <View
              key={t.title}
              style={{
                flex: wide ? 1 : undefined,
                minHeight: compact ? 310 : 370,
                borderRadius: radius.xl,
                overflow: "hidden",
                backgroundColor: colors.brandDark,
                justifyContent: "flex-end",
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.28)",
              }}
            >
              <Photo uri={t.photo} alt="" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={["rgba(6,22,13,0.2)", "rgba(6,22,13,0.68)", "rgba(6,22,13,0.96)"]}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: compact ? spacing.lg : spacing.xl, gap: spacing.md }}>
                <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(229,180,98,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(229,180,98,0.4)" }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: GOLD }}>{t.badge}</Text>
                </View>

                <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.display, fontSize: compact ? 23 : 28, color: "#FFFFFF" }}>
                  {t.title}
                </Text>

                <View style={{ flexDirection: compact ? "column" : "row", gap: 8 }}>
                  {t.steps.map((s, i) => (
                    <View
                      key={s.tag}
                      style={{
                        flex: compact ? undefined : 1,
                        backgroundColor: i === t.steps.length - 1 ? "rgba(229,180,98,0.18)" : "rgba(255,255,255,0.08)",
                        borderRadius: radius.md,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: i === t.steps.length - 1 ? GOLD : "rgba(255,255,255,0.14)",
                        gap: 2,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: GOLD }}>{s.tag}</Text>
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: "#FFFFFF", lineHeight: 18 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {t.cta.href === "/list-your-farm" && !registrationOpen ? null : (
                  <View style={{ alignSelf: compact ? "stretch" : "flex-start", marginTop: 4 }}>
                    <Link href={t.cta.href} asChild>
                      <Button label={t.cta.label} variant="primary" fullWidth={compact} />
                    </Link>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 9 · Trellis Concierge Banner */}
      <View style={[section, { paddingHorizontal: 0 }]}>
        <SectionBanner tone="accent" eyebrow="TRELLIS AI & TRADE CONCIERGE" title={HELP_BANNER.title} body={HELP_BANNER.body}>
          <View style={{ flexDirection: compact ? "column" : "row", flexWrap: compact ? "nowrap" : "wrap", gap: spacing.sm }}>
            <Button label="Ask Trellis AI" variant="secondary" onPress={() => openChat()} fullWidth={compact} />
            <Link href="/contact" asChild>
              <Button label="Send Bulk Requirement →" variant="outline" inverted fullWidth={compact} />
            </Link>
          </View>
        </SectionBanner>
      </View>

      {/* 10 · Short FAQ */}
      {faqs.length > 0 ? (
        <View style={[section, { maxWidth: 860, marginBottom: spacing.xxxl }]}>
          <SectionTitle title="Quick Answers" linkLabel="All FAQs" href="/faqs" />
          <View style={{ marginTop: spacing.md }}>
            <FaqList faqs={faqs} />
          </View>
        </View>
      ) : (
        <View style={{ height: spacing.xxxl }} />
      )}
    </AppShell>
  );
}

function buildSlides(
  content: FcContent | null,
  hero: typeof DEFAULT_HERO,
  banner: typeof DEFAULT_BANNER,
  farms: FarmCardData[],
  registrationOpen: boolean,
): HeroSlide[] {
  const admin = (content?.heroSlides ?? []).filter((s) => s?.imageUrl && s?.title?.trim());
  if (admin.length > 0) {
    return admin.map((s, i) => ({
      key: `admin-${i}`,
      image: s.imageUrl,
      title: s.title,
      subline: s.subline || null,
      cta: s.ctaLabel && s.ctaHref ? { label: s.ctaLabel, href: s.ctaHref as Href } : null,
    }));
  }
  const out: HeroSlide[] = [
    {
      key: "welcome",
      image: HOME_PHOTOS.polytunnel,
      eyebrow: "INDIA'S SOVEREIGN B2B FARM EXCHANGE",
      title: hero.headline,
      subline: hero.subline,
      cta: { label: "Browse Bulk Supply →", href: "/listings" },
      secondary: { label: "Explore Verified Farms", href: "/farms" },
    },
  ];
  for (const f of farms.filter((x) => x.image).slice(0, 2)) {
    out.push({
      key: `farm-${f.slug}`,
      image: f.image as string,
      eyebrow: placeLine(f.district, f.state),
      title: f.name,
      subline: f.crops.length ? f.crops.slice(0, 3).join(" · ") : null,
      cta: { label: "Inspect Farm Dossier →", href: { pathname: "/farms/[slug]", params: { slug: f.slug } } },
    });
  }
  out.push({
    key: "bulk",
    image: HOME_PHOTOS.trellis,
    eyebrow: "WHOLESALE QUANTITY SLABS",
    title: "Bulk planting material",
    subline: "Saplings priced by quantity slab, dispatched by road truck or Indian Railways.",
    cta: { label: "Explore Bulk Supply →", href: "/listings" },
    secondary: { label: "Send Custom RFQ", href: "/contact" },
  });
  out.push({
    key: "own-a-farm",
    image: HOME_PHOTOS.planting,
    eyebrow: "GROWER NETWORK",
    title: banner.title,
    subline: banner.subline,
    cta: registrationOpen ? { label: banner.buttonLabel, href: "/list-your-farm" } : null,
  });
  return out;
}

function SectionHead({ eyebrow, title, linkLabel, href }: { eyebrow: string; title: string; linkLabel?: string; href?: Href }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: colors.accentDark }}>
          {eyebrow}
        </Text>
      </View>
      <SectionTitle title={title} linkLabel={linkLabel} href={href} />
    </View>
  );
}

function PhotoPanel({ photo, eyebrow, title, body, children }: { photo: string; eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  const { fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  return (
    <View style={{ borderRadius: radius.xl, overflow: "hidden", minHeight: compact ? 320 : 360, justifyContent: "center" }}>
      <Photo uri={photo} alt="" style={StyleSheet.absoluteFill} sizes="100vw" />
      <LinearGradient colors={["rgba(8,28,18,0.92)", "rgba(8,28,18,0.58)", "rgba(8,28,18,0.15)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={{ padding: compact ? spacing.lg : spacing.xxl, maxWidth: 560, gap: spacing.md }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>{eyebrow}</Text>
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: compact ? 26 : 34, lineHeight: compact ? 32 : 40, color: "#FFFFFF" }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: compact ? 14.5 : 16, lineHeight: compact ? 21 : 24, color: "rgba(255,255,255,0.9)" }}>{body}</Text>
        {children ? <View style={{ flexDirection: compact ? "column" : "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>{children}</View> : null}
      </View>
    </View>
  );
}

function shortPlaceholder(_text: string): string {
  return "Search crop or state…";
}

function pickText<T extends object>(block: T | null | undefined): Partial<T> {
  const out: Partial<T> = {};
  if (!block) return out;
  for (const [k, v] of Object.entries(block)) if (typeof v === "string" && v.trim()) (out as Record<string, string>)[k] = v.trim();
  return out;
}

function VisualFilterGrid({
  label,
  icon,
  items,
}: {
  label: string;
  icon: string;
  items: { key: string; label: string; count: number; href: { pathname: "/farms"; params: Record<string, string> } }[];
}) {
  const { colors, fonts, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", color: colors.inkSoft }}>
        {icon} {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {items.map((it) => (
          <PressableLink
            key={it.key}
            href={it.href}
            style={({ pressed }) => ({
              minHeight: 42,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingLeft: 14,
              paddingRight: 10,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.brandSoft : colors.paper,
            })}
          >
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink }}>{it.label}</Text>
            {it.count > 0 ? (
              <View style={{ backgroundColor: colors.brandSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.brand }}>{it.count}</Text>
              </View>
            ) : null}
          </PressableLink>
        ))}
      </View>
    </View>
  );
}

function OfferIcon({ index, color }: { index: number; color: string }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (index % 4) {
    case 0:
      return (
        <Svg {...p}>
          <Rect x={3} y={6.5} width={13} height={11} rx={2} />
          <Path d="m16 10.5 5-3v9l-5-3" />
        </Svg>
      );
    case 1:
      return (
        <Svg {...p}>
          <Path d="M12 20v-8" />
          <Path d="M12 13c0-3.5 2.5-6 6.5-6.5-.5 4-3 6.5-6.5 6.5Z" />
          <Path d="M12 15c0-3-2-5-5.5-5.5.5 3.3 2.5 5.5 5.5 5.5Z" />
          <Path d="M7 20h10" />
        </Svg>
      );
    case 2:
      return (
        <Svg {...p}>
          <Rect x={2.5} y={8} width={11} height={8} rx={1} />
          <Path d="M13.5 11h3.5l3.5 3.5V16h-7" />
          <Circle cx={7} cy={18.5} r={1.7} />
          <Circle cx={17} cy={18.5} r={1.7} />
        </Svg>
      );
    default:
      return (
        <Svg {...p}>
          <Circle cx={12} cy={8} r={3.5} />
          <Path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </Svg>
      );
  }
}

const visuallyHidden = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" as const, opacity: 0 };
