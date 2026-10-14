import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.brand : colors.border,
          borderWidth: focused ? 1.5 : 1,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Search plants, seeds, pots, tools, fertiliser…"}
        accessibilityLabel="Search the catalogue"
        inputMode="search"
        returnKeyType="search"
        autoCorrect={false}
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, { fontFamily: fonts.body, color: colors.ink }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, height: 48, justifyContent: "center" },
  // The surrounding box's border is the visible field; the browser's inner focus ring is turned off.
  input: { fontSize: 15, outlineWidth: 0 },
});
