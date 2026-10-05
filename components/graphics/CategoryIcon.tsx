import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import type { Category } from "@/lib/types";

type Props = { category: Category; size?: number; color: string };

/** One simple line-art glyph per B2B category — kept to primitives + short paths, no imported icon library. */
export function CategoryIcon({ category, size = 26, color }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (category) {
    case "PLANT":
      return (
        <Svg {...common}>
          <Path d="M12 21V10" />
          <Path d="M12 10C12 10 6 10 6 5C11 5 12 10 12 10Z" />
          <Path d="M12 13C12 13 18 13 18 8C13 8 12 13 12 13Z" />
        </Svg>
      );
    case "POT":
      return (
        <Svg {...common}>
          <Path d="M6 8h12l-1.5 11a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L6 8Z" />
          <Path d="M4.5 8h15" />
          <Path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </Svg>
      );
    case "TOOL":
      return (
        <Svg {...common}>
          <Path d="M14.5 6.5a4 4 0 0 1-5.4 5.4L4 17l3 3 5.1-5.1a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.5 3.5Z" />
        </Svg>
      );
    case "SOIL_FERTILISER":
      return (
        <Svg {...common}>
          <Path d="M5 7h14l-1.5 13a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5 7Z" />
          <Path d="M8 7 9.5 3h5L16 7" />
          <Line x1={9} y1={12} x2={15} y2={12} />
          <Line x1={9} y1={16} x2={15} y2={16} />
        </Svg>
      );
    default:
      return (
        <Svg {...common}>
          <Rect x={4} y={8} width={16} height={12} rx={1.5} />
          <Path d="M4 8 12 3l8 5" />
          <Line x1={12} y1={12} x2={12} y2={20} />
        </Svg>
      );
  }
}
