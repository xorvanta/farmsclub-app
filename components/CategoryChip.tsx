import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

export function CategoryChip({
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colors, fonts, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      aria-pressed={active}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.brand : colors.surface,
          borderColor: active ? colors.brand : colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 1,
          opacity: pressed ? 0.9 : 1,
          ...(active
            ? {
                shadowColor: colors.brand,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 2,
              }
            : {}),
        },
      ]}
    >
      <Text
        style={{
          fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium,
          color: active ? "#FFFFFF" : colors.ink,
          fontSize: 13.5,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1 },
});
