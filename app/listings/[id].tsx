import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { BulkPriceCard } from "@/components/BulkPriceCard";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { categoryLabel } from "@/constants/categories";
import { formatRupees } from "@/lib/format";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
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

  if (!listing && !error) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading listing…" />
      </AppShell>
    );
  }
  if (error || !listing) {
    return (
      <AppShell noScroll>
        <ErrorState message={error ?? "This listing isn't available."} onRetry={load} />
      </AppShell>
    );
  }

  return (
    <AppShell noScroll>
      <Head>
        <title>{listing.title} · FarmsClub</title>
        <meta name="description" content={`${listing.title} — bulk price ${formatRupees(listing.bulk_price)} per ${listing.bulk_unit ?? "unit"} on FarmsClub.`} />
      </Head>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.imageWrap, { backgroundColor: colors.brandSoft }]}>
          {listing.photo_url ? (
            <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <Text style={{ fontFamily: fonts.display, fontSize: 48, color: colors.brand }}>
              {listing.title.charAt(0)}
            </Text>
          )}
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Badge label={categoryLabel(listing.bulk_category)} tone="brand" />
            <Badge label="Live" tone="success" />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
            {listing.title}
          </Text>
          {listing.specification ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 4, lineHeight: 20 }}>
              {listing.specification}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.lg }}>
            <BulkPriceCard listing={listing} />
          </View>

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
          { backgroundColor: colors.surface, borderTopColor: colors.border, paddingHorizontal: spacing.lg },
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

const styles = StyleSheet.create({
  imageWrap: { aspectRatio: 1.6, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
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
