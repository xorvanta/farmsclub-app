import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

export type LegalSection = { heading: string; body: string };

export function LegalPage({ title, updated, sections, note }: { title: string; updated: string; sections: LegalSection[]; note?: string }) {
  const { colors, fonts, spacing, radius } = useTheme();
  return (
    <View style={{ padding: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink }}>{title}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkFaint, marginTop: 6 }}>
        Last updated {updated}
      </Text>

      {note ? (
        <View style={[styles.note, { backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.ink, lineHeight: 18 }}>{note}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        {sections.map((s) => (
          <View key={s.heading}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{s.heading}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 6, lineHeight: 21 }}>
              {s.body}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {},
});
