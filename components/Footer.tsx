import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { useTour } from "@/lib/tour-context";
import { Logo, TAGLINE } from "@/components/Logo";

/** Storefront §2.3: brand block, Explore / Help / Legal columns, and the legal line. */
const COLUMNS: { title: string; links: { label: string; href: Href }[] }[] = [
  {
    title: "Platform & Network",
    links: [
      { label: "Bulk supply", href: "/listings" },
      { label: "Verified farms", href: "/farms" },
      { label: "List your farm", href: "/list-your-farm" },
    ],
  },
  {
    title: "Trade Desk",
    links: [
      { label: "How it works", href: "/about" },
      { label: "FAQs", href: "/faqs" },
      { label: "Enquire / RFQ", href: "/contact" },
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

const PILLARS = [
  { badge: "01 · GROUND-FILMED", label: "Real farm documentaries & mother stock" },
  { badge: "02 · VOLUME SLABS", label: "Transparent quantity-tiered pricing" },
  { badge: "03 · PAN-INDIA TRANSIT", label: "Road trucks & Indian Railways dispatch" },
];

export const LEGAL_LINE = "© 2026 FarmsClub · a Xorvanta Technologies product";

export function Footer() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { openTour } = useTour();
  const stacked = width < 680;

  return (
    <LinearGradient colors={["#0B2618", "#071A10"]} style={{ paddingHorizontal: spacing.lg, paddingTop: 44, paddingBottom: 32 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", gap: spacing.xl }}>
        {/* Visual B2B Trust Strip */}
        <View
          style={{
            flexDirection: stacked ? "column" : "row",
            gap: spacing.md,
            paddingBottom: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.12)",
          }}
        >
          {PILLARS.map((p) => (
            <View
              key={p.badge}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: radius.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.2)",
                gap: 3,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: "#E5B462" }}>{p.badge}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: "rgba(255,255,255,0.88)" }}>{p.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.columns, stacked && styles.columnsStacked]}>
          <View style={[stacked ? styles.fullWidth : styles.brandBlock, { gap: 12 }]}>
            <Logo size={20} onDark />
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.78)", maxWidth: 320, lineHeight: 20 }}>
              {TAGLINE} — connecting bulk orchard buyers with verified growers across India.
            </Text>
            <Pressable
              onPress={() => openTour(0)}
              accessibilityRole="button"
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: "rgba(229,180,98,0.15)",
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.45)",
                marginTop: 4,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#E5B462" }}>✦ Launch Interactive Platform Tour →</Text>
            </Pressable>
          </View>
          <View style={[styles.linkColumns, stacked && { gap: 24 }]}>
            {COLUMNS.map((col) => (
              <View key={col.title} style={{ gap: spacing.sm, minWidth: stacked ? 96 : 140, flexGrow: 1 }}>
                <Text accessibilityRole="header" style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.7, textTransform: "uppercase", color: "#E5B462" }}>
                  {col.title}
                </Text>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: "rgba(255,255,255,0.88)", paddingVertical: 5 }}>
                    {l.label}
                  </Link>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", paddingTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.65)" }}>{LEGAL_LINE}</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: "rgba(229,180,98,0.8)" }}>
            FarmsClub B2B Edition · Built for High-Volume Agri Trade
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", gap: 32 },
  columnsStacked: { flexDirection: "column", gap: 28 },
  brandBlock: { flex: 1.3 },
  linkColumns: { flex: 2, flexDirection: "row", flexWrap: "wrap", gap: 32 },
  fullWidth: { width: "100%" },
});
