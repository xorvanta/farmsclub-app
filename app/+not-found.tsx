import { View, Text } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

export default function NotFound() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Header />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Page not found</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft }}>
          That page doesn't exist, or the listing may no longer be live.
        </Text>
        <Button label="Back to home" onPress={() => router.replace("/")} />
      </View>
    </View>
  );
}
