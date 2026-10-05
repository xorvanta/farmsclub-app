import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";

const POINTS = [
  {
    title: "One counterparty, start to finish",
    body: "Every order is sold and invoiced by Formulate India — not the grower or manufacturer directly. One GST invoice, one point of contact, one payout schedule, regardless of how many sellers your order actually draws from.",
  },
  {
    title: "Volume pricing, not list price",
    body: "Prices shown step down by quantity band. Larger orders are quoted against the platform's live supplier rates, not a markup on retail pricing.",
  },
  {
    title: "Sealed, competitive sourcing",
    body: "Bigger requirements go out to every subscribed seller in that category for a sealed bid — the lowest qualified bid wins, and only the winning price is ever shared back.",
  },
  {
    title: "Delivery confirmed, not assumed",
    body: "Our team calls to confirm delivery before an order is closed and a seller is paid — so a dispatch isn't the end of our involvement.",
  },
];

export default function About() {
  const { colors, fonts, spacing, radius } = useTheme();
  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
      <Head>
        <title>How Sourcing Works · FarmsClub</title>
        <meta name="description" content="How Formulate India sources, prices, and delivers bulk orders through FarmsClub." />
      </Head>
      <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, maxWidth: 520 }}>
        How FarmsClub sourcing works
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 10, maxWidth: 540, lineHeight: 21 }}>
        FarmsClub is run by Formulate India, a dedicated bulk-trade entity separate from Paudhewale's
        retail storefront. It exists for one thing: buying plants, pots, tools, and soil &amp; fertiliser
        in volume, reliably, with paperwork that holds up.
      </Text>

      <View style={{ marginTop: spacing.xl }}>
        <SectionBanner
          eyebrow="One counterparty"
          title="Formulate India sells and invoices every order directly."
          body="Not the grower, not the manufacturer — so you get one GST invoice and one point of contact, however many sellers an order actually draws from."
          tone="accent"
          insetHorizontal={false}
        />
      </View>

      <View style={{ marginTop: spacing.xxl, gap: spacing.lg }}>
        {POINTS.map((p) => (
          <View
            key={p.title}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg }]}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{p.title}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginTop: 6, lineHeight: 19 }}>
              {p.body}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <Button label="Browse the catalogue" onPress={() => router.push("/listings")} />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
});
