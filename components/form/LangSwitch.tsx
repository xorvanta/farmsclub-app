import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { FORM_TEXT, type FormLang } from "@/lib/farmFormText";

const STORAGE_KEY = "fc-form-lang";

/** The farm-owner pages' language, remembered per browser (best effort — storage may be blocked). */
export function useFormLang(): [FormLang, (l: FormLang) => void] {
  const [lang, setLang] = useState<FormLang>("en");
  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "hi" || v === "en") setLang(v);
    } catch {
      // storage unavailable — stay on English
    }
  }, []);
  const set = (l: FormLang) => {
    setLang(l);
    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        // ignore
      }
    }
  };
  return [lang, set];
}

/** Font families for the chosen language: Noto Sans Devanagari for Hindi labels/headings. Hindi
 *  body text keeps Inter, whose missing Devanagari glyphs fall back to the system Devanagari font
 *  (only the 600/700 Noto weights are loaded). */
export function useLangFonts(lang: FormLang) {
  const { fonts } = useTheme();
  const hi = lang === "hi";
  return {
    body: fonts.body,
    medium: hi ? fonts.devanagariSemiBold : fonts.bodyMedium,
    semibold: hi ? fonts.devanagariSemiBold : fonts.bodySemiBold,
    heading: hi ? fonts.devanagari : fonts.heading,
    display: hi ? fonts.devanagari : fonts.display,
  };
}

/** English / हिंदी segmented switch. */
export function LangSwitch({ lang, onChange }: { lang: FormLang; onChange: (l: FormLang) => void }) {
  const { colors, fonts, radius } = useTheme();
  const t = FORM_TEXT[lang];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Text style={{ fontFamily: lang === "hi" ? fonts.devanagariSemiBold : fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft }}>{t.langLabel}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t.langLabel}
        style={{ flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, padding: 3, backgroundColor: colors.surface }}
      >
        {(["en", "hi"] as const).map((l) => {
          const active = lang === l;
          return (
            <Pressable
              key={l}
              onPress={() => onChange(l)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              aria-checked={active}
              accessibilityLabel={l === "en" ? "English" : "हिंदी (Hindi)"}
              style={{ minHeight: 44, minWidth: 84, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: active ? colors.brand : "transparent" }}
            >
              <Text style={{ fontFamily: l === "hi" ? fonts.devanagariSemiBold : fonts.bodySemiBold, fontSize: 14, color: active ? "#FFFFFF" : colors.ink }}>
                {l === "en" ? "English" : "हिंदी"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
