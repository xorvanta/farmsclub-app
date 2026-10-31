import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, View, useWindowDimensions, type ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { HEADER_COMPACT_WIDTH } from "@/components/Header";
import { SeoHead } from "@/components/SeoHead";
import { StickyBar } from "@/components/StickyBar";
import { Button } from "@/components/Button";
import { Photo } from "@/components/Photo";
import { Tag, VerifiedTag } from "@/components/Tag";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { YouTubeEmbed, safeVideoId, youtubeThumb } from "@/components/YouTube";
import { FarmCard, fromFarmCard, placeLine } from "@/components/FarmCard";
import { ListingCard } from "@/components/ListingCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { FarmEnquiryForm } from "@/components/farm/FarmEnquiryForm";
import { FarmGallery } from "@/components/farm/FarmGallery";
import { FarmVideos } from "@/components/farm/FarmVideos";
import { Block, FactsRow, GrownBlock, ProductsBlock, ServicesBlock, StoryBlock, TrainingBlock, factRows } from "@/components/farm/FarmBlocks";
import { fcApi, errorMessage, isNotFound } from "@/lib/api";
import type { B2bListing, FarmProfile } from "@/lib/types";

const PAGE_MAX = 1140;
const SIDE_WIDTH = 350;
const CONTACT_ID = "farm-contact";

/**
 * Farm profile (Storefront §6). Information only: every block hides when empty, and no phone,
 * email, address or map is ever rendered — the API never returns them (Admin §3.3, §3.9).
 */
export default function FarmProfileScreen() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const scrollRef = useRef<ScrollView>(null);
  const contactY = useRef({ column: 0, block: 0 });

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [listings, setListings] = useState<B2bListing[]>([]);

  const slugPending = !slug || slug === "[slug]";

  const load = useCallback(() => {
    if (slugPending) return;
    setError(null);
    setNotFound(false);
    setFarm(null);
    setListings([]);
    fcApi
      .getFarm(slug)
      .then((data) => {
        setFarm(data);
        if (data.slug && data.slug !== slug) router.replace({ pathname: "/farms/[slug]", params: { slug: data.slug } });
      })
      .catch((e) => (isNotFound(e) ? setNotFound(true) : setError(errorMessage(e))));
  }, [slug, slugPending]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!farm?.slug) return;
    let alive = true;
    fcApi
      .getFarmListings(farm.slug)
      .then((rows) => alive && setListings(Array.isArray(rows) ? rows.slice(0, 4) : []))
      .catch(() => alive && setListings([]));
    return () => {
      alive = false;
    };
  }, [farm?.slug]);

  if (slugPending) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading farm…" />
      </AppShell>
    );
  }

  if (notFound) {
    return (
      <AppShell noScroll>
        <SeoHead title="Farm not available · FarmsClub" noindex />
        <EmptyState title="This farm is not available" body="The profile may have moved or isn't live right now.">
          <Link href="/farms" replace asChild>
            <Button label="Explore farms" />
          </Link>
          <Link href="/list-your-farm" asChild>
            <Button label="List your farm" variant="outline" />
          </Link>
        </EmptyState>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell noScroll>
        <SeoHead title="Farm · FarmsClub" noindex />
        <ErrorState message={error} onRetry={load} />
      </AppShell>
    );
  }

  if (!farm) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading farm…" />
      </AppShell>
    );
  }

  const pageWidth = Math.min(width, PAGE_MAX + spacing.lg * 2) - spacing.lg * 2;
  const twoCol = width >= 1024;
  const mainWidth = twoCol ? pageWidth - SIDE_WIDTH - spacing.xxl : pageWidth;
  const compact = width < HEADER_COMPACT_WIDTH;

  const district = farm.district?.name?.trim() || null;
  const state = farm.state?.name?.trim() || null;
  const place = placeLine(district, state);
  const area = farm.area_name?.trim() || null;
  const heroId = safeVideoId(farm.hero_video?.video_id);
  const cover = farm.cover_url || farm.gallery?.find((g) => g.is_cover)?.url || null;
  const shareImage = cover || (heroId ? youtubeThumb(heroId) : null);
  const types = (farm.farm_types ?? []).map((t) => t.name?.trim()).filter((t): t is string => !!t);
  const firstCrop = farm.crops?.find((c) => c.name?.trim())?.name.trim() ?? null;
  const more = (farm.more_farms_in_state ?? []).filter((f) => f.slug !== farm.slug).slice(0, 4);
  const hasFacts = factRows(farm.facts).length > 0;

  const scrollToContact = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.getElementById(CONTACT_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    scrollRef.current?.scrollTo({ y: Math.max(0, contactY.current.column + contactY.current.block - 16), animated: true });
  };

  const gridOf = (count: number, w: number) => {
    const cols = w >= 900 ? 4 : w >= 560 ? 2 : 1;
    const c = Math.min(cols, Math.max(1, count));
    return { cols: c, cardW: Math.floor((w - spacing.md * (c - 1)) / c) };
  };

  const contact = (
    <View
      nativeID={CONTACT_ID}
      onLayout={(e) => (contactY.current.block = e.nativeEvent.layout.y)}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.lg,
        gap: spacing.md,
        shadowColor: "#081E12",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      {farm.whatsapp_available ? (
        <>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.brand, textTransform: "uppercase" }}>
              DIRECT GROWER CONNECT
            </Text>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>
              Talk to the farm
            </Text>
          </View>
          <WhatsAppButton slug={farm.slug} src="profile" fullWidth />
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 }}>
            Opens WhatsApp with a short hello. The farm's number is never shown on FarmsClub.
          </Text>
        </>
      ) : (
        <>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.brand, textTransform: "uppercase" }}>
              FARM ENQUIRY DESK
            </Text>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>
              Ask about this farm
            </Text>
          </View>
          <FarmEnquiryForm slug={farm.slug} farmName={farm.name} />
        </>
      )}
    </View>
  );

  const header = (
    <LinearGradient
      colors={["#071A10", "#123824", "#184A30"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.xl,
        padding: compact ? spacing.lg : spacing.xl,
        borderWidth: 1,
        borderColor: "rgba(229,180,98,0.32)",
        gap: spacing.sm,
      }}
    >
      <View role="navigation" aria-label="Breadcrumb" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <Crumb href={{ pathname: "/farms" }} label="Farms" />
        {farm.state ? (
          <>
            <Sep />
            <Crumb href={{ pathname: "/farms", params: { state: farm.state.slug } }} label={farm.state.name} />
          </>
        ) : null}
        {farm.state && farm.district ? (
          <>
            <Sep />
            <Crumb href={{ pathname: "/farms", params: { state: farm.state.slug, district: farm.district.slug } }} label={farm.district.name} />
          </>
        ) : null}
      </View>

      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: width >= 860 ? 36 : 27, lineHeight: width >= 860 ? 42 : 33, color: "#FFFFFF" }}>
        {farm.name}
      </Text>

      {place || area ? (
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#E5B462" }}>
          📍 {[place, area].filter(Boolean).join(" · ")}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 4 }}>
        <VerifiedTag verified={!!farm.verified} />
        {farm.fc_code ? <Tag label={farm.fc_code} tone="onPhoto" /> : null}
        {types.map((t) => (
          <Tag key={t} label={t} tone="accent" />
        ))}
      </View>
    </LinearGradient>
  );

  const media = heroId ? (
    <YouTubeEmbed videoId={heroId} title={farm.hero_video?.title || `${farm.name} — FarmsClub film`} />
  ) : cover ? (
    <Photo uri={cover} alt={farm.name} eager style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.xl }} sizes="(max-width: 1024px) 100vw, 760px" />
  ) : null;

  const listingsGrid = gridOf(listings.length, mainWidth);
  const moreGrid = gridOf(more.length, pageWidth);
  const gallery = (farm.gallery ?? []).filter((g) => g.url);

  const mainColumn = (
    <View style={{ gap: spacing.xxl, width: twoCol ? mainWidth : "100%" }} onLayout={(e) => (contactY.current.column = e.nativeEvent.layout.y)}>
      {!twoCol ? header : null}
      {media ? (
        <View style={{ gap: 6 }}>
          {media}
          {farm.photo_credit?.trim() ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint }}>Photos: {farm.photo_credit.trim()}</Text>
          ) : null}
        </View>
      ) : null}
      {!twoCol && hasFacts ? <FactsRow facts={farm.facts} columns={width >= 560 ? 3 : 2} /> : null}
      <StoryBlock farm={farm} />
      <GrownBlock farm={farm} width={mainWidth} />
      <ServicesBlock farm={farm} />
      <TrainingBlock farm={farm} />
      <ProductsBlock farm={farm} />
      {gallery.length ? (
        <Block title="Photo gallery">
          <FarmGallery photos={gallery} farmName={farm.name} width={mainWidth} />
        </Block>
      ) : null}
      {(farm.videos ?? []).some((v) => safeVideoId(v.video_id)) ? (
        <Block title="More videos">
          <FarmVideos videos={farm.videos} farmName={farm.name} />
        </Block>
      ) : null}
      {!twoCol ? contact : null}
      {listings.length ? (
        <Block title="Bulk planting material for these crops">
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20, marginTop: -6 }}>
            Plantation stock for the crops grown here, priced by quantity and arranged by the FarmsClub team.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {listings.map((l) => (
              <View key={l.id} style={{ width: listingsGrid.cardW }}>
                <ListingCard listing={l} />
              </View>
            ))}
          </View>
          <Link
            href={firstCrop ? { pathname: "/listings", params: { crop: firstCrop } } : { pathname: "/listings" }}
            style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brand, paddingVertical: 10 }}
          >
            {firstCrop ? `See bulk supply for ${firstCrop} →` : "See all bulk supply →"}
          </Link>
        </Block>
      ) : null}
    </View>
  );

  const stickyBar = compact ? (
    <StickyBar>
      {farm.whatsapp_available ? (
        <View style={{ flex: 1 }}>
          <WhatsAppButton slug={farm.slug} src="sticky" fullWidth compact />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Button label="Ask about this farm" fullWidth onPress={scrollToContact} />
        </View>
      )}
    </StickyBar>
  ) : undefined;

  return (
    <AppShell scrollRef={scrollRef} stickyBar={stickyBar} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl }}>
      <SeoHead
        title={district ? `${farm.name}, ${district} · FarmsClub` : `${farm.name} · FarmsClub`}
        description={farm.short_intro}
        image={shareImage}
        path={`/farms/${farm.slug}`}
      />
      <View style={{ width: "100%", maxWidth: PAGE_MAX, alignSelf: "center", gap: spacing.xxl }}>
        {twoCol ? header : null}
        {twoCol ? (
          <View style={{ flexDirection: "row", gap: spacing.xxl, alignItems: "flex-start" }}>
            {mainColumn}
            <View
              style={{
                width: SIDE_WIDTH,
                gap: spacing.lg,
                ...(Platform.OS === "web" ? ({ position: "sticky", top: 16 } as object) : {}),
              }}
            >
              {hasFacts ? (
                <View style={{ gap: spacing.sm }}>
                  <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>
                    Estate Telemetry
                  </Text>
                  <FactsRow facts={farm.facts} columns={2} />
                </View>
              ) : null}
              {contact}
            </View>
          </View>
        ) : (
          mainColumn
        )}

        {more.length && state ? (
          <Block title={`More farms in ${state}`}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {more.map((f) => (
                <View key={f.slug} style={{ width: moreGrid.cardW }}>
                  <FarmCard farm={fromFarmCard(f)} />
                </View>
              ))}
            </View>
          </Block>
        ) : null}
      </View>
    </AppShell>
  );
}

function Crumb({ href, label }: { href: React.ComponentProps<typeof Link>["href"]; label: string }) {
  const { fonts } = useTheme();
  return (
    <Link href={href} style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: "rgba(255,255,255,0.85)", paddingVertical: 4 }}>
      {label}
    </Link>
  );
}

function Sep() {
  return (
    <Text aria-hidden style={{ color: "rgba(229,180,98,0.65)", fontSize: 13 }}>
      ›
    </Text>
  );
}
