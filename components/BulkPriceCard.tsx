import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { formatRupees, formatQty } from "@/lib/format";
import { listingMoq, listingPriceLabel, listingUnit, pluralUnit, showsGst } from "@/lib/listing";
import type { B2bListing, B2bPriceTier } from "@/lib/types";

/**
 * Price block (Storefront §9.2): "₹78–₹90 / plant", then one row per quantity band with its
 * price per unit, then MOQ. No GST label unless the listing's GST rate is above 0 (§1.3).
 */
export function BulkPriceCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const unit = listingUnit(listing);
  const moq = listingMoq(listing);
  const price = listingPriceLabel(listing);
  const tiers = listing.tiers ?? [];
  const gst = showsGst(listing);

  const qtyLabel = (t: B2bPriceTier) => {
    const u = pluralUnit(unit, 2);
    return t.maxQty == null
      ? `${formatQty(Number(t.minQty))}+${u ? ` ${u}` : ""}`
      : `${formatQty(Number(t.minQty))}–${formatQty(Number(t.maxQty))}${u ? ` ${u}` : ""}`;
  };

  const headStyle = { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.4, color: "rgba(255,255,255,0.8)" };

  return (
    <View style={{ backgroundColor: colors.brand, borderRadius: radius.lg, padding: spacing.lg }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
        Price by quantity
      </Text>

      {price && (
        <Text style={{ fontFamily: fonts.display, fontSize: 30, color: "#FFFFFF", marginTop: 8 }}>
          {price}
          {gst ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.85)" }}> + GST</Text> : null}
        </Text>
      )}

      {tiers.length > 0 && (
        <View style={{ marginTop: spacing.md, borderRadius: radius.md, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
          <View style={[styles.row, { paddingHorizontal: spacing.md, backgroundColor: "rgba(255,255,255,0.14)" }]}>
            <Text style={[styles.cell, headStyle]}>QUANTITY</Text>
            <Text style={[styles.cell, styles.right, headStyle]}>PRICE / {unit ? unit.toUpperCase() : "UNIT"}</Text>
          </View>
          {tiers.map((t, i) => (
            <View
              key={`${t.minQty}-${i}`}
              style={[styles.row, { paddingHorizontal: spacing.md }, i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }]}
            >
              <Text style={[styles.cell, { fontFamily: fonts.bodyMedium, fontSize: 14, color: "#FFFFFF" }]}>{qtyLabel(t)}</Text>
              <Text style={[styles.cell, styles.right, { fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }]}>
                {formatRupees(Number(t.pricePerUnit))}
              </Text>
            </View>
          ))}
        </View>
      )}

      {moq != null && (
        <View style={[styles.moqRow, { borderTopColor: "rgba(255,255,255,0.18)", marginTop: spacing.md, paddingTop: spacing.md }]}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.88)" }}>Minimum order (MOQ)</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }}>
            {formatQty(Number(moq))}
            {unit ? ` ${pluralUnit(unit, Number(moq))}` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  cell: { flex: 1 },
  right: { textAlign: "right" },
  moqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1 },
});
