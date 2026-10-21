import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { FieldError, FieldLabel } from "./Field";

export type Option = { value: number; label: string };

/**
 * Single-choice dropdown. Web renders a real <select> with a <label for> (native picker on
 * phones, keyboard accessible); native uses a Pressable + modal list.
 */
export function Select({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  help,
  error,
  disabled,
  labelFont,
  helpFont,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  help?: string;
  error?: string;
  disabled?: boolean;
  labelFont?: string;
  helpFont?: string;
}) {
  const { colors, fonts, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? null;
  const border = error ? colors.danger : colors.border;

  if (Platform.OS === "web") {
    return (
      <View style={{ gap: 6 }}>
        <label htmlFor={id} style={{ display: "block" }}>
          <FieldLabel label={label} required={required} help={help} labelFont={labelFont} helpFont={helpFont} />
        </label>
        <select
          id={id}
          value={value == null ? "" : String(value)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          style={{
            minHeight: 48,
            width: "100%",
            borderRadius: radius.md,
            border: `${error ? 1.5 : 1}px solid ${border}`,
            padding: "0 12px",
            fontFamily: fonts.body,
            fontSize: 15,
            color: value == null ? colors.inkFaint : colors.ink,
            backgroundColor: disabled ? colors.paper : colors.surface,
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={String(o.value)} style={{ color: colors.ink }}>
              {o.label}
            </option>
          ))}
        </select>
        <FieldError id={`${id}-error`} error={error} />
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <FieldLabel label={label} required={required} help={help} labelFont={labelFont} helpFont={helpFont} />
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        style={{ minHeight: 48, borderWidth: error ? 1.5 : 1, borderColor: border, borderRadius: radius.md, paddingHorizontal: 14, justifyContent: "center", backgroundColor: colors.surface, opacity: disabled ? 0.6 : 1 }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: current ? colors.ink : colors.inkFaint }}>{current?.label ?? placeholder}</Text>
      </Pressable>
      <FieldError error={error} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, maxHeight: "80%", overflow: "hidden" }}>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: o.value === value ? colors.brandSoft : undefined }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
