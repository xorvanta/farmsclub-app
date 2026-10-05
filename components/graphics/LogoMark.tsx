import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

/**
 * FarmsClub mark — a hexagonal pallet (bulk/trade) with a two-tone leaf rising from it
 * (the actual goods). Built as 4 flat paths so it stays crisp from 20px (header) up to
 * splash-screen size, and reads correctly as a single glyph even at favicon scale.
 */
export function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  const { colors } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="markBrand" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={onDark ? "#FFFFFF" : colors.brand} stopOpacity={onDark ? 0.96 : 1} />
          <Stop offset="100%" stopColor={onDark ? "#D9E8DD" : colors.brandDark} stopOpacity={onDark ? 0.9 : 1} />
        </LinearGradient>
      </Defs>

      {/* Pallet hexagon */}
      <Path
        d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z"
        fill="url(#markBrand)"
      />

      {/* Leaf — amber half */}
      <Path
        d="M24 34c0-10.5 7-16.5 14.5-17.5-1 10-6.5 16-14.5 17.5Z"
        fill={colors.accent}
      />
      {/* Leaf — light half, stem */}
      <Path
        d="M24 34c0-10.5-7-16.5-14.5-17.5 1 10 6.5 16 14.5 17.5Z"
        fill={colors.accentSoft}
        opacity={0.92}
      />
      <Path d="M24 34V22" stroke={onDark ? colors.accentDark : colors.brandDark} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
