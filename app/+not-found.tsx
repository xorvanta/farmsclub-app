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
        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Page not found</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center" }}>
          That page doesn't exist. Try the farms directory or bulk supply.
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" replace asChild>
            <Button label="Back to home" />
          </Link>
          <Link href="/farms" asChild>
            <Button label="Explore farms" variant="outline" />
          </Link>
        </View>
      </View>
    </AppShell>
  );
}
