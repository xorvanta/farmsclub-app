import { View, Text, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { VerifiedTag } from "@/components/Tag";
import { useTheme } from "@/constants/theme-context";
import { useTour } from "@/lib/tour-context";

type Step = { badge: string; title: string; body: string; icon: "plant" | "quote" | "truck" | "camera" | "shield" | "users" };

const TRACKS: {
  eyebrow: string;
  title: string;
  steps: Step[];
  ctaLabel: string;
  ctaHref: "/listings" | "/list-your-farm";
}[] = [
  {
    eyebrow: "TRACK 01 · FOR COMMERCIAL BUYERS",
    title: "Buying planting material in bulk",
    steps: [
      { badge: "STEP 1", title: "Pick your crop & quantity slab", body: "Browse live bulk supply and see transparent price tiers by volume.", icon: "plant" },
      { badge: "STEP 2", title: "Send one consolidated quote request", body: "Share your required count, delivery city, or nearest railway station.", icon: "quote" },
      { badge: "STEP 3", title: "We confirm & arrange road or rail dispatch", body: "Our trade desk confirms live batch stock and dispatches from the nearest verified farm.", icon: "truck" },
    ],
    ctaLabel: "Browse Bulk Supply →",
    ctaHref: "/listings",
  },
  {
    eyebrow: "TRACK 02 · FOR FARM OWNERS & NURSERIES",
    title: "Listing your farm on FarmsClub",
    steps: [
      { badge: "STEP 1", title: "Fill the 2-minute registration form", body: "Share your farm's location, main crops, acreage, and up to 3 photos in English or Hindi.", icon: "camera" },
      { badge: "STEP 2", title: "Our team reviews & builds your dossier", body: "We prepare your public farm page and send you a private edit link.", icon: "shield" },
      { badge: "STEP 3", title: "Connect with bulk buyers & future farmers", body: "Receive verified enquiries for planting material, farm visits, and training.", icon: "users" },
    ],
    ctaLabel: "List Your Farm (Free) →",
    ctaHref: "/list-your-farm",
  },
];

const VERIFIED_PILLARS = [
  { badge: "ON-SITE VISIT", title: "Visited in person", sub: "Our field team visits the farm, meets the grower, and films on the ground." },
  { badge: "MOTHER STOCK", title: "Crops & practices checked", sub: "We document real mother-plant stock, soil type, irrigation, and harvest calendar." },
  { badge: "TRANSPARENT", title: "Clear badge distinction", sub: "Farms that haven't been visited yet are clearly marked 'Self-listed' until verified." },
];

/** Storefront §8.1 — How FarmsClub works: two tracks + Verified explanation. */
export default function About() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { openTour } = useTour();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const compact = width < 560;

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 1140, width: "100%", alignSelf: "center", gap: spacing.xxl }}>
      <SeoHead
        title="How it works · FarmsClub"
        description="How FarmsClub works: buy planting material in bulk with quantity pricing, or list your farm and get discovered by buyers and future farmers."
      />

      {/* Executive B2B Blueprint Hero */}
      <LinearGradient
        colors={["#071A10", "#123824", "#184A30"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.xl,
          padding: compact ? spacing.lg : spacing.xxl,
          borderWidth: 1,
          borderColor: "rgba(229,180,98,0.35)",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#52C388" }} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 1, color: "#E5B462", textTransform: "uppercase" }}>
              PLATFORM ARCHITECTURE & TRUST
            </Text>
          </View>
          <Pressable
            onPress={() => openTour(0)}
            accessibilityRole="button"
            style={{
              backgroundColor: "rgba(229,180,98,0.18)",
              borderWidth: 1,
              borderColor: "#E5B462",
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#E5B462" }}>✦ Launch 30s Interactive Tour →</Text>
          </Pressable>
        </View>

        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: compact ? 26 : 36, lineHeight: compact ? 32 : 42, color: "#FFFFFF" }}>
          How FarmsClub works
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15.5, color: "rgba(255,255,255,0.86)", maxWidth: 620, lineHeight: 23 }}>
          Two connected ecosystems: a verified grower network filmed on the ground, and a wholesale B2B procurement desk for bulk planting stock.
        </Text>
      </LinearGradient>

      {/* Dual-Track Visual Cards */}
      <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg }}>
        {TRACKS.map((track) => (
          <View
            key={track.title}
            style={[
              styles.card,
              {
                flex: wide ? 1 : undefined,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.xl,
                padding: compact ? spacing.lg : spacing.xl,
                justifyContent: "space-between",
                gap: spacing.lg,
              },
            ]}
          >
            <View style={{ gap: spacing.md }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.9, color: colors.accentDark }}>
                {track.eyebrow}
              </Text>
              <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: compact ? 22 : 24, color: colors.ink }}>
                {track.title}
              </Text>

              <View style={{ gap: spacing.md, marginTop: 4 }}>
                {track.steps.map((s) => (
                  <View
                    key={s.title}
                    style={{
                      flexDirection: "row",
                      gap: spacing.md,
                      backgroundColor: colors.paper,
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                    }}
                  >
                    <View style={[styles.num, { backgroundColor: colors.brandSoft }]}>
                      <StepGlyph kind={s.icon} color={colors.brand} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, color: colors.accentDark }}>{s.badge}</Text>
                      <Text style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink }}>{s.title}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 }}>{s.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Link href={track.ctaHref} asChild>
              <Button label={track.ctaLabel} fullWidth />
            </Link>
          </View>
        ))}
      </View>

      {/* What "Verified" Means Visual Bento */}
      <View
        style={{
          backgroundColor: colors.brandSoft,
          borderRadius: radius.xl,
          padding: compact ? spacing.lg : spacing.xl,
          borderWidth: 1,
          borderColor: "rgba(18,56,36,0.16)",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
              What "Verified" means
            </Text>
            <VerifiedTag verified />
          </View>
          <Link href="/contact?topic=Farm%20verification" style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.brand }}>
            Request Farm Verification →
          </Link>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, lineHeight: 21 }}>
          The FarmsClub team has visited this farm. Self-listed farms have not been visited yet.
        </Text>

        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.md, marginTop: 4 }}>
          {VERIFIED_PILLARS.map((p) => (
            <View
              key={p.title}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 4,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.7, color: colors.brand }}>{p.badge}</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink }}>{p.title}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 19 }}>{p.sub}</Text>
            </View>
          ))}
        </View>
      </View>
    </AppShell>
  );
}

function StepGlyph({ kind, color }: { kind: Step["icon"]; color: string }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "plant":
      return (
        <Svg {...p}>
          <Path d="M12 20v-8" />
          <Path d="M12 13c0-3.5 2.5-6 6.5-6.5-.5 4-3 6.5-6.5 6.5Z" />
          <Path d="M12 15c0-3-2-5-5.5-5.5.5 3.3 2.5 5.5 5.5 5.5Z" />
        </Svg>
      );
    case "quote":
      return (
        <Svg {...p}>
          <Rect x={4} y={3} width={16} height={18} rx={2} />
          <Path d="M8 8h8M8 12h8M8 16h5" />
        </Svg>
      );
    case "truck":
      return (
        <Svg {...p}>
          <Rect x={2} y={7} width={13} height={9} rx={1} />
          <Path d="M15 10h4l3 3v3h-7" />
          <Circle cx={6.5} cy={18} r={2} />
          <Circle cx={18.5} cy={18} r={2} />
        </Svg>
      );
    case "camera":
      return (
        <Svg {...p}>
          <Rect x={3} y={6.5} width={13} height={11} rx={2} />
          <Path d="m16 10.5 5-3v9l-5-3" />
        </Svg>
      );
    default:
      return (
        <Svg {...p}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="m9 12 2 2 4-4" />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flex: 1,
    shadowColor: "#081E12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  num: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
