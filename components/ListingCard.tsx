import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { categoryLabel } from "@/constants/categories";
import { formatPriceRange, formatQty } from "@/lib/format";
import { Badge } from "./Badge";
import { CategoryArt } from "@/components/graphics/CategoryArt";
import type { B2bListing } from "@/lib/types";

export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const priceRange = formatPriceRange(listing.price_from, listing.price_to);
  const unit = listing.unit ?? listing.bulk_unit ?? null;
  const moq = listing.moq ?? listing.bulk_min_quantity ?? null;
  const category = listing.category ?? listing.bulk_category;

  return (
    <Pressable
      onPress={() => router.push(`/listings/${listing.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {listing.photo_url ? (
          <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <CategoryArt category={category} style={StyleSheet.absoluteFill} />
        )}
      </View>

      <View style={{ padding: spacing.md, gap: 6 }}>
        <Badge label={categoryLabel(category)} tone="brand" />
        <Text
          numberOfLines={2}
          style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, lineHeight: 20 }}
        >
          {listing.title}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {priceRange && (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.brand }}>
              {priceRange}
              {unit ? (
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}> / {unit}</Text>
              ) : null}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint }}>before GST</Text>
          </View>
        )}
        {moq != null && (
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
            MOQ {formatQty(moq)}{unit ? ` ${unit}` : ""}
          </Text>
        )}
        {listing.manufacturer_brand ? (
          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint }}>
            Brand: {listing.manufacturer_brand}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden", flex: 1 },
  imageWrap: { aspectRatio: 1.3, width: "100%", position: "relative" },
  image: { width: "100%", height: "100%" },
  divider: { height: 1, marginVertical: 4 },
});
