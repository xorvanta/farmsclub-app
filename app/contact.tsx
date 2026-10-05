import { View, Text } from "react-native";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";

export default function Contact() {
  const { fonts, colors, spacing } = useTheme();

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <Head>
        <title>Contact · FarmsClub</title>
        <meta name="description" content="Get in touch with Formulate India's trade desk for a bulk sourcing requirement." />
      </Head>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Talk to our trade desk</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 6, maxWidth: 480, lineHeight: 20 }}>
          Not sure which listing fits your requirement, or sourcing something that isn't live yet?
          Tell us what you need — this goes straight to the same team that handles every quote.
        </Text>
      </View>
      <RfqFormBody listing={null} listingId={null} />
    </AppShell>
  );
}
