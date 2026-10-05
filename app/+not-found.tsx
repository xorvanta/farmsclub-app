import { View, Text } from "react-native";
import { router } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";

export default function NotFound() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <AppShell noScroll>
      <Head>
        <title>Page Not Found · FarmsClub</title>
      </Head>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Page not found</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft }}>
          That page doesn't exist, or the listing may no longer be live.
        </Text>
        <Button label="Back to home" onPress={() => router.replace("/")} />
      </View>
    </AppShell>
  );
}
