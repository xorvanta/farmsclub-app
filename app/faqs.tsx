import { View, Text } from "react-native";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Badge } from "@/components/Badge";

export default function Faqs() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
      <SeoHead title="FAQs · FarmsClub" description="Answers about bulk pricing, the RFQ process, delivery, and GST invoicing on FarmsClub." />
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        <Badge label="Trade Knowledgebase" tone="brand" />
        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 28, color: colors.ink }}>
          Frequently Asked Questions
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, maxWidth: 540, lineHeight: 21 }}>
          Everything you need to know about commercial volume tiers, minimum order quantities, pan-India logistics, and GST documentation.
        </Text>
      </View>
      <FaqAccordion />
    </AppShell>
  );
}
