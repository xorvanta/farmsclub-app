import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { useTheme } from "@/constants/theme-context";

export function Header() {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingHorizontal: spacing.lg },
      ]}
    >
      <Pressable onPress={() => router.push("/")} hitSlop={8}>
        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.brand, letterSpacing: -0.3 }}>
          FarmsClub
        </Text>
      </Pressable>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkFaint, letterSpacing: 0.3 }}>
        B2B TRADE · BY FORMULATE INDIA
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
