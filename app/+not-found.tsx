import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";

export default function NotFound() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <AppShell noScroll>
      <SeoHead title="Page not found · FarmsClub" noindex />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Page not found</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center" }}>
          That page doesn't exist, or the listing may no longer be live.
        </Text>
        <Link href="/" replace asChild>
          <Button label="Back to home" />
        </Link>
      </View>
    </AppShell>
  );
}
