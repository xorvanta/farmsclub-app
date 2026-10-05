import Svg, { Circle, Rect, Line, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

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
  );
}
