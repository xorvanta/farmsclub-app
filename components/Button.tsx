import { forwardRef } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View, type GestureResponderEvent } from "react-native";
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
  /** Screen-reader label when it should differ from the visible text. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/** forwardRef + rest props so it can sit inside <Link href asChild> (Link passes href/onPress). */
export const Button = forwardRef<View, Props>(function Button(
  { label, onPress, variant = "primary", disabled, loading, fullWidth, inverted, accessibilityLabel, accessibilityHint, ...rest },
  ref,
) {
  // Whatever <Link asChild> injects (href, role, onClick on web) — forwarded untouched so the
  // Pressable renders as a real <a href> on web.
  const linkProps: Record<string, unknown> = rest;
  const isLink = typeof linkProps.href === "string";
  const { colors, fonts, radius, spacing } = useTheme();

  // Primary uses `cta` (white text 4.95:1), never `accent` (3.5:1 — fails WCAG AA).
  const bg = inverted
    ? variant === "primary"
      ? colors.cta
      : "rgba(255,255,255,0.12)"
    : variant === "primary"
      ? colors.cta
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
  const isDisabled = !!(disabled || loading);

  return (
    <Pressable
      ref={ref}
      {...linkProps}
      onPress={onPress ?? (linkProps.onPress as Props["onPress"])}
      disabled={isDisabled}
      accessibilityRole={isLink ? "link" : "button"}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          minHeight: 44,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          ...(variant === "primary" && !disabled && !inverted
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.14,
                shadowRadius: 5,
                elevation: 2,
              }
            : {}),
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} accessibilityLabel="Sending" />
      ) : (
        <Text style={[styles.label, { color: textColor, fontFamily: fonts.bodySemiBold }]}>{label}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14.5,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
