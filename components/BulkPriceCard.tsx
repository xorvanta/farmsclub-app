import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { formatRupees, formatQty } from "@/lib/format";
import type { B2bListing } from "@/lib/types";

/** A single flat bulk price — this platform dropped tiered/multi-rate pricing by design (one
 *  seller-set bulk_price + MOQ per product, see V132). Given the weight here, it reads as a
 *  statement, not a data table row. */
export function BulkPriceCard({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const showMrp = listing.compare_price != null && listing.compare_price > listing.bulk_price;
  const savingsPercent = showMrp
    ? Math.round(((listing.compare_price! - listing.bulk_price) / listing.compare_price!) * 100)
    : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.brand, borderRadius: radius.lg, padding: spacing.lg },
      ]}
    >
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
        Bulk price
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: "#FFFFFF" }}>
          {formatRupees(listing.bulk_price)}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
          / {listing.bulk_unit ?? "unit"}
        </Text>
        {showMrp && (
          <View style={[styles.savingsPill, { backgroundColor: colors.accent }]}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: "#FFFFFF" }}>{savingsPercent}% off retail</Text>
          </View>
        )}
      </View>
      {showMrp && (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.6)", textDecorationLine: "line-through", marginTop: 4 }}>
          {formatRupees(listing.compare_price!)} retail
        </Text>
      )}

      <View style={[styles.moqRow, { borderTopColor: "rgba(255,255,255,0.18)", marginTop: spacing.md, paddingTop: spacing.md }]}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
          Minimum order quantity
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }}>
          {listing.bulk_min_quantity ? `${formatQty(listing.bulk_min_quantity)} ${listing.bulk_unit ?? "units"}` : "On request"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  savingsPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  moqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1 },
});
