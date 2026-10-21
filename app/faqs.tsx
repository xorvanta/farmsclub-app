import { View } from "react-native";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SectionTitle } from "@/components/SectionTitle";

export default function Faqs() {
  const { spacing } = useTheme();
  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
      <SeoHead
        title="FAQs · FarmsClub"
        description="Answers about FarmsClub farms, listing your farm, Verified profiles, quantity pricing, quotes and delivery."
      />
      <View style={{ marginBottom: spacing.xl }}>
        <SectionTitle
          level={1}
          title="Frequently asked questions"
          subtitle="Farms on FarmsClub, listing your own farm, and buying planting material in bulk."
        />
      </View>
      <FaqAccordion />
    </AppShell>
  );
}
