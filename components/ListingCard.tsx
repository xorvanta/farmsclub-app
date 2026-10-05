import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { categoryLabel } from "@/constants/categories";
import { priceRange } from "@/lib/format";
import { Badge } from "./Badge";
import type { B2bListing } from "@/lib/types";

export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const lowestMoq = listing.moq;

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
        <Badge label={categoryLabel(listing.category)} tone="brand" />
        <Text
          numberOfLines={2}
          style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, lineHeight: 20 }}
        >
          {listing.title}
        </Text>
        {listing.manufacturer_brand ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint }}>
            {listing.manufacturer_brand}
          </Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.brand }}>
          {priceRange(listing.priceTiers)}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
          per {listing.unit}
          {lowestMoq ? ` · MOQ ${lowestMoq.toLocaleString("en-IN")}` : ""}
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
