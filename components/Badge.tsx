import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

type Tone = "brand" | "accent" | "success" | "neutral";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const toneMap = {
    brand: { bg: colors.brandSoft, fg: colors.brand },
    accent: { bg: colors.accentSoft, fg: colors.accentDark },
    success: { bg: colors.successSoft, fg: colors.success },
    neutral: { bg: colors.border, fg: colors.inkSoft },
  } as const;
  const { bg, fg } = toneMap[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
      ]}
    >
      <Text style={[styles.text, { color: fg, fontFamily: fonts.bodySemiBold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
  text: { fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" },
});
