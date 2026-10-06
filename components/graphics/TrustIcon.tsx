import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

export type TrustIconKey = "invoice" | "verified" | "panIndia" | "flatPrice" | "tradeDesk";

type Props = { icon: TrustIconKey; size?: number; color: string };

/** One glyph per trust point, built from primitives — matches the CategoryIcon convention
 *  (no imported icon library anywhere in this app). */
export function TrustIcon({ icon, size = 20, color }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (icon) {
    case "invoice":
      return (
        <Svg {...common}>
          <Path d="M6 3h9l4 4v14H6V3Z" />
          <Path d="M15 3v4h4" />
          <Line x1={9} y1={12} x2={15} y2={12} />
          <Line x1={9} y1={16} x2={13} y2={16} />
        </Svg>
      );
    case "verified":
      return (
        <Svg {...common}>
          <Path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
          <Path d="M9 12l2 2 4-4" />
        </Svg>
      );
    case "panIndia":
      return (
        <Svg {...common}>
          <Rect x={3} y={9} width={13} height={8} rx={1.5} />
          <Path d="M16 12h3l2 3v2h-5" />
          <Circle cx={7.5} cy={19} r={1.6} />
          <Circle cx={17} cy={19} r={1.6} />
        </Svg>
      );
    case "flatPrice":
      return (
        <Svg {...common}>
          <Path d="M12 3v3M12 18v3" />
          <Path d="M8 8h5a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h6" />
        </Svg>
      );
    default: // tradeDesk
      return (
        <Svg {...common}>
          <Path d="M4 12a8 8 0 0 1 16 0" />
          <Path d="M4 12v4a2 2 0 0 0 2 2h1v-6H5a1 1 0 0 0-1 1Z" />
          <Path d="M20 12v4a2 2 0 0 1-2 2h-1v-6h1a1 1 0 0 1 1 1Z" />
        </Svg>
      );
  }
}
