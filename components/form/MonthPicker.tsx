import { View } from "react-native";
import { MONTHS, type FormLang } from "@/lib/farmFormText";
import { FieldLabel } from "./Field";
import { ToggleChip } from "./MultiSelect";

/** Jan–Dec on/off toggles; values are month numbers 1–12. */
export function MonthPicker({ label, value, onChange, lang, labelFont }: { label: string; value: number[]; onChange: (v: number[]) => void; lang: FormLang; labelFont?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <FieldLabel label={label} labelFont={labelFont} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {MONTHS[lang].map((m, i) => {
          const n = i + 1;
          const on = value.includes(n);
          return (
            <ToggleChip
              key={n}
              label={m}
              selected={on}
              font={labelFont}
              onPress={() => onChange(on ? value.filter((x) => x !== n) : [...value, n].sort((a, b) => a - b))}
            />
          );
        })}
      </View>
    </View>
  );
}
