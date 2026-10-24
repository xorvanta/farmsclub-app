import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label || "Loading"} accessibilityState={{ busy: true }}>
      <ActivityIndicator color={colors.brand} size="large" />
      {label ? <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, marginTop: 12 }}>{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={[styles.center, { paddingHorizontal: spacing.xl }]} accessibilityLiveRegion="polite" aria-live="polite">
      <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 6 }}>
        Couldn't load this
      </Text>
      <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center", marginBottom: spacing.lg }}>
        {message}
      </Text>
      {/* Wrapped: the Button aligns itself to the start, which would pull it off-centre here. */}
      {onRetry ? <View style={{ alignSelf: "center" }}><Button label="Try again" variant="outline" onPress={onRetry} /></View> : null}
    </View>
  );
}

/** `children` — optional actions (buttons/links) rendered under the text. */
export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 6, textAlign: "center" }}>{title}</Text>
      {body ? (
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center" }}>{body}</Text>
      ) : null}
      {children ? <View style={{ marginTop: spacing.lg, alignItems: "center", gap: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
});
