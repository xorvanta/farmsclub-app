import { View, Text } from "react-native";
import { useTheme } from "@/constants/theme-context";

export type LegalSection = { heading: string; body: string };

/**
 * Terms / Privacy layout. Drafting/review reminders belong in code comments on the page files,
 * never on the rendered page.
 */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" }}>
      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink }}>
        {title}
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 6 }}>Last updated {updated}</Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        {sections.map((s) => (
          <View key={s.heading}>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>
              {s.heading}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 6, lineHeight: 21 }}>{s.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
