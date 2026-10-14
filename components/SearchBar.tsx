import { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
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
          paddingLeft: spacing.md,
          paddingRight: spacing.sm,
          shadowColor: "#111C15",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: focused ? 0.08 : 0.03,
          shadowRadius: focused ? 6 : 3,
          elevation: focused ? 2 : 1,
        },
      ]}
    >
      <View style={styles.iconBox}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={focused ? colors.brand : colors.inkFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={11} cy={11} r={8} />
          <Path d="m21 21-4.3-4.3" />
        </Svg>
      </View>

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

      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          style={styles.clearBtn}
        >
          <View style={[styles.clearCircle, { backgroundColor: colors.border }]}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.inkSoft} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 6 6 18M6 6l12 12" />
            </Svg>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    paddingRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14.5,
    outlineWidth: 0,
  },
  clearBtn: {
    padding: 6,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
