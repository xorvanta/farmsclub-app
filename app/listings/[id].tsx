import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { BulkPriceCard } from "@/components/BulkPriceCard";
import { SpecificationSection, ImageGallery, specificationSummary } from "@/components/ListingSpecs";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryArt } from "@/components/graphics/CategoryArt";
import { categoryLabel } from "@/constants/categories";
import { formatPriceRange } from "@/lib/format";
import { b2bApi, ApiError } from "@/lib/api";
import { useChat } from "@/lib/chat-context";
import type { B2bListing } from "@/lib/types";

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openChat, setListingContext } = useChat();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<B2bListing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setListing(null);
    b2bApi
      .getListing(Number(id))
      .then(setListing)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load this listing."));
  }, [id]);

  useEffect(() => void load(), [load]);

  // Keeps Trellis grounded in the real listing the buyer is actually looking at, cleared again
  // on navigating away so a later chat on another page doesn't carry stale listing context.
  useEffect(() => {
    if (!listing) return;
    const unit = listing.unit ?? listing.bulk_unit ?? null;
    const moq = listing.moq ?? listing.bulk_min_quantity ?? null;
    const range = formatPriceRange(listing.price_from, listing.price_to);
    setListingContext({
      title: listing.title,
      category: categoryLabel(listing.category ?? listing.bulk_category),
      // Field name kept for the backend contract; carries the buyer price range, not one flat rate.
      bulkPrice: range ? `${range}${unit ? ` per ${unit}` : ""} (before GST, varies by quantity tier)` : undefined,
      bulkUnit: unit ?? undefined,
      bulkMinQuantity: moq != null ? String(moq) : undefined,
    });
    return () => setListingContext(null);
  }, [listing, setListingContext]);

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
        <ErrorState message={error ?? "This listing isn't available."} onRetry={load} />
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

  return (
    <AppShell noScroll hideBottomNav>
      <Head>
        <title>{listing.title} · FarmsClub</title>
        <meta name="description" content={`${metaDescription}.`} />
      </Head>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ImageGallery
          images={images}
          aspectRatio={1.6}
          fallback={<CategoryArt category={category} style={StyleSheet.absoluteFill} />}
        />

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Badge label={categoryLabel(category)} tone="brand" />
            <Badge label="Live" tone="success" />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
            {listing.title}
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <BulkPriceCard listing={listing} />
          </View>

          {(listing.dispatch_states?.length ?? 0) > 0 || (listing.transport_modes?.length ?? 0) > 0 ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>Dispatch &amp; transport</Text>
              {listing.dispatch_states?.length > 0 && (
                <InfoLine label="Dispatches from" values={listing.dispatch_states} />
              )}
              {listing.transport_modes?.length > 0 && (
                <InfoLine label="Transport" values={listing.transport_modes} />
              )}
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
            <SpecificationSection specification={listing.specification} brand={listing.manufacturer_brand} />
          </View>

          <Button label="Ask Trellis about this listing" variant="outline" onPress={() => openChat()} />

          <View
            style={[
              styles.trustNote,
              { backgroundColor: colors.infoSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl },
            ]}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.ink, lineHeight: 18 }}>
              Formulate India handles sourcing, invoicing and delivery directly — your enquiry goes to our
              trade desk, not to an individual supplier.
            </Text>
          </View>
        </View>
        <Footer />
      </ScrollView>

      {/* Sticky CTA — the one action this whole page exists to drive. */}
      <View
        style={[
          styles.ctaBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingBottom: 12 + insets.bottom },
        ]}
      >
        <Button
          label="Request a Quote"
          fullWidth
          onPress={() => router.push({ pathname: "/rfq/[listingId]", params: { listingId: String(listing.id) } })}
        />
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
  trustNote: {},
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingVertical: 12,
  },
});
