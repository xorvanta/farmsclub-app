import { forwardRef, useState } from "react";
import { Text, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from "react-native";
import { useTheme } from "@/constants/theme-context";

/** Label (+ required star, help line) shared by every farm-form control. */
export function FieldLabel({ id, label, required, help, labelFont, helpFont }: { id?: string; label: string; required?: boolean; help?: string; labelFont?: string; helpFont?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text nativeID={id} style={{ fontFamily: labelFont ?? fonts.bodySemiBold, fontSize: 14, color: colors.ink }}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      {help ? <Text style={{ fontFamily: helpFont ?? fonts.body, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 }}>{help}</Text> : null}
    </View>
  );
}

export function FieldError({ id, error, font }: { id?: string; error?: string; font?: string }) {
  const { colors, fonts } = useTheme();
  if (!error) return null;
  return (
    <Text nativeID={id} accessibilityLiveRegion="polite" aria-live="polite" style={{ color: colors.danger, fontFamily: font ?? fonts.bodyMedium, fontSize: 12.5 }}>
      {error}
    </Text>
  );
}

type Props = {
  id: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  required?: boolean;
  help?: string;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  /** Show "n / max" under the input. */
  counter?: boolean;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: TextInputProps["inputMode"];
  autoComplete?: TextInputProps["autoComplete"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  labelFont?: string;
  helpFont?: string;
  minHeight?: number;
};

/** Labelled text input for the bilingual farm forms (label/help can use the Devanagari font). */
export const Field = forwardRef<TextInput, Props>(function Field(
  { id, label, value, onChangeText, required, help, error, placeholder, multiline, maxLength, counter, keyboardType, inputMode, autoComplete, autoCapitalize, labelFont, helpFont, minHeight },
  ref,
) {
  const { colors, fonts, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <FieldLabel id={`${id}-label`} label={label} required={required} help={help} labelFont={labelFont} helpFont={helpFont} />
      <TextInput
        ref={ref}
        nativeID={id}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={`${label}${required ? ", required" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.ink,
          borderColor: error ? colors.danger : focused ? colors.brand : colors.border,
          borderWidth: focused || error ? 1.5 : 1,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md + 2,
          paddingVertical: multiline ? spacing.md : 0,
          minHeight: multiline ? minHeight ?? 110 : 48,
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: colors.surface,
          outlineWidth: 0,
        }}
      />
      {counter && maxLength ? (
        <Text style={{ alignSelf: "flex-end", fontFamily: fonts.body, fontSize: 12, color: value.length > maxLength ? colors.danger : colors.inkFaint }}>
          {value.length} / {maxLength}
        </Text>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </View>
  );
});
