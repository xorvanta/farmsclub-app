import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { formatRupees, formatQty, formatPriceRange } from "@/lib/format";
import type { B2bListing, B2bPriceTier } from "@/lib/types";

/** Quantity-tier pricing (§6.2): the headline buyer price range, then one row per quantity band
 *  with its price per unit, before GST. Only buyer prices — never a seller rate or retail MRP. */
export function BulkPriceCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const unit = listing.unit ?? listing.bulk_unit ?? null;
  const moq = listing.moq ?? listing.bulk_min_quantity ?? null;
  const priceRange = formatPriceRange(listing.price_from, listing.price_to);
  const tiers = listing.tiers ?? [];

  const qtyLabel = (t: B2bPriceTier) =>
    t.maxQty == null
      ? `${formatQty(Number(t.minQty))}+${unit ? ` ${unit}` : ""}`
      : `${formatQty(Number(t.minQty))}–${formatQty(Number(t.maxQty))}${unit ? ` ${unit}` : ""}`;

  const headStyle = { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.4, color: "rgba(255,255,255,0.75)" };

  return (
    <View style={{ backgroundColor: colors.brand, borderRadius: radius.lg, padding: spacing.lg }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
        Bulk price
      </Text>
      {priceRange && (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, color: "#FFFFFF" }}>{priceRange}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
            {unit ? `/ ${unit} · ` : ""}before GST
          </Text>
        </View>
      )}

      {tiers.length > 0 && (
        <>
          <View style={{ marginTop: spacing.md, borderRadius: radius.md, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" }}>
            <View style={[styles.row, { paddingHorizontal: spacing.md, backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Text style={[styles.cell, headStyle]}>QUANTITY</Text>
              <Text style={[styles.cell, styles.right, headStyle]}>PRICE / {unit ? unit.toUpperCase() : "UNIT"}</Text>
            </View>
            {tiers.map((t, i) => (
              <View
                key={`${t.minQty}-${i}`}
                style={[
                  styles.row,
                  { paddingHorizontal: spacing.md },
                  i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
                ]}
              >
                <Text style={[styles.cell, { fontFamily: fonts.body, fontSize: 14, color: "#FFFFFF" }]}>{qtyLabel(t)}</Text>
                <Text style={[styles.cell, styles.right, { fontFamily: fonts.bodyBold, fontSize: 14, color: "#FFFFFF" }]}>
                  {formatRupees(Number(t.pricePerUnit))}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
            Prices per unit, before GST{listing.gst_rate != null ? ` (GST ${Number(listing.gst_rate)}% extra)` : ""}.
          </Text>
        </>
      )}

      {moq != null && (
        <View style={[styles.moqRow, { borderTopColor: "rgba(255,255,255,0.18)", marginTop: spacing.md, paddingTop: spacing.md }]}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Minimum order quantity</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }}>
            {formatQty(Number(moq))}{unit ? ` ${unit}` : ""}
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
