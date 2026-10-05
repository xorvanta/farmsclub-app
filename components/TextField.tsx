import { View, Text, TextInput, StyleSheet, type KeyboardTypeOptions } from "react-native";
import { useTheme } from "@/constants/theme-context";

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  required?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  error?: string;
};

export function TextField({ label, value, onChangeText, required, placeholder, keyboardType, multiline, error }: Props) {
  const { colors, fonts, radius, spacing } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          {
            fontFamily: fonts.body,
            color: colors.ink,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            minHeight: multiline ? 88 : 46,
            textAlignVertical: multiline ? "top" : "center",
            paddingVertical: multiline ? spacing.sm : 0,
            backgroundColor: colors.surface,
          },
        ]}
      />
      {error ? <Text style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { fontSize: 15, borderWidth: 1, outlineStyle: "none" as any },
});
