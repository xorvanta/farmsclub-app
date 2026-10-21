import { Text, View, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { useTheme } from "@/constants/theme-context";

/** Section heading with an optional sub-line and a "See all →" style link on the right. */
export function SectionTitle({
  title,
  subtitle,
  linkLabel,
  href,
  level = 2,
}: {
  title: string;
  subtitle?: string | null;
  linkLabel?: string;
  href?: Href;
  level?: 1 | 2 | 3;
}) {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md, flexWrap: "wrap" }}>
      <View style={{ flexShrink: 1, gap: 4 }}>
        <Text accessibilityRole="header" aria-level={level} style={{ fontFamily: fonts.display, fontSize: level === 1 ? (wide ? 32 : 26) : wide ? 24 : 20, color: colors.ink, lineHeight: level === 1 ? (wide ? 38 : 32) : wide ? 30 : 26 }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, lineHeight: 21 }}>{subtitle}</Text> : null}
      </View>
      {linkLabel && href ? (
        <Link href={href} style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brand, paddingVertical: 10 }}>
          {linkLabel} →
        </Link>
      ) : null}
    </View>
  );
}
