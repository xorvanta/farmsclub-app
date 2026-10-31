import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { PressableLink } from "./PressableLink";
import { Photo } from "./Photo";
import { Tag } from "./Tag";
import { Button } from "./Button";
import { LogoMark } from "./graphics/LogoMark";
import { listingCategoryName, listingMoqLabel, listingPriceLabel, listingSpecChips, showsGst } from "@/lib/listing";
import type { B2bListing } from "@/lib/types";

/**
 * Storefront §4.2 B2B Wholesale Lot Card:
 * Image with floating MOQ & category badges, bold tiered price block,
 * visual spec chips, and a high-contrast "Request quote" CTA.
 * The image/title block and the button remain two separate links so <a> never nests inside <a>.
 */
export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const price = listingPriceLabel(listing);
  const moq = listingMoqLabel(listing);
  const category = listingCategoryName(listing);
  const chips = listingSpecChips(listing);
  const image = listing.photo_url || listing.category?.image_url || null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <PressableLink
        href={{ pathname: "/listings/[id]", params: { id: String(listing.id) } }}
        accessibilityLabel={[listing.title, category, price, moq].filter(Boolean).join(", ")}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.94 : 1 }]}
      >
        {/* Visual Media Stage with Floating Trade Badges */}
        <View style={{ aspectRatio: 4 / 3, width: "100%", backgroundColor: colors.brandSoft, position: "relative" }}>
          {image ? (
            <Photo uri={image} alt={listing.title} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <LogoMark size={42} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(8,30,18,0.45)", "transparent", "rgba(8,30,18,0.78)"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Row Overlay: Category & Bulk Tier Pill */}
          <View style={{ position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            {category ? (
              <View style={{ backgroundColor: "rgba(8,30,18,0.82)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(229,180,98,0.35)", flexShrink: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", color: "#E5B462" }}>
                  {category}
                </Text>
              </View>
            ) : <View />}

            {moq ? (
              <View style={{ backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.brand }}>
                  {moq}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Image Overlay: Price Slab Highlight */}
          {price ? (
            <View style={{ position: "absolute", bottom: 10, left: 10, right: 10, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <View style={{ backgroundColor: "rgba(8,30,18,0.88)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: "#E5B462", maxWidth: "100%" }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 16, color: "#FFFFFF" }}>
                  {price}
                  {showsGst(listing) ? <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: "rgba(255,255,255,0.78)" }}> + GST</Text> : null}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Minimal, Visual Card Body */}
        <View style={{ padding: spacing.md, paddingBottom: spacing.sm, gap: 8, flex: 1 }}>
          <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink, lineHeight: 20 }}>
            {listing.title}
          </Text>

          {chips.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
              {chips.slice(0, 3).map((c) => (
                <Tag key={c} label={c} tone="neutral" />
              ))}
            </View>
          ) : null}

          {!price && moq ? (
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.inkSoft }}>{moq}</Text>
          ) : null}
        </View>
      </PressableLink>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: 2 }}>
        <Link href={{ pathname: "/rfq/[listingId]", params: { listingId: String(listing.id) } }} asChild>
          <Button label="Request bulk quote →" variant="secondary" fullWidth accessibilityLabel={`Request a quote for ${listing.title}`} />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    shadowColor: "#081E12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
});
