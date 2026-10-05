import { View } from "react-native";
import Svg, { Circle, Rect, Line, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { CategoryIcon } from "@/components/graphics/CategoryIcon";
import { categoryAccent } from "@/constants/categoryTheme";
import type { Category } from "@/lib/types";

const BADGES: { category: Category; top: `${number}%`; left: `${number}%` }[] = [
  { category: "PLANT", top: "6%", left: "4%" },
  { category: "POT", top: "62%", left: "72%" },
  { category: "TOOL", top: "72%", left: "6%" },
];

/**
 * Abstract "volume + trade" motif — overlapping circles (produce/bulk stock) over a loose crate
 * grid (wholesale/logistics), built from primitives rather than hand-authored path data. Reads
 * as distinctive and premium without depending on any real product photography existing yet —
 * the empty "no listings live" state shouldn't be the only thing carrying the page's weight.
 */
export function HeroGraphic({ size = 340 }: { size?: number }) {
  const { colors, scheme } = useTheme();
  const isDark = scheme === "dark";

  return (
    <View style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Defs>
        <LinearGradient id="heroFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.brand} stopOpacity={isDark ? 0.9 : 1} />
          <Stop offset="100%" stopColor={colors.brandDark} stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id="heroAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={1} />
          <Stop offset="100%" stopColor={colors.accentDark} stopOpacity={1} />
        </LinearGradient>
      </Defs>

      {/* Crate grid — faint, behind everything */}
      <G opacity={isDark ? 0.25 : 0.18} stroke={colors.brand} strokeWidth={1.5}>
        {[60, 140, 220, 300].map((x) => (
          <Line key={`v${x}`} x1={x} y1={40} x2={x} y2={360} />
        ))}
        {[80, 160, 240, 320].map((y) => (
          <Line key={`h${y}`} x1={30} y1={y} x2={370} y2={y} />
        ))}
      </G>
      <Rect x={60} y={80} width={160} height={160} rx={10} stroke={colors.brand} strokeWidth={2} fill="none" opacity={0.3} />
      <Rect x={180} y={180} width={140} height={120} rx={10} stroke={colors.accent} strokeWidth={2} fill="none" opacity={0.35} />

      {/* Produce cluster — the actual "volume" statement */}
      <Circle cx={170} cy={190} r={95} fill="url(#heroFill)" />
      <Circle cx={270} cy={230} r={62} fill="url(#heroAccent)" />
      <Circle cx={235} cy={120} r={40} fill={colors.brand} opacity={0.85} />
      <Circle cx={120} cy={290} r={34} fill={colors.accent} opacity={0.9} />
      <Circle cx={300} cy={140} r={20} fill={colors.brandDark} opacity={0.7} />
    </Svg>

      {/* Floating category chips — reads as "many kinds of goods", no photography needed */}
      {BADGES.map((b) => {
        const { fg, bg } = categoryAccent(b.category, colors);
        return (
          <View
            key={b.category}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: size * 0.17,
              height: size * 0.17,
              borderRadius: 999,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}
          >
            <View style={{ width: "62%", height: "62%", borderRadius: 999, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon category={b.category} size={size * 0.07} color={fg} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
