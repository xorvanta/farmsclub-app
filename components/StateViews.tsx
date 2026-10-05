import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, marginTop: 12 }}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 6 }}>
        Couldn't load this
      </Text>
      <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center", marginBottom: spacing.lg }}>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={[styles.center, { paddingHorizontal: spacing.xl }]}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 6 }}>{title}</Text>
      {body ? (
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, textAlign: "center" }}>{body}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
});
