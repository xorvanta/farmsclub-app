import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { SectionTitle } from "@/components/SectionTitle";
import { VerifiedTag } from "@/components/Tag";

type Step = { title: string; body: string };

/** Storefront §9.5 — two tracks, nothing about back-end mechanics. */
const TRACKS: { title: string; steps: Step[] }[] = [
  {
    title: "Buying in bulk",
    steps: [
      { title: "Choose your plants", body: "Browse by crop and see prices for each quantity band." },
      { title: "Request a quote", body: "Tell us the quantity, delivery city and nearest railway station." },
      { title: "We confirm price and dispatch", body: "One point of contact, with delivery by road or rail." },
    ],
  },
  {
    title: "Own a farm",
    steps: [
      { title: "List your farm", body: "A 2-minute form with the basics about your farm." },
      { title: "Our team reviews it", body: "We call you. For a Verified profile, our team visits and shoots your farm — contact our support team for details." },
      { title: "Get discovered", body: "Buyers and future farmers find your farm on FarmsClub." },
    ],
  },
];

export default function About() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 1040, width: "100%", alignSelf: "center" }}>
      <SeoHead
        title="How it works · FarmsClub"
        description="How FarmsClub works: buy planting material in bulk with quantity pricing, or list your farm and get discovered by buyers and future farmers."
      />
      <SectionTitle level={1} title="How FarmsClub works" subtitle="Two ways to use India's trusted farm network." />

      <View style={{ marginTop: spacing.xl, flexDirection: wide ? "row" : "column", gap: spacing.lg }}>
        {TRACKS.map((track) => (
          <View
            key={track.title}
            style={[styles.card, { flex: wide ? 1 : undefined, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl }]}
          >
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 21, color: colors.ink }}>
              {track.title}
            </Text>
            <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
              {track.steps.map((s, i) => (
                <View key={s.title} style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={[styles.num, { backgroundColor: colors.brandSoft }]}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.brand }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{s.title}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 4, lineHeight: 20 }}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing.xl, backgroundColor: colors.brandSoft, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
          <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.ink }}>
            What "Verified" means
          </Text>
          <VerifiedTag verified />
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, lineHeight: 21 }}>
          The FarmsClub team has visited this farm. Self-listed farms have not been visited yet.
        </Text>
      </View>

      <View style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
        <Link href="/farms" asChild>
          <Button label="Explore farms" />
        </Link>
        <Link href="/listings" asChild>
          <Button label="Get bulk planting material" variant="outline" />
        </Link>
        <Link href="/list-your-farm" asChild>
          <Button label="List your farm" variant="secondary" />
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
  num: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
