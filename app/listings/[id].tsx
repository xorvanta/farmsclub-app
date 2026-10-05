import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Header } from "@/components/Header";
import { Badge } from "@/components/Badge";
import { PriceTierTable } from "@/components/PriceTierTable";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { categoryLabel } from "@/constants/categories";
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
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <Header />
        <LoadingState label="Loading listing…" />
      </View>
    );
  }
  if (error || !listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <Header />
        <ErrorState message={error ?? "This listing isn't available."} onRetry={load} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Header />
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
            <Badge label={categoryLabel(listing.category)} tone="brand" />
            <Badge label="Live" tone="success" />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
            {listing.title}
          </Text>
          {listing.manufacturer_brand ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint }}>
              Manufacturer: {listing.manufacturer_brand}
            </Text>
          ) : null}
          {listing.specification ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 4, lineHeight: 20 }}>
              {listing.specification}
            </Text>
          ) : null}

          {/* ── Pricing ── */}
          <View style={{ marginTop: spacing.lg }}>
            <SectionLabel>Volume pricing</SectionLabel>
            <View style={{ marginTop: spacing.sm }}>
              <PriceTierTable tiers={listing.priceTiers} unit={listing.unit} />
            </View>
          </View>

          {/* ── Meta ── */}
          <View style={[styles.metaGrid, { marginTop: spacing.lg }]}>
            <MetaItem label="MOQ" value={listing.moq ? `${listing.moq.toLocaleString("en-IN")} ${listing.unit}` : "On request"} />
            <MetaItem label="Unit" value={listing.unit} />
          </View>

          {listing.dispatchStates.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <SectionLabel>Dispatches from</SectionLabel>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
                {listing.dispatchStates.map((s) => (
                  <Badge key={s} label={s} tone="neutral" />
                ))}
              </View>
            </View>
          )}

          {listing.transportModes.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <SectionLabel>Transport</SectionLabel>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }}>
                {listing.transportModes.map((t) => (
                  <Badge key={t} label={t} tone="neutral" />
                ))}
              </View>
            </View>
          )}

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
    </View>
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

function MetaItem({ label, value }: { label: string; value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ minWidth: 120 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkFaint, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: { aspectRatio: 1.6, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  metaGrid: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
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
