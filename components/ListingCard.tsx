import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { PressableLink } from "./PressableLink";
import { Photo } from "./Photo";
import { Tag } from "./Tag";
import { Button } from "./Button";
import { LogoMark } from "./graphics/LogoMark";
import { listingCategoryName, listingMoqLabel, listingPriceLabel, listingSpecChips, showsGst } from "@/lib/listing";
import type { B2bListing } from "@/lib/types";

/**
 * Storefront §4.2 listing card: image (fallback: category image), category label, title, spec
 * chips (only filled), "₹78–₹90 / plant" (no GST label unless the listing's rate is above 0),
 * "MOQ 100 plants", and a "Request quote" button. The image/title block and the button are two
 * separate links (an <a> can't contain another <a>).
 */
export function ListingCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const price = listingPriceLabel(listing);
  const moq = listingMoqLabel(listing);
  const category = listingCategoryName(listing);
  const chips = listingSpecChips(listing);
  const image = listing.photo_url || listing.category?.image_url || null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <PressableLink
        href={{ pathname: "/listings/[id]", params: { id: String(listing.id) } }}
        accessibilityLabel={[listing.title, category, price, moq].filter(Boolean).join(", ")}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.94 : 1 }]}
      >
        <View style={{ aspectRatio: 4 / 3, width: "100%", backgroundColor: colors.brandSoft }}>
          {image ? (
            <Photo uri={image} alt={listing.title} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <LogoMark size={40} />
            </View>
          )}
        </View>

        <View style={{ padding: spacing.md, paddingBottom: spacing.sm, gap: 6 }}>
          {category ? (
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: colors.brand }}>
              {category}
            </Text>
          ) : null}
          <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 14.5, color: colors.ink, lineHeight: 20 }}>
            {listing.title}
          </Text>
          {chips.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
              {chips.map((c) => (
                <Tag key={c} label={c} tone="neutral" />
              ))}
            </View>
          ) : null}
          {price ? (
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.brand, marginTop: 2 }}>
              {price}
              {showsGst(listing) ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint }}> + GST</Text> : null}
            </Text>
          ) : null}
          {moq ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft }}>{moq}</Text> : null}
        </View>
      </PressableLink>
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
        <Link href={{ pathname: "/rfq/[listingId]", params: { listingId: String(listing.id) } }} asChild>
          <Button label="Request quote" variant="secondary" fullWidth accessibilityLabel={`Request a quote for ${listing.title}`} />
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
    shadowColor: "#111C15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
