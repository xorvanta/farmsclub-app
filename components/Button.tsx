import { Pressable, Text, StyleSheet, ActivityIndicator, type GestureResponderEvent } from "react-native";
import { useTheme } from "@/constants/theme-context";

type Variant = "primary" | "secondary" | "outline";

type Props = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Use on a dark/photo background — swaps outline/secondary colors for white-on-translucent. */
  inverted?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled, loading, fullWidth, inverted }: Props) {
  const { colors, fonts, radius, spacing } = useTheme();

  const bg = inverted
    ? variant === "primary"
      ? colors.accent
      : "rgba(255,255,255,0.12)"
    : variant === "primary"
      ? colors.accent
      : variant === "secondary"
        ? colors.brandSoft
        : "transparent";
  const border = inverted ? "rgba(255,255,255,0.5)" : variant === "outline" ? colors.borderStrong : "transparent";
  const textColor = inverted
    ? "#FFFFFF"
    : variant === "primary"
      ? "#FFFFFF"
      : variant === "secondary"
        ? colors.brand
        : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontFamily: fonts.bodySemiBold }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
  },
});
