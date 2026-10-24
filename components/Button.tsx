import { forwardRef } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View, Platform, type GestureResponderEvent } from "react-native";
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
  const primary = variant === "primary";
  const bg = primary
    ? colors.cta
    : inverted
      ? "rgba(255,255,255,0.14)"
      : variant === "secondary"
        ? colors.brandSoft
        : colors.surface;
  // Pressed/hovered fill: a deeper terracotta for primary, a brighter glass on photos, a soft tint otherwise.
  const bgActive = primary ? CTA_PRESSED : inverted ? "rgba(255,255,255,0.26)" : colors.brandSoft;
  const border = inverted && !primary ? "rgba(255,255,255,0.75)" : variant === "outline" ? colors.borderStrong : "transparent";
  const textColor = inverted || primary ? "#FFFFFF" : variant === "secondary" ? colors.brand : colors.ink;
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
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
        const active = !isDisabled && (pressed || hovered);
        return [
          styles.base,
          {
            backgroundColor: active ? bgActive : bg,
            borderColor: border,
            borderWidth: variant === "outline" || (inverted && !primary) ? 1.5 : 0,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            minHeight: 48,
            maxWidth: "100%",
            opacity: disabled ? 0.5 : 1,
            alignSelf: fullWidth ? "stretch" : "flex-start",
            transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }, { translateY: hovered && !pressed && !isDisabled ? -1 : 0 }],
            ...(Platform.OS === "web"
              ? ({
                  transitionProperty: "background-color, transform, box-shadow",
                  transitionDuration: "160ms",
                  ...(inverted && !primary ? { backdropFilter: "blur(6px)" } : {}),
                } as object)
              : {}),
            ...(primary && !disabled
              ? {
                  shadowColor: inverted ? "#000" : CTA_PRESSED,
                  shadowOffset: { width: 0, height: active ? 6 : 4 },
                  shadowOpacity: inverted ? 0.3 : 0.28,
                  shadowRadius: active ? 14 : 10,
                  elevation: active ? 5 : 3,
                }
              : {}),
          },
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} accessibilityLabel="Sending" />
      ) : (
        <Text style={[styles.label, { color: textColor, fontFamily: fonts.bodySemiBold }]}>{label}</Text>
      )}
    </Pressable>
  );
});

/** `cta` a step darker — the pressed/hovered primary fill and its glow. */
const CTA_PRESSED = "#A54C12";

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: "center",
    flexShrink: 1, // long labels wrap inside the button instead of running past its edge
  },
});
