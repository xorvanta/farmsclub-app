import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions, type ScrollView } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
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
import { LoadingState, ErrorState } from "@/components/StateViews";
import { LogoMark } from "@/components/graphics/LogoMark";
import { b2bApi, fcApi, errorMessage, isAvailableListing, isNotFound, parseListingId } from "@/lib/api";
import { listingBarePrice, listingCategoryName, listingMoq, listingMoqLabel, listingPriceLabel, listingUnit, showsGst } from "@/lib/listing";
import { useChat } from "@/lib/chat-context";
import type { B2bListing, FarmCardApi } from "@/lib/types";

const DETAIL_MAX_WIDTH = 1120;

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openChat, setListingContext } = useChat();
  const formScrollRef = useRef<ScrollView>(null);
  const [listing, setListing] = useState<B2bListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Set when the listing is hidden/unknown: its title (if the backend still knows it). */
  const [unavailable, setUnavailable] = useState<{ title: string | null } | null>(null);
  const [farms, setFarms] = useState<FarmCardApi[]>([]);
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
    // "Farms growing this crop" — optional; a failure just hides the block.
    fcApi
      .getListingFarms(listingId)
      .then((rows) => setFarms(Array.isArray(rows) ? rows.slice(0, 4) : []))
      .catch(() => setFarms([]));
  }, [listingId]);

  useEffect(() => void load(), [load]);

  // Keeps Trellis grounded in the listing the buyer is looking at; cleared on leaving.
  useEffect(() => {
    if (!listing) return;
    const moq = listingMoq(listing);
    setListingContext({
      title: listing.title,
      category: listingCategoryName(listing) ?? undefined,
      bulkPrice: listingBarePrice(listing) ?? undefined,
      bulkUnit: listingUnit(listing) ?? undefined,
      bulkMinQuantity: moq != null ? String(moq) : undefined,
    });
    return () => setListingContext(null);
  }, [listing, setListingContext]);

  // The static web export renders this route once as a template, with no id yet — keep that a
  // neutral loading view.
  const idPending = id === undefined || id === "" || id === "[id]";
  if (idPending) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading…" />
      </AppShell>
    );
  }

  // Storefront §3.1: a hidden/unknown listing is "not available" + the Enquire form with the
  // product name prefilled — never a 404.
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

  const gallery = (
    <ImageGallery
      images={images}
      aspectRatio={wide ? 1.3 : 1.4}
      maxHeight={520}
      alt={listing.title}
      fallback={
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft }]}>
          <LogoMark size={56} />
        </View>
      }
    />
  );

  const info = (
    <View style={{ gap: spacing.md }}>
      {category ? <Tag label={category} tone="brand" /> : null}
      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: wide ? 28 : 24, color: colors.ink, lineHeight: wide ? 34 : 30 }}>
        {listing.title}
      </Text>

      <BulkPriceCard listing={listing} />

      {(listing.dispatch_states?.length ?? 0) > 0 || (listing.transport_modes?.length ?? 0) > 0 ? (
        <View style={{ gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
          <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink }}>
            Delivery
          </Text>
          {listing.dispatch_states?.length > 0 && <InfoLine label="Dispatches from" values={listing.dispatch_states} />}
          {listing.transport_modes?.length > 0 && <InfoLine label="Transport" values={listing.transport_modes} />}
        </View>
      ) : null}

      <SpecificationSection listing={listing} />

      <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: spacing.lg, gap: 4 }}>
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.brand }}>
          Handled by the FarmsClub team
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>
          Share your requirement and our team confirms price, availability and dispatch with you.
        </Text>
      </View>

      <Button label="Ask Trellis about this item" variant="outline" onPress={() => openChat()} />
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
            {moq ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft }}>{moq}</Text> : null}
          </View>
          <View style={{ flexShrink: 0 }}>
            <Link href={{ pathname: "/rfq/[listingId]", params: { listingId: String(listing.id) } }} asChild>
              <Button label="Request a quote" />
            </Link>
          </View>
        </StickyBar>
      }
    >
      <SeoHead title={`${listing.title} · FarmsClub`} description={metaDescription} image={images[0] ?? null} />
      <View style={[column, { padding: spacing.lg }]}>
        {wide ? (
          <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" }}>
            <View style={{ flex: 1, position: Platform.OS === "web" ? ("sticky" as "relative") : "relative", top: 16 }}>{gallery}</View>
            <View style={{ flex: 1.1 }}>{info}</View>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {gallery}
            {info}
          </View>
        )}

        {farms.length > 0 ? (
          <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: wide ? 22 : 19, color: colors.ink }}>
              Farms growing this crop
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
      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, minWidth: 110 }}>{label}</Text>
      {values.map((v) => (
        <Tag key={v} label={v} tone="neutral" />
      ))}
    </View>
  );
}
