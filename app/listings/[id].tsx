import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { BulkPriceCard } from "@/components/BulkPriceCard";
import { SpecificationSection, ImageGallery, specificationSummary } from "@/components/ListingSpecs";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryArt } from "@/components/graphics/CategoryArt";
import { categoryLabel } from "@/constants/categories";
import { formatBareRange, formatPriceRange } from "@/lib/format";
import { b2bApi, errorMessage, isNotFound, parseListingId } from "@/lib/api";
import { useChat } from "@/lib/chat-context";
import type { B2bListing } from "@/lib/types";

/** Reading column for the detail page — wide enough for the price table and specs side by side
 *  with the gallery above, narrow enough that lines stay readable on a desktop monitor. */
const DETAIL_MAX_WIDTH = 880;
const GALLERY_MAX_HEIGHT = 480;

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openChat, setListingContext } = useChat();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<B2bListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const listingId = parseListingId(id);
  const column = { width: "100%" as const, maxWidth: DETAIL_MAX_WIDTH, alignSelf: "center" as const };
  const framed = width > DETAIL_MAX_WIDTH + spacing.lg * 2; // gallery gets rounded corners + side margin on wide screens

  const load = useCallback(() => {
    setError(null);
    setNotFound(false);
    setListing(null);
    if (listingId == null) return;
    b2bApi
      .getListing(listingId)
      .then(setListing)
      .catch((e) => {
        // The backend answered "not available" → the listing is gone (or never existed); only a
        // network/server failure is worth a retry.
        if (isNotFound(e)) setNotFound(true);
        else setError(errorMessage(e));
      });
  }, [listingId]);

  useEffect(() => void load(), [load]);

  // Keeps Trellis grounded in the real listing the buyer is actually looking at, cleared again
  // on navigating away so a later chat on another page doesn't carry stale listing context.
  useEffect(() => {
    if (!listing) return;
    const unit = listing.unit ?? listing.bulk_unit ?? null;
    const moq = listing.moq ?? listing.bulk_min_quantity ?? null;
    // The backend labels this "Price per unit (before GST, by quantity): ₹…" itself, so only the
    // bare range (and unit) is sent — no "₹", no second "before GST".
    const range = formatBareRange(listing.price_from, listing.price_to);
    setListingContext({
      title: listing.title,
      category: categoryLabel(listing.category ?? listing.bulk_category),
      bulkPrice: range ? `${range}${unit ? ` per ${unit}` : ""}` : undefined,
      bulkUnit: unit ?? undefined,
      bulkMinQuantity: moq != null ? String(moq) : undefined,
    });
    return () => setListingContext(null);
  }, [listing, setListingContext]);

  // The static web export renders this route once as a template, with no id yet. That must be a
  // neutral loading view — a "not found" + noindex in the exported HTML would be what crawlers
  // see first for every real listing URL.
  const idPending = id === undefined || id === "" || id === "[id]";
  if (idPending) {
    return (
      <AppShell noScroll hideBottomNav>
        <LoadingState label="Loading listing…" />
      </AppShell>
    );
  }

  if (listingId == null || notFound) {
    return (
      <AppShell noScroll hideBottomNav>
        <SeoHead title="Listing not found · FarmsClub" noindex />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <EmptyState title="Listing not found" body="This listing doesn't exist, or is no longer available for bulk order.">
            <Link href="/listings" replace asChild>
              <Button label="Browse the catalogue" />
            </Link>
            <Link href="/contact" asChild>
              <Button label="Send a general enquiry" variant="outline" />
            </Link>
          </EmptyState>
        </View>
      </AppShell>
    );
  }

  if (!listing && !error) {
    return (
      <AppShell noScroll hideBottomNav>
        <LoadingState label="Loading listing…" />
      </AppShell>
    );
  }
  if (error || !listing) {
    return (
      <AppShell noScroll hideBottomNav>
        <SeoHead title="Listing · FarmsClub" noindex />
        <ErrorState message={error ?? "This listing couldn't be loaded."} onRetry={load} />
      </AppShell>
    );
  }

  const category = listing.category ?? listing.bulk_category;
  const unit = listing.unit ?? listing.bulk_unit ?? null;
  const range = formatPriceRange(listing.price_from, listing.price_to);
  const specSummary = specificationSummary(listing.specification);
  const images = listing.images?.length ? listing.images : listing.photo_url ? [listing.photo_url] : [];
  const metaDescription = [
    `${listing.title} in bulk on FarmsClub`,
    range ? `${range}${unit ? ` per ${unit}` : ""} before GST, by quantity tier` : null,
    specSummary,
  ]
    .filter(Boolean)
    .join(" — ");

  const wide = width >= 880;
  const maxWidth = wide ? 1120 : DETAIL_MAX_WIDTH;
  const contentColumn = { width: "100%" as const, maxWidth, alignSelf: "center" as const };

  return (
    <AppShell noScroll hideBottomNav>
      <SeoHead title={`${listing.title} · FarmsClub`} description={`${metaDescription}.`} image={images[0] ?? null} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <View style={[contentColumn, { padding: spacing.lg }]}>
          {wide ? (
            <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" }}>
              {/* Left Column: Image Gallery */}
              <View style={{ flex: 1, position: Platform.OS === "web" ? ("sticky" as any) : "relative", top: 16 }}>
                <ImageGallery
                  images={images}
                  aspectRatio={1.3}
                  maxHeight={520}
                  alt={listing.title}
                  fallback={<CategoryArt category={category} style={StyleSheet.absoluteFill} />}
                />
              </View>

              {/* Right Column: Pricing, Specs, Details */}
              <View style={{ flex: 1.15, gap: spacing.md }}>
                <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                  <Badge label={categoryLabel(category)} tone="brand" />
                  <Badge label="Verified Wholesale" tone="success" />
                </View>

                <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, lineHeight: 32 }}>
                  {listing.title}
                </Text>

                {listing.manufacturer_brand && (
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>
                    Manufacturer / Brand: <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.ink }}>{listing.manufacturer_brand}</Text>
                  </Text>
                )}

                <View style={{ marginTop: spacing.sm }}>
                  <BulkPriceCard listing={listing} />
                </View>

                {(listing.dispatch_states?.length ?? 0) > 0 || (listing.transport_modes?.length ?? 0) > 0 ? (
                  <View style={{ gap: spacing.sm, marginTop: spacing.xs, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
                    <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink }}>
                      Logistics &amp; Dispatch
                    </Text>
                    {listing.dispatch_states?.length > 0 && <InfoLine label="Dispatches from" values={listing.dispatch_states} />}
                    {listing.transport_modes?.length > 0 && <InfoLine label="Transport options" values={listing.transport_modes} />}
                  </View>
                ) : null}

                <View style={{ marginTop: spacing.xs }}>
                  <SpecificationSection specification={listing.specification} brand={listing.manufacturer_brand} />
                </View>

                <Button label="Ask Trellis AI about this listing" variant="outline" onPress={() => openChat()} />

                <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.brand, marginBottom: 2 }}>
                    🛡️ Formulate India Trade Assurance
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 18 }}>
                    Formulate India handles sourcing, invoicing and delivery directly — your enquiry goes to our
                    trade desk, not to an unverified third party.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* Mobile / Tablet Single Column Stacked */
            <View style={{ gap: spacing.md }}>
              <View style={{ borderRadius: radius.lg, overflow: "hidden" }}>
                <ImageGallery
                  images={images}
                  aspectRatio={1.5}
                  maxHeight={GALLERY_MAX_HEIGHT}
                  alt={listing.title}
                  fallback={<CategoryArt category={category} style={StyleSheet.absoluteFill} />}
                />
              </View>

              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Badge label={categoryLabel(category)} tone="brand" />
                  <Badge label="Verified Wholesale" tone="success" />
                </View>
                <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
                  {listing.title}
                </Text>
                {listing.manufacturer_brand && (
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>
                    Brand: <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.ink }}>{listing.manufacturer_brand}</Text>
                  </Text>
                )}
                <View style={{ marginTop: spacing.sm }}>
                  <BulkPriceCard listing={listing} />
                </View>

                {(listing.dispatch_states?.length ?? 0) > 0 || (listing.transport_modes?.length ?? 0) > 0 ? (
                  <View style={{ gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
                    <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink }}>
                      Logistics &amp; Dispatch
                    </Text>
                    {listing.dispatch_states?.length > 0 && <InfoLine label="Dispatches from" values={listing.dispatch_states} />}
                    {listing.transport_modes?.length > 0 && <InfoLine label="Transport" values={listing.transport_modes} />}
                  </View>
                ) : null}

                <View style={{ marginTop: spacing.sm }}>
                  <SpecificationSection specification={listing.specification} brand={listing.manufacturer_brand} />
                </View>

                <Button label="Ask Trellis about this listing" variant="outline" onPress={() => openChat()} />

                <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.brand, marginBottom: 2 }}>
                    🛡️ Formulate India Trade Assurance
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 18 }}>
                    Formulate India handles sourcing, invoicing and delivery directly — your enquiry goes to our
                    trade desk, not to an individual supplier.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <Footer />
      </ScrollView>

      {/* Sticky Dual-Action CTA Dock */}
      <View
        style={[
          styles.ctaBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingBottom: 12 + insets.bottom,
            shadowColor: "#111C15",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 8,
          },
        ]}
      >
        <View style={{ width: "100%", maxWidth: maxWidth, alignSelf: "center", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 10.5, letterSpacing: 0.5, color: colors.inkFaint, textTransform: "uppercase" }}>
              Direct Wholesale Rate
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: wide ? 17 : 15, color: colors.brand }}>
              {range ?? "Volume Pricing"}
              {unit ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft }}> / {unit}</Text> : null}
              <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint }}> + GST</Text>
            </Text>
          </View>
          <View style={{ minWidth: wide ? 200 : 160, flexShrink: 0 }}>
            <Link href={{ pathname: "/rfq/[listingId]", params: { listingId: String(listing.id) } }} asChild>
              <Button label="Request a quote" />
            </Link>
          </View>
        </View>
      </View>
    </AppShell>
  );
}

function InfoLine({ label, values }: { label: string; values: string[] }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, minWidth: 110 }}>{label}</Text>
      {values.map((v) => (
        <Badge key={v} label={v} tone="neutral" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingVertical: 12,
  },
});
