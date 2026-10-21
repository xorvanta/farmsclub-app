import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

/** Labelled checkbox with a ≥44 px tap target. `children` replaces the plain label (e.g. a label with a link). */
export function Checkbox({
  checked,
  onChange,
  label,
  children,
  error,
  disabled,
  fontFamily,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  children?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  /** Override for Hindi text. */
  fontFamily?: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        onPress={() => !disabled && onChange(!checked)}
        style={styles.row}
        hitSlop={4}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        aria-checked={checked}
        accessibilityLabel={label}
        disabled={disabled}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: error ? colors.danger : checked ? colors.brand : colors.borderStrong,
              backgroundColor: checked ? colors.brand : colors.surface,
            },
          ]}
        >
          {checked ? <Text style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 16 }}>✓</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          {children ?? <Text style={{ fontFamily: fontFamily ?? fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>{label}</Text>}
        </View>
      </Pressable>
      {error ? (
        <Text aria-live="polite" accessibilityLiveRegion="polite" style={{ color: colors.danger, fontFamily: fontFamily ?? fonts.bodyMedium, fontSize: 12, marginLeft: 32 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  box: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 5, alignItems: "center", justifyContent: "center" },
});
