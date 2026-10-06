import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

export type StepIconKey = "search" | "form" | "truck";

type Props = { icon: StepIconKey; size?: number; color: string };

/** One glyph per "How sourcing works" step — same primitives-only convention as CategoryIcon/
 *  TrustIcon, scoped to this specific 3-step flow rather than the general glyph library. */
export function StepIcon({ icon, size = 20, color }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (icon) {
    case "search":
      return (
        <Svg {...common}>
          <Circle cx={10.5} cy={10.5} r={6.5} />
          <Line x1={20} y1={20} x2={15.3} y2={15.3} />
        </Svg>
      );
    case "form":
      return (
        <Svg {...common}>
          <Rect x={5} y={3} width={14} height={18} rx={1.5} />
          <Path d="M9 9l1.8 1.8L14.5 7" />
          <Line x1={9} y1={15} x2={15} y2={15} />
        </Svg>
      );
    default: // truck
      return (
        <Svg {...common}>
          <Rect x={2.5} y={8} width={11} height={8} rx={1} />
          <Path d="M13.5 11h3.5l3.5 3.5V16h-7" />
          <Circle cx={7} cy={18.5} r={1.7} />
          <Circle cx={17} cy={18.5} r={1.7} />
        </Svg>
      );
  }
}
