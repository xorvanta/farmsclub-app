import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { FaqAccordion } from "@/components/FaqAccordion";
import { useChat } from "@/lib/chat-context";
import { useTour } from "@/lib/tour-context";

export default function Faqs() {
  const { spacing, radius, fonts } = useTheme();
  const { openChat } = useChat();
  const { openTour } = useTour();

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 840, width: "100%", alignSelf: "center" }}>
      <SeoHead
        title="FAQs · FarmsClub"
        description="Answers about FarmsClub farms, listing your farm, Verified profiles, quantity pricing, quotes and delivery."
      />
      <LinearGradient
        colors={["#071A10", "#123824", "#184A30"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginBottom: spacing.xl,
          borderRadius: radius.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: "rgba(229,180,98,0.35)",
          gap: spacing.sm,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, color: "#E5B462", textTransform: "uppercase" }}>
          MANDI & FARM NETWORK KNOWLEDGE BASE
        </Text>
        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: "#FFFFFF" }}>
          Frequently asked questions
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: "rgba(255,255,255,0.85)", lineHeight: 21 }}>
          Farms on FarmsClub, listing your own farm, and buying planting material in bulk.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          <Pressable
            onPress={() => openChat()}
            accessibilityRole="button"
            style={{
              backgroundColor: "#E5B462",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: "#081E12" }}>✦ Ask Trellis AI Directly →</Text>
          </Pressable>
          <Pressable
            onPress={() => openTour(0)}
            accessibilityRole="button"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.28)",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: "#FFFFFF" }}>Take 30s Platform Tour</Text>
          </Pressable>
        </View>
      </LinearGradient>
      <FaqAccordion />
    </AppShell>
  );
}
