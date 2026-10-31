import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions, type ScrollView } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { StickyBar } from "@/components/StickyBar";
import { Tag } from "@/components/Tag";
import { BulkPriceCard } from "@/components/BulkPriceCard";
import { SpecificationSection, ImageGallery, specificationSummary } from "@/components/ListingSpecs";
import { Button } from "@/components/Button";
import { RfqFormBody } from "@/components/RfqFormBody";
import { FarmCard, fromFarmCard } from "@/components/FarmCard";
import { Orchard3DPlanner } from "@/components/tools/Orchard3DPlanner";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { LogoMark } from "@/components/graphics/LogoMark";
import { b2bApi, fcApi, errorMessage, isAvailableListing, isNotFound, parseListingId } from "@/lib/api";
import { formatQty } from "@/lib/format";
import { listingBarePrice, listingCategoryName, listingMoq, listingMoqLabel, listingPriceLabel, listingUnit, showsGst } from "@/lib/listing";
import { useChat } from "@/lib/chat-context";
import type { B2bListing, FarmCardApi } from "@/lib/types";

const DETAIL_MAX_WIDTH = 1140;

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openChat, setListingContext } = useChat();
  const formScrollRef = useRef<ScrollView>(null);
  const [listing, setListing] = useState<B2bListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<{ title: string | null } | null>(null);
  const [farms, setFarms] = useState<FarmCardApi[]>([]);
  const [selectedQty, setSelectedQty] = useState<number | null>(null);
  const listingId = parseListingId(id);

  const load = useCallback(() => {
    setError(null);
    setUnavailable(null);
    setListing(null);
    setFarms([]);
    if (listingId == null) return;
    b2bApi
      .getListing(listingId)
      .then((l) => (isAvailableListing(l) ? setListing(l) : setUnavailable({ title: l?.title ?? null })))
      .catch((e) => (isNotFound(e) ? setUnavailable({ title: null }) : setError(errorMessage(e))));
    fcApi
      .getListingFarms(listingId)
      .then((rows) => setFarms(Array.isArray(rows) ? rows.slice(0, 4) : []))
      .catch(() => setFarms([]));
  }, [listingId]);

  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (!listing) return;
    const moq = listingMoq(listing);
    setSelectedQty(moq ?? null);
    setListingContext({
      title: listing.title,
      category: listingCategoryName(listing) ?? undefined,
      bulkPrice: listingBarePrice(listing) ?? undefined,
      bulkUnit: listingUnit(listing) ?? undefined,
      bulkMinQuantity: moq != null ? String(moq) : undefined,
    });
    return () => setListingContext(null);
  }, [listing, setListingContext]);

  const idPending = id === undefined || id === "" || id === "[id]";
  if (idPending) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading…" />
      </AppShell>
    );
  }

  if (listingId == null || unavailable) {
    const title = unavailable?.title ?? null;
    return (
      <AppShell
        keyboardAware
        hideBottomNav
        scrollRef={formScrollRef}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
      >
        <SeoHead title={title ? `${title} · FarmsClub` : "Not available · FarmsClub"} noindex />
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
            This item is currently not available
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, lineHeight: 21 }}>
            {title ? `${title} isn't listed right now. ` : ""}Tell us what you need and the FarmsClub team will get back to you.
          </Text>
          <Link href="/listings" style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brand, paddingVertical: 8 }}>
            Browse bulk supply →
          </Link>
        </View>
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl }}>
          <RfqFormBody listing={null} listingId={null} scrollRef={formScrollRef} initialNotes={title ?? undefined} />
        </View>
      </AppShell>
    );
  }

  if (!listing && !error) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading…" />
      </AppShell>
    );
  }
  if (error || !listing) {
    return (
      <AppShell noScroll>
        <SeoHead title="Bulk supply · FarmsClub" noindex />
        <ErrorState message={error ?? "This item couldn't be loaded."} onRetry={load} />
      </AppShell>
    );
  }

  const category = listingCategoryName(listing);
  const price = listingPriceLabel(listing);
  const moq = listingMoqLabel(listing);
  const gst = showsGst(listing);
  const specSummary = specificationSummary(listing.specification);
  const fallbackImage = listing.photo_url || listing.category?.image_url || null;
  const images = listing.images?.length ? listing.images : fallbackImage ? [fallbackImage] : [];
  const metaDescription = [
    `${listing.title} in bulk on FarmsClub`,
    price ? `${price}, priced by quantity` : null,
    moq,
    specSummary,
  ]
    .filter(Boolean)
    .join(" · ");
  const wide = width >= 880;
  const column = { width: "100%" as const, maxWidth: DETAIL_MAX_WIDTH, alignSelf: "center" as const };

  const rfqHref = {
    pathname: "/rfq/[listingId]" as const,
    params: selectedQty ? { listingId: String(listing.id), qty: String(selectedQty) } : { listingId: String(listing.id) },
  };

  const gallery = (
    <View style={{ gap: spacing.md }}>
      <ImageGallery
        images={images}
        aspectRatio={wide ? 1.25 : 1.35}
        maxHeight={500}
        alt={listing.title}
        fallback={
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft }]}>
            <LogoMark size={56} />
          </View>
        }
      />

      {/* Visual Trade Guarantees under Gallery */}
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        {[
          { title: "Nursery Graded", sub: "Batch inspected" },
          { title: "Road & Rail", sub: "Pan-India transit" },
          { title: "Single Desk", sub: "Quote to dispatch" },
        ].map((g) => (
          <View
            key={g.title}
            style={{
              flex: 1,
              minWidth: 100,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.brand }}>{g.title}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }}>{g.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const info = (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Link href="/listings" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.brand }}>
          ← Bulk Supply
        </Link>
        {category ? <Tag label={category} tone="brand" /> : null}
      </View>

      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: wide ? 30 : 25, color: colors.ink, lineHeight: wide ? 36 : 31 }}>
        {listing.title}
      </Text>

      <BulkPriceCard listing={listing} onSelectQuantity={setSelectedQty} />

      {/* Visual Logistics & Dispatch Corridor */}
      {(listing.dispatch_states?.length ?? 0) > 0 || (listing.transport_modes?.length ?? 0) > 0 ? (
        <View
          style={{
            gap: spacing.md,
            backgroundColor: colors.surface,
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={2}>
                <Rect x={2} y={7} width={13} height={9} rx={1} />
                <Path d="M15 10h4l3 3v3h-7" />
                <Circle cx={6.5} cy={18} r={2} />
                <Circle cx={18.5} cy={18} r={2} />
              </Svg>
            </View>
            <View>
              <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink }}>
                Logistics & Dispatch Corridor
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
                Direct nursery loading via road carrier or Indian Railways parcel van
              </Text>
            </View>
          </View>
          {listing.dispatch_states?.length > 0 && <InfoLine label="Origin Belts" values={listing.dispatch_states} />}
          {listing.transport_modes?.length > 0 && <InfoLine label="Transit Modes" values={listing.transport_modes} />}
        </View>
      ) : null}

      <SpecificationSection listing={listing} />

      {/* Trade Desk Action Row */}
      <View
        style={{
          backgroundColor: colors.brandSoft,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: "rgba(18,56,36,0.15)",
          gap: spacing.sm,
        }}
      >
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.brand }}>
          Brokered by the FarmsClub Trade Desk
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20 }}>
          Lock your volume slab above or request a custom quote. Our team confirms batch readiness and transit charges to your city or railway station.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 }}>
          <Link href={rfqHref} asChild>
            <Button label={selectedQty ? `Request Quote (${formatQty(selectedQty)} units) →` : "Request a quote →"} />
          </Link>
          <Button label="Ask Trellis AI" variant="outline" onPress={() => openChat()} />
        </View>
      </View>
    </View>
  );

  return (
    <AppShell
      stickyBar={
        <StickyBar maxWidth={DETAIL_MAX_WIDTH}>
          <View style={{ flex: 1 }}>
            {price ? (
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: wide ? 18 : 16, color: colors.brand }}>
                {price}
                {gst ? <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft }}> + GST</Text> : null}
              </Text>
            ) : null}
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft }}>
              {selectedQty ? `Selected lot: ${formatQty(selectedQty)} units` : moq ?? "Wholesale bulk lot"}
            </Text>
          </View>
          <View style={{ flexShrink: 0 }}>
            <Link href={rfqHref} asChild>
              <Button label={selectedQty ? `Quote ${formatQty(selectedQty)} units →` : "Request a quote"} />
            </Link>
          </View>
        </StickyBar>
      }
    >
      <SeoHead title={`${listing.title} · FarmsClub`} description={metaDescription} image={images[0] ?? null} />
      <View style={[column, { padding: spacing.lg, gap: spacing.xxl }]}>
        {wide ? (
          <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" }}>
            <View style={{ flex: 1, position: Platform.OS === "web" ? ("sticky" as "relative") : "relative", top: 16 }}>{gallery}</View>
            <View style={{ flex: 1.12 }}>{info}</View>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {gallery}
            {info}
          </View>
        )}

        {/* Interactive 3D Orchard & Acreage Simulator for this specific listing */}
        <Orchard3DPlanner listing={listing} />

        {farms.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: wide ? 24 : 20, color: colors.ink }}>
              Verified farms growing this crop
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {farms.map((f) => (
                <View key={f.slug} style={{ flexBasis: width >= 1100 ? "23%" : width >= 600 ? "47%" : "100%", flexGrow: 1, maxWidth: width >= 600 ? undefined : "100%" }}>
                  <FarmCard farm={fromFarmCard(f)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </AppShell>
  );
}

function InfoLine({ label, values }: { label: string; values: string[] }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft, minWidth: 105 }}>{label}</Text>
      {values.map((v) => (
        <Tag key={v} label={v} tone="brand" />
      ))}
    </View>
  );
}
