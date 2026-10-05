import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

export function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, fonts, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
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
