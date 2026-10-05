import { View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { categoryAccent } from "@/constants/categoryTheme";
import { CategoryIcon } from "@/components/graphics/CategoryIcon";
import type { Category } from "@/lib/types";

/**
 * A full-bleed illustrated tile for one category — accent-tinted field, a loose scatter of
 * circles/crate corners for texture, and a large centered glyph. Used as the listing-card
 * image fallback (most bulk listings won't have a dedicated photo) and on the home category
 * grid, so "no product photo yet" never means "blank grey box".
 */
export function CategoryArt({ category, style }: { category: Category | null | undefined; style?: object }) {
  const { colors } = useTheme();
  const { fg, bg } = categoryAccent(category, colors);

  return (
    <View style={[{ backgroundColor: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 160" style={{ position: "absolute" }} preserveAspectRatio="xMidYMid slice">
        <Rect x={14} y={18} width={44} height={44} rx={8} stroke={fg} strokeWidth={1.4} opacity={0.22} fill="none" />
        <Rect x={146} y={92} width={40} height={40} rx={8} stroke={fg} strokeWidth={1.4} opacity={0.2} fill="none" />
        <Circle cx={172} cy={28} r={16} fill={fg} opacity={0.16} />
        <Circle cx={26} cy={132} r={20} fill={fg} opacity={0.14} />
        <Circle cx={100} cy={14} r={6} fill={fg} opacity={0.2} />
      </Svg>
      <CategoryIcon category={(category ?? "OTHER") as Category} size={40} color={fg} />
    </View>
  );
}
