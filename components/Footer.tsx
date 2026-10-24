import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Logo, TAGLINE } from "@/components/Logo";

/** Storefront §2.3: brand block, Explore / Help / Legal columns, and the legal line. */
const COLUMNS: { title: string; links: { label: string; href: Href }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Farms", href: "/farms" },
      { label: "Bulk supply", href: "/listings" },
      { label: "List your farm", href: "/list-your-farm" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "How it works", href: "/about" },
      { label: "FAQs", href: "/faqs" },
      { label: "Enquire", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export const LEGAL_LINE = "© 2026 FarmsClub · a Xorvanta Technologies product";

export function Footer() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const stacked = width < 680;

  return (
    <View style={{ backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingTop: 40, paddingBottom: 28 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
        <View style={[styles.columns, stacked && styles.columnsStacked]}>
          <View style={[stacked ? styles.fullWidth : styles.brandBlock, { gap: 10 }]}>
            <Logo size={19} onDark />
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.78)" }}>{TAGLINE}</Text>
          </View>
          <View style={[styles.linkColumns, stacked && { gap: 24 }]}>
            {COLUMNS.map((col) => (
              <View key={col.title} style={{ gap: spacing.sm, minWidth: stacked ? 96 : 140, flexGrow: 1 }}>
                <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                  {col.title}
                </Text>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.9)", paddingVertical: 6 }}>
                    {l.label}
                  </Link>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Phones: room on the right for the floating Trellis button, so the line wraps instead of hiding under it. */}
        <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", marginTop: spacing.xl, paddingTop: spacing.lg, paddingRight: stacked ? 64 : 0 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.7)" }}>{LEGAL_LINE}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", gap: 32 },
  columnsStacked: { flexDirection: "column", gap: 28 },
  brandBlock: { flex: 1.2 },
  linkColumns: { flex: 2, flexDirection: "row", flexWrap: "wrap", gap: 32 },
  fullWidth: { width: "100%" },
});
