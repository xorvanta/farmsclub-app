import { View, Text, Image, StyleSheet } from "react-native";
import { PressableLink } from "./PressableLink";
import { useTheme } from "@/constants/theme-context";
import { categoryLabel } from "@/constants/categories";
import { formatPriceRange, formatQtyWithUnit } from "@/lib/format";
import { Badge } from "./Badge";
import { CategoryArt } from "@/components/graphics/CategoryArt";
import type { B2bListing } from "@/lib/types";

export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const priceRange = formatPriceRange(listing.price_from, listing.price_to);
  const unit = listing.unit ?? listing.bulk_unit ?? null;
  const moq = listing.moq ?? listing.bulk_min_quantity ?? null;
  const category = listing.category ?? listing.bulk_category;
  const hasTiers = (listing.tiers?.length ?? 0) > 1;

  return (
    <PressableLink
      href={`/listings/${listing.id}`}
      accessibilityLabel={[listing.title, priceRange ? `${priceRange}${unit ? ` per ${unit}` : ""} before GST` : null, moq != null ? `minimum order ${formatQtyWithUnit(moq, unit)}` : null]
        .filter(Boolean)
        .join(", ")}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {listing.photo_url ? (
          <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" alt={listing.title} />
        ) : (
          <CategoryArt category={category} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.topBadgesRow}>
          <Badge label={categoryLabel(category)} tone="brand" />
          {hasTiers && (
            <View style={[styles.tierTag, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.accentDark, letterSpacing: 0.2 }}>
                Tier Rates
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ padding: spacing.md, gap: 5, flex: 1, justifyContent: "space-between" }}>
        <View style={{ gap: 4 }}>
          <Text
            numberOfLines={2}
            style={{ fontFamily: fonts.heading, fontSize: 14.5, color: colors.ink, lineHeight: 20 }}
          >
            {listing.title}
          </Text>

          {listing.manufacturer_brand ? (
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint }}>
              By {listing.manufacturer_brand}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: 6, marginTop: 4 }}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {priceRange && (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16.5, color: colors.brand }}>
                {priceRange}
                {unit ? (
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft }}> / {unit}</Text>
                ) : null}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint }}>+ GST</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {moq != null ? (
              <View style={[styles.moqPill, { backgroundColor: colors.paper, borderRadius: radius.xs }]}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkSoft }}>
                  MOQ: <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.ink }}>{formatQtyWithUnit(moq, unit)}</Text>
                </Text>
              </View>
            ) : <View />}

            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.cta }}>
              Quote →
            </Text>
          </View>
        </View>
      </View>
    </PressableLink>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    shadowColor: "#111C15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { aspectRatio: 1.3, width: "100%", position: "relative" },
  image: { width: "100%", height: "100%" },
  topBadgesRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  moqPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  divider: { height: 1, marginVertical: 2 },
});
