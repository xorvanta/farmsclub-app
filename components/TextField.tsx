import { forwardRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, type KeyboardTypeOptions, type TextInputProps } from "react-native";
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
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Autofill hints — `autoComplete` works on Android and web, `textContentType` on iOS. */
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  inputMode?: TextInputProps["inputMode"];
  /** Used to build stable ids so the label and error are tied to the input for screen readers. */
  id: string;
};

/** Labelled input. The visible label, "required" and any error are all exposed on the input
 *  itself (aria-label / aria-invalid / aria-describedby on web, accessibilityLabel/Hint natively),
 *  and the error text is a polite live region so it's announced when it appears. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, value, onChangeText, required, placeholder, keyboardType, multiline, error, maxLength, autoCapitalize, autoComplete, textContentType, inputMode, id },
  ref,
) {
  const { colors, fonts, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;

  return (
    <View style={{ gap: 6 }}>
      <Text nativeID={labelId} style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        nativeID={id}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboardType}
        inputMode={inputMode}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={`${label}${required ? ", required" : ""}`}
        accessibilityHint={error}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        style={[
          styles.input,
          {
            fontFamily: fonts.body,
            color: colors.ink,
            // Focus is shown by the border (brand), errors by danger — the browser outline is
            // turned off below only because this replaces it.
            borderColor: error ? colors.danger : focused ? colors.brand : colors.border,
            borderWidth: focused || error ? 1.5 : 1,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            minHeight: multiline ? 88 : 46,
            textAlignVertical: multiline ? "top" : "center",
            paddingVertical: multiline ? spacing.sm : 0,
            backgroundColor: colors.surface,
          },
        ]}
      />
      {error ? (
        <Text
          nativeID={errorId}
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 12 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  input: { fontSize: 15, outlineWidth: 0 },
});
