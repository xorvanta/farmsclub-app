import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient as SvgRadial, Stop } from "react-native-svg";
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

function FooterDiya() {
  return (
    <Svg width={36} height={32} viewBox="0 0 36 32">
      <Defs>
        <SvgRadial id="footerDiyaGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFA940" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#160802" stopOpacity="0" />
        </SvgRadial>
        <SvgRadial id="footerFlame" cx="50%" cy="60%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="40%" stopColor="#FFF566" stopOpacity="0.95" />
          <Stop offset="80%" stopColor="#FF7A45" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#CF1322" stopOpacity="0" />
        </SvgRadial>
      </Defs>
      <Circle cx={18} cy={16} r={14} fill="url(#footerDiyaGlow)" />
      <Ellipse cx={18} cy={23} rx={14} ry={4.5} fill="#4B1B04" />
      <Path d="M 5,20 C 8,27 28,27 31,20 C 27,17 9,17 5,20 Z" fill="#D46B08" stroke="#FFE58F" strokeWidth={0.8} />
      <Ellipse cx={18} cy={20} rx={11} ry={3} fill="#FFE58F" opacity={0.7} />
      <Path d="M 16.5,19 C 13,13 18,5 18,3 C 18,5 23,13 19.5,19 Z" fill="url(#footerFlame)" />
      <Circle cx={18} cy={14} r={1.5} fill="#FFFFFF" />
    </Svg>
  );
}

export function Footer() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { openTour } = useTour();
  const stacked = width < 680;

  return (
    <LinearGradient colors={["#0B2618", "#071A10"]} style={{ paddingHorizontal: spacing.lg, paddingTop: 44, paddingBottom: 32 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", gap: spacing.xl }}>
        {/* Auspicious Diwali Festive Strip */}
        <LinearGradient
          colors={["#240E04", "#1F0A02", "#0C1F13"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: "rgba(245,184,65,0.38)",
            paddingVertical: 12,
            paddingHorizontal: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FooterDiya />
          <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={{ fontFamily: fonts.devanagari ?? fonts.bodyBold, fontSize: 13.5, color: "#FFE066" }}>
                शुभ दीपावली
              </Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#FFFFFF" }}>
                · Happy Diwali
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 16 }}>
              Wishing you and your family an auspicious festive season of light, abundance, and prosperity.
            </Text>
          </View>
        </LinearGradient>

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
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: "rgba(229,180,98,0.85)" }}>
            🪔 Shubh Deepavali · FarmsClub B2B Edition · High-Volume Agri Trade
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
