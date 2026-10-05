import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { categoryLabel } from "@/constants/categories";
import { formatRupees, formatQty } from "@/lib/format";
import { Badge } from "./Badge";
import type { B2bListing } from "@/lib/types";

export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const showMrp = listing.compare_price != null && listing.compare_price > listing.bulk_price;

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
      <View style={[styles.imageWrap, { backgroundColor: colors.brandSoft }]}>
        {listing.photo_url ? (
          <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={{ fontFamily: fonts.heading, color: colors.brand, fontSize: 22 }}>
              {listing.title.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.md, gap: 6 }}>
        <Badge label={categoryLabel(listing.bulk_category)} tone="brand" />
        <Text
          numberOfLines={2}
          style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, lineHeight: 20 }}
        >
          {listing.title}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.brand }}>
            {formatRupees(listing.bulk_price)}
          </Text>
          {showMrp && (
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint, textDecorationLine: "line-through" }}>
              {formatRupees(listing.compare_price!)}
            </Text>
          )}
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
          {listing.bulk_unit ? `per ${listing.bulk_unit}` : "per unit"}
          {listing.bulk_min_quantity ? ` · MOQ ${formatQty(listing.bulk_min_quantity)}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden", flex: 1 },
  imageWrap: { aspectRatio: 1.3, width: "100%" },
  image: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginVertical: 4 },
});
