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
import { HOME_PHOTOS } from "@/constants/homePhotos";
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

const TRACKS: { title: string; photo: string; cta: { label: string; href: "/listings" | "/list-your-farm" }; steps: string[] }[] = [
  { title: "Buying in bulk", photo: HOME_PHOTOS.seedlings, cta: { label: "Get bulk planting material", href: "/listings" }, steps: ["Choose your plants", "Request a quote", "We confirm price and dispatch"] },
  { title: "Own a farm", photo: HOME_PHOTOS.trellis, cta: { label: "List your farm", href: "/list-your-farm" }, steps: ["List your farm", "Our team reviews it", "Buyers and new farmers discover you"] },
];

const GOLD = "#E7B57A";

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
  const featured = content?.featuredFarms ?? [];
  const farms = featured.slice(0, 6).map(fromHomeFarmCard);
  const listings = (content?.featuredListings ?? []).slice(0, 8);
  const faqs = cleanFaqs(content?.homeFaqs).slice(0, 5);
  const registrationOpen = !(content && content.registrationOpen === false);

  // Slides change only when the content answer arrives (hero/banner/farms are derived from it).
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

  const listingWidth = compact ? Math.min(280, Math.floor(width * 0.74)) : 280;
  const farmCardWidth = compact ? Math.min(300, Math.floor(width * 0.78)) : 300;
  const tileColumns = contentWidth < 480 ? 2 : contentWidth < 900 ? 3 : Math.min(6, Math.max(4, categories.length));
  const tileWidth = Math.floor((contentWidth - spacing.md * (tileColumns - 1)) / tileColumns);
  const heroHeight = wide ? 600 : compact ? 520 : 560;

  const section = { width: "100%" as const, maxWidth: 1232, alignSelf: "center" as const, paddingHorizontal: spacing.lg, marginTop: wide ? 72 : 48 };

  return (
    <AppShell>
      <SeoHead
        title="FarmsClub · India's trusted farm network"
        description={hero.subline}
        image={content?.shareImageUrl ?? null}
      />

      {/* 1 · Photo carousel */}
      <HeroCarousel slides={slides} height={heroHeight}>
        <Text accessibilityRole="header" aria-level={1} style={visuallyHidden}>
          {hero.headline}
        </Text>
      </HeroCarousel>

      {/* 2 · Search card over the hero's bottom edge + what we offer */}
      <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, marginTop: compact ? -36 : -44, zIndex: 3 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: compact ? spacing.lg : spacing.xl,
            gap: spacing.lg,
            shadowColor: "#0C291A",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }} accessibilityRole="search">
            <View style={{ flex: 1 }}>
              <SearchBar value={query} onChangeText={setQuery} placeholder={hero.searchPlaceholder} onSubmit={submitSearch} />
            </View>
            <Pressable
              onPress={submitSearch}
              accessibilityRole="button"
              accessibilityLabel="Search farms and listings"
              style={({ pressed }) => ({ height: 50, paddingHorizontal: compact ? 16 : 26, borderRadius: radius.md, backgroundColor: colors.cta, justifyContent: "center", opacity: pressed ? 0.88 : 1 })}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: "#FFFFFF" }}>Search</Text>
            </Pressable>
          </View>
          {popular.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginTop: -spacing.xs }}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.inkSoft }}>Popular:</Text>
              {popular.map((c) => (
                <PressableLink
                  key={c.slug}
                  href={{ pathname: "/farms", params: { crop: c.slug } }}
                  style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: pressed ? colors.brandSoft : colors.paper, borderWidth: 1, borderColor: colors.border })}
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink }}>{c.name}</Text>
                </PressableLink>
              ))}
            </View>
          ) : null}
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Text accessibilityRole="header" aria-level={2} style={visuallyHidden}>
            What we offer
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg, columnGap: spacing.lg }}>
            {offers.map((o, i) => (
              <View key={o.title} style={{ flexGrow: 1, flexBasis: compact ? "42%" : 200, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: i % 2 ? colors.accentSoft : colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                  <OfferIcon index={i} color={i % 2 ? colors.accentDark : colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.heading, fontSize: 14.5, color: colors.ink }}>{o.title}</Text>
                  {o.line && !compact ? (
                    <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft }}>
                      {o.line}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 3 · Bulk planting material — category tiles + products */}
      {categories.length > 0 || listings.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="Bulk supply" title="Plantation stock, priced by quantity." linkLabel="See all" href="/listings" />
          {categories.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg }}>
              {categories.map((c) => (
                <PressableLink
                  key={c.slug}
                  href={{ pathname: "/listings", params: { category: c.slug } }}
                  accessibilityLabel={`${c.name_en} — bulk supply`}
                  style={({ pressed }) => [{ width: tileWidth, aspectRatio: 0.92, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.brand, opacity: pressed ? 0.92 : 1 }]}
                >
                  {c.image_url ? (
                    <Photo uri={c.image_url} alt="" style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                      <LogoMark size={40} onDark />
                    </View>
                  )}
                  <LinearGradient colors={["transparent", "rgba(12,41,26,0.88)"]} style={[StyleSheet.absoluteFill, { top: "40%" }]} />
                  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
                    <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 16, color: "#FFFFFF" }}>
                      {c.name_en}
                    </Text>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: GOLD, marginTop: 2 }}>Buy in bulk →</Text>
                  </View>
                </PressableLink>
              ))}
            </View>
          ) : null}
          {listings.length > 0 ? (
            <View style={{ marginTop: categories.length > 0 ? spacing.xxl : spacing.lg }}>
              {categories.length > 0 ? (
                <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: spacing.md }}>
                  {content?.featuredListingsSource === "admin" ? "Featured stock" : "Just listed"}
                </Text>
              ) : null}
              <Rail items={listings} itemWidth={listingWidth} keyOf={(l) => String(l.id)} render={(l) => <ListingCard listing={l} />} label="Bulk planting material" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={section}>
          <PhotoPanel
            photo={HOME_PHOTOS.seedlings}
            eyebrow="Bulk supply"
            title="Planting material in bulk"
            body="Tell us the plants and the quantity you need. Our team confirms the price and arranges dispatch."
          >
            <Link href="/contact" asChild>
              <Button label="Send a bulk enquiry" />
            </Link>
            <Link href="/listings" asChild>
              <Button label="See bulk supply" variant="outline" inverted />
            </Link>
          </PhotoPanel>
        </View>
      )}

      {/* 4 · See the farms — videos (only when there are real videos) */}
      <VideoShowcase videos={videos} title="See the farms" subtitle={offers[0]?.line || undefined} />

      {/* 5 · Farm stories */}
      {farms.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="Farm stories" title="Real farms, filmed on the ground." linkLabel="See all farms" href="/farms" />
          <View style={{ marginTop: spacing.lg }}>
            <Rail items={farms} itemWidth={farmCardWidth} keyOf={(f) => f.slug} render={(f) => <FarmCard farm={f} />} label="Farm stories" />
          </View>
        </View>
      ) : null}

      {/* 6 · Browse farms */}
      {stateChips.length > 0 || cropChips.length > 0 ? (
        <View style={section}>
          <SectionHead eyebrow="Browse" title="Find farms by state or crop" />
          {stateChips.length > 0 ? (
            <ChipRow label="States" items={stateChips.map((s) => ({ key: s.slug, label: s.name, href: { pathname: "/farms", params: { state: s.slug } } }))} />
          ) : null}
          {cropChips.length > 0 ? (
            <ChipRow label="Crops" items={cropChips.map((c) => ({ key: c.slug, label: c.name, href: { pathname: "/farms", params: { crop: c.slug } } }))} />
          ) : null}
        </View>
      ) : null}

      {/* 7 · How it works — two photo cards */}
      <View style={section}>
        <SectionHead eyebrow="How it works" title="Two ways to use FarmsClub" linkLabel="Learn more" href="/about" />
        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, marginTop: spacing.lg }}>
          {TRACKS.map((t) => (
            <View key={t.title} style={{ flex: wide ? 1 : undefined, minHeight: compact ? 340 : 380, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.brand, justifyContent: "flex-end" }}>
              <Photo uri={t.photo} alt="" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(8,28,18,0.15)", "rgba(8,28,18,0.6)", "rgba(8,28,18,0.94)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
              <View style={{ padding: compact ? spacing.lg : spacing.xl, gap: spacing.md }}>
                <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.display, fontSize: compact ? 22 : 26, color: "#FFFFFF" }}>
                  {t.title}
                </Text>
                <View style={{ gap: spacing.sm }}>
                  {t.steps.map((s, i) => (
                    <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i === t.steps.length - 1 ? colors.cta : "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: "#FFFFFF" }}>{i + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: "#FFFFFF" }}>{s}</Text>
                    </View>
                  ))}
                </View>
                {t.cta.href === "/list-your-farm" && !registrationOpen ? null : (
                  <View style={{ alignSelf: "flex-start", marginTop: spacing.xs }}>
                    <Link href={t.cta.href} asChild>
                      <Button label={t.cta.label} variant="outline" inverted />
                    </Link>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 8 · List your farm banner */}
      <View style={[section, { paddingHorizontal: 0 }]}>
        <SectionBanner title={banner.title} body={banner.subline} photo={HOME_PHOTOS.planting}>
          {registrationOpen ? (
            <Link href="/list-your-farm" asChild>
              <Button label={banner.buttonLabel} />
            </Link>
          ) : (
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: "#FFFFFF" }}>Registrations are paused right now.</Text>
          )}
        </SectionBanner>
      </View>

      {/* 9 · Short FAQ */}
      {faqs.length > 0 ? (
        <View style={[section, { maxWidth: 820, marginBottom: spacing.xxxl }]}>
          <SectionTitle title="Questions, answered" linkLabel="All FAQs" href="/faqs" />
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

/**
 * Carousel slides: the admin's uploaded photos once saved; until then the home copy over built-in
 * nursery photos, with up to two featured farms' own cover photos in between.
 */
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
      title: hero.headline,
      subline: hero.subline,
      cta: { label: "Explore farms", href: "/farms" },
      secondary: { label: "Get bulk planting material", href: "/listings" },
    },
  ];
  for (const f of farms.filter((x) => x.image).slice(0, 2)) {
    out.push({
      key: `farm-${f.slug}`,
      image: f.image as string,
      eyebrow: placeLine(f.district, f.state),
      title: f.name,
      subline: f.crops.length ? f.crops.slice(0, 3).join(" · ") : null,
      cta: { label: "Visit the farm", href: { pathname: "/farms/[slug]", params: { slug: f.slug } } },
    });
  }
  out.push({
    key: "bulk",
    image: HOME_PHOTOS.trellis,
    title: "Bulk planting material",
    subline: "Saplings priced by quantity, delivered by road or rail.",
    cta: { label: "See bulk supply", href: "/listings" },
    secondary: { label: "Send an enquiry", href: "/contact" },
  });
  out.push({
    key: "own-a-farm",
    image: HOME_PHOTOS.planting,
    title: banner.title,
    subline: banner.subline,
    cta: registrationOpen ? { label: banner.buttonLabel, href: "/list-your-farm" } : null,
  });
  return out;
}

/** Section heading with a small coloured label above it. */
function SectionHead({ eyebrow, title, linkLabel, href }: { eyebrow: string; title: string; linkLabel?: string; href?: Href }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.accentDark }}>{eyebrow}</Text>
      <SectionTitle title={title} linkLabel={linkLabel} href={href} />
    </View>
  );
}

/** Wide photo panel with a dark tint, a title, one line and buttons. */
function PhotoPanel({ photo, eyebrow, title, body, children }: { photo: string; eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  const { fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  return (
    <View style={{ borderRadius: radius.xl, overflow: "hidden", minHeight: compact ? 320 : 360, justifyContent: "center" }}>
      <Photo uri={photo} alt="" style={StyleSheet.absoluteFill} sizes="100vw" />
      <LinearGradient colors={["rgba(8,28,18,0.9)", "rgba(8,28,18,0.55)", "rgba(8,28,18,0.1)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={{ padding: compact ? spacing.lg : spacing.xxl, maxWidth: 560, gap: spacing.md }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>{eyebrow}</Text>
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: compact ? 26 : 34, lineHeight: compact ? 32 : 40, color: "#FFFFFF" }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: compact ? 14.5 : 16, lineHeight: compact ? 21 : 24, color: "rgba(255,255,255,0.9)" }}>{body}</Text>
        {children ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>{children}</View> : null}
      </View>
    </View>
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
