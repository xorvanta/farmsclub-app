import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { TRADE_DESK_PHOTO } from "@/constants/categoryImages";

const POINTS = [
  {
    step: "01",
    title: "One counterparty, start to finish",
    body: "Every order is sold and invoiced by Formulate India — not the grower or manufacturer directly. One GST invoice, one point of contact, one payout schedule, regardless of how many sellers your order actually draws from.",
  },
  {
    step: "02",
    title: "Volume pricing, not list price",
    body: "Prices shown step down by quantity band. Larger orders are quoted against the platform's live supplier rates with transparent freight.",
  },
  {
    step: "03",
    title: "Sealed, competitive sourcing",
    body: "Bigger requirements go out to every subscribed seller in that category for a sealed bid — the lowest qualified bid wins, and only the winning price is ever shared back.",
  },
  {
    step: "04",
    title: "Delivery confirmed, not assumed",
    body: "Our team calls to confirm delivery before an order is closed and a seller is paid — so a dispatch isn't the end of our involvement.",
  },
];

export default function About() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 960, width: "100%", alignSelf: "center" }}>
      <SeoHead title="How it works · FarmsClub" description="How Formulate India sources, prices, and fulfils bulk orders of plants, seeds, pots, tools, and soil & fertiliser through FarmsClub." />
      <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: wide ? 32 : 26, color: colors.ink, maxWidth: 600 }}>
        Wholesale Procurement Engine
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, marginTop: 10, maxWidth: 640, lineHeight: 22 }}>
        FarmsClub is run by Formulate India, a dedicated commercial horticulture trade business. It exists for one thing:
        buying plants, seeds, pots, tools, and soil &amp; fertiliser in bulk volume, reliably, with legitimate GST paperwork
        that stands up to audit.
      </Text>

      <View style={{ marginTop: spacing.xl }}>
        <SectionBanner
          eyebrow="One counterparty"
          title="Formulate India sells and invoices every order directly."
          body="Not the grower, not the manufacturer — so you get one GST invoice and one point of contact, however many sellers an order actually draws from."
          photo={TRADE_DESK_PHOTO}
          insetHorizontal={false}
        />
      </View>

      <View style={{ marginTop: spacing.xxl, flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
        {POINTS.map((p) => (
          <View
            key={p.title}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.xl,
                flexBasis: wide ? "47%" : "100%",
                flexGrow: 1,
              },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={[styles.stepPill, { backgroundColor: colors.brandSoft, borderRadius: radius.pill }]}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.brand, letterSpacing: 0.5 }}>
                  STEP {p.step}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 16.5, color: colors.ink }}>{p.title}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginTop: 8, lineHeight: 20 }}>
              {p.body}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing.xxl, flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
        <Link href="/listings" asChild>
          <Button label="Browse the catalogue" />
        </Link>
        <Link href="/contact" asChild>
          <Button label="Talk to the trade desk" variant="outline" />
        </Link>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: "#111C15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
