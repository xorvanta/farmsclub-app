import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";

/** A collapsible form section (mobile friendly: full-width ≥48 px header). */
export function Collapsible({ title, defaultOpen = false, children, font, flag }: { title: string; defaultOpen?: boolean; children: React.ReactNode; font?: string; flag?: boolean }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ borderWidth: 1, borderColor: flag ? colors.danger : colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: "hidden" }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        style={({ pressed }) => ({ minHeight: 56, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: pressed ? colors.paper : colors.surface })}
      >
        <Text accessibilityRole="header" style={{ flex: 1, fontFamily: font ?? fonts.heading, fontSize: 16.5, color: colors.ink }}>
          {title}
        </Text>
        <Text aria-hidden style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.brand }}>
          {open ? "−" : "+"}
        </Text>
      </Pressable>
      {open ? <View style={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>{children}</View> : null}
    </View>
  );
}
