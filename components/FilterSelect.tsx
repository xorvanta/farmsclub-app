import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";

export type FilterOption = { value: string; label: string };

/**
 * Compact labelled dropdown for directory filters. Web renders a native <select> (best on phones:
 * the OS picker, keyboard accessible, labelled). Native falls back to a button + modal list.
 * `value` "" = no filter ("All …").
 */
export function FilterSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const active = value !== "";
  const current = options.find((o) => o.value === value)?.label ?? allLabel;

  const boxStyle = {
    minHeight: 46,
    borderWidth: active ? 1.5 : 1,
    borderColor: active ? colors.brand : colors.border,
    borderRadius: radius.md,
    backgroundColor: active ? colors.brandSoft : colors.surface,
  };

  return (
    <View style={{ gap: 4, flexGrow: 1, flexBasis: 150, minWidth: 140 }}>
      <Text nativeID={`${id}-label`} style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.inkSoft }}>
        {label}
      </Text>
      {Platform.OS === "web" ? (
        <View style={boxStyle}>
          <select
            id={id}
            aria-labelledby={`${id}-label`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              appearance: "auto",
              width: "100%",
              minHeight: 44,
              border: 0,
              background: "transparent",
              padding: "0 10px",
              fontFamily: "Inter_500Medium, Inter, system-ui, sans-serif",
              fontSize: 14.5,
              color: colors.ink,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">{allLabel}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${current}`}
            style={[boxStyle, { justifyContent: "center", paddingHorizontal: 12 }]}
          >
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink }}>
              {current} ▾
            </Text>
          </Pressable>
          <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
              <View style={{ backgroundColor: colors.surface, maxHeight: "70%", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 8 }}>
                <ScrollView>
                  {[{ value: "", label: allLabel }, ...options].map((o) => (
                    <Pressable
                      key={o.value || "__all"}
                      onPress={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: o.value === value }}
                      style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 20 }}
                    >
                      <Text style={{ fontFamily: o.value === value ? fonts.bodySemiBold : fonts.body, fontSize: 15, color: o.value === value ? colors.brand : colors.ink }}>
                        {o.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}
