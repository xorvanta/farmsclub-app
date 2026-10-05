import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { formatRupees } from "@/lib/format";
import type { PriceTier } from "@/lib/types";

export function PriceTierTable({ tiers, unit }: { tiers: PriceTier[]; unit: string }) {
  const { colors, fonts, radius, spacing } = useTheme();

  if (tiers.length === 0) {
    return (
      <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, fontSize: 14 }}>
        Pricing is confirmed once a deal is posted for this product. Submit an enquiry to get a quote.
      </Text>
    );
  }

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" }}>
      <View style={[styles.row, styles.headRow, { backgroundColor: colors.brandSoft }]}>
        <Text style={[styles.headCell, { fontFamily: fonts.bodySemiBold, color: colors.brand, flex: 1.3 }]}>
          Quantity ({unit})
        </Text>
        <Text style={[styles.headCell, { fontFamily: fonts.bodySemiBold, color: colors.brand, flex: 1 }]}>
          Price / {unit}
        </Text>
      </View>
      {tiers.map((tier, i) => (
        <View
          key={i}
          style={[
            styles.row,
            {
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text style={[styles.cell, { fontFamily: fonts.body, color: colors.ink, flex: 1.3 }]}>
            {tier.max_qty ? `${tier.min_qty} – ${tier.max_qty}` : `${tier.min_qty}+`}
          </Text>
          <Text style={[styles.cell, { fontFamily: fonts.bodyBold, color: colors.brand, flex: 1 }]}>
            {formatRupees(tier.buyer_price)}
          </Text>
        </View>
      ))}
      <View style={[styles.footNote, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint }}>
          Larger orders unlock better rates — prices shown are before GST.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  headRow: { paddingVertical: 10 },
  headCell: { fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase", paddingHorizontal: 14 },
  cell: { fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  footNote: {},
});
