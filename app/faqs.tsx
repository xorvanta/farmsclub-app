import { View, Text } from "react-native";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { FaqAccordion } from "@/components/FaqAccordion";

export default function Faqs() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" }}>
      <Head>
        <title>FAQs · FarmsClub</title>
        <meta name="description" content="Answers about bulk pricing, the RFQ process, delivery, and GST invoicing on FarmsClub." />
      </Head>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>Frequently asked questions</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginTop: 6, marginBottom: spacing.xl, maxWidth: 480 }}>
        Everything about bulk pricing, the RFQ process, delivery, and invoicing. Can't find your answer? Ask
        Trellis in the chat, or get in touch.
      </Text>
      <FaqAccordion />
    </AppShell>
  );
}
