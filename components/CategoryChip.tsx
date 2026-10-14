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
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.brand : colors.surface,
          borderColor: active ? colors.brand : colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium,
          color: active ? "#FFFFFF" : colors.ink,
          fontSize: 13.5,
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
