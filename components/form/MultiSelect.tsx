import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { FieldError, FieldLabel } from "./Field";
import type { Option } from "./Select";

const COLLAPSED_COUNT = 24;

/** A tappable on/off chip (≥44 px tall). */
export function ToggleChip({ label, selected, onPress, font }: { label: string; selected: boolean; onPress: () => void; font?: string }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.brand : colors.border,
        backgroundColor: selected ? colors.brand : colors.surface,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {selected ? <Text style={{ color: "#FFFFFF", fontSize: 13 }} aria-hidden>✓</Text> : null}
      <Text style={{ fontFamily: font ?? fonts.bodyMedium, fontSize: 14, color: selected ? "#FFFFFF" : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Multi-choice chips. With `searchable`, a search box filters the options; selected values are
 * always listed first, and a long list is collapsed until searched or expanded.
 */
export function MultiSelect({
  id,
  label,
  options,
  selected,
  onChange,
  required,
  help,
  error,
  searchable,
  searchPlaceholder,
  noMatches,
  showAllLabel,
  showLessLabel,
  labelFont,
  helpFont,
  chipFont,
}: {
  id: string;
  label: string;
  options: Option[];
  selected: number[];
  onChange: (next: number[]) => void;
  required?: boolean;
  help?: string;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noMatches?: string;
  showAllLabel?: (n: number) => string;
  showLessLabel?: string;
  labelFont?: string;
  helpFont?: string;
  chipFont?: string;
}) {
  const { colors, fonts, radius } = useTheme();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const toggle = (v: number) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const { chosen, rest } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chosen = options.filter((o) => selected.includes(o.value));
    const rest = options.filter((o) => !selected.includes(o.value) && (!q || o.label.toLowerCase().includes(q)));
    return { chosen, rest };
  }, [options, selected, query]);

  const collapsible = searchable && !query.trim() && rest.length > COLLAPSED_COUNT;
  const shown = collapsible && !expanded ? rest.slice(0, COLLAPSED_COUNT) : rest;

  return (
    <View style={{ gap: 8 }} accessibilityRole="none" aria-labelledby={`${id}-label`}>
      <FieldLabel id={`${id}-label`} label={label} required={required} help={help} labelFont={labelFont} helpFont={helpFont} />
      {searchable ? (
        <TextInput
          nativeID={`${id}-search`}
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={searchPlaceholder ?? label}
          inputMode="search"
          autoCorrect={false}
          style={{ minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, backgroundColor: colors.surface, outlineWidth: 0 }}
        />
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {chosen.map((o) => (
          <ToggleChip key={o.value} label={o.label} selected onPress={() => toggle(o.value)} font={chipFont} />
        ))}
        {shown.map((o) => (
          <ToggleChip key={o.value} label={o.label} selected={false} onPress={() => toggle(o.value)} font={chipFont} />
        ))}
      </View>
      {searchable && query.trim() && rest.length === 0 && noMatches ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>{noMatches}</Text>
      ) : null}
      {collapsible ? (
        <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
          <Text style={{ fontFamily: chipFont ?? fonts.bodySemiBold, fontSize: 14, color: colors.brand }}>
            {expanded ? showLessLabel ?? "Show fewer" : showAllLabel ? showAllLabel(rest.length) : `Show all (${rest.length})`}
          </Text>
        </Pressable>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </View>
  );
}
