import { View, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const { colors, fonts, radius, spacing } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Search plants, pots, tools, fertiliser…"}
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, { fontFamily: fonts.body, color: colors.ink }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, height: 48, justifyContent: "center" },
  input: { fontSize: 15, outlineStyle: "none" as any },
});
