import { View, Text } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { TrustIcon, type TrustIconKey } from "@/components/graphics/TrustIcon";

const BADGES: { icon: TrustIconKey; title: string; body: string }[] = [
  { icon: "invoice", title: "Single GST invoice", body: "Formulate India invoices every order directly, however many sellers it draws from." },
  { icon: "verified", title: "Verified seller network", body: "Every bulk listing comes from the same vetted sellers as our retail marketplace." },
  { icon: "panIndia", title: "Pan-India sourcing", body: "Sourced and delivered nationwide — the trade desk confirms transit for your destination." },
  { icon: "flatPrice", title: "Flat bulk pricing", body: "One listed price per MOQ, no hidden markup or back-and-forth haggling." },
  { icon: "tradeDesk", title: "A real trade desk", body: "Every enquiry gets a human follow-up, not just an automated reply." },
];

/** `strip`: horizontal wrap of cards (Home, under the hero). `list`: compact vertical card,
 *  for the footer — same role as retail's "Why Shop With Us" card, B2B-appropriate content
 *  (no payment/COD/live-arrival badges — those don't apply to an RFQ-only, no-checkout site). */
export function TrustBadges({ variant = "strip" }: { variant?: "strip" | "list" }) {
  const { colors, fonts, spacing, radius } = useTheme();

  if (variant === "list") {
    return (
      <View style={{ gap: spacing.md }}>
        {BADGES.slice(0, 4).map((b) => (
          <View key={b.title} style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <TrustIcon icon={b.icon} size={14} color="#FFFFFF" />
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 17 }}>
              {b.title}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
      {BADGES.map((b) => (
        <View
          key={b.title}
          style={{
            flexGrow: 1,
            flexBasis: 200,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.lg,
            padding: spacing.md,
          }}
        >
          <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
            <TrustIcon icon={b.icon} size={17} color={colors.brand} />
          </View>
          <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: colors.ink, marginTop: 10 }}>{b.title}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 3, lineHeight: 16 }}>{b.body}</Text>
        </View>
      ))}
    </View>
  );
}
