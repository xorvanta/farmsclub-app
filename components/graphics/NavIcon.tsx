import Svg, { Path, Rect } from "react-native-svg";

export type NavIconKey = "home" | "grid";

type Props = { icon: NavIconKey; size?: number; color: string };

/** Home/catalogue glyphs for the mobile bottom nav — same primitives-only convention as the
 *  rest of this app's icon set. */
export function NavIcon({ icon, size = 20, color }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (icon === "home") {
    return (
      <Svg {...common}>
        <Path d="M4 11.5 12 4l8 7.5" />
        <Path d="M6 10v9h12v-9" />
        <Path d="M10 19v-5h4v5" />
      </Svg>
    );
  }
  return (
    <Svg {...common}>
      <Rect x={3.5} y={3.5} width={7.5} height={7.5} rx={1.3} />
      <Rect x={13} y={3.5} width={7.5} height={7.5} rx={1.3} />
      <Rect x={3.5} y={13} width={7.5} height={7.5} rx={1.3} />
      <Rect x={13} y={13} width={7.5} height={7.5} rx={1.3} />
    </Svg>
  );
}
