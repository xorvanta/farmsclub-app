import Svg, { Circle } from "react-native-svg";

/** A quiet dot-grid texture for a dark colour-block panel — adds depth without competing with the headline text sitting on top of it. */
export function DotGrid({ width, height, color = "#FFFFFF", opacity = 0.12 }: { width: number; height: number; color?: string; opacity?: number }) {
  const spacing = 22;
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(<Circle key={`${r}-${c}`} cx={c * spacing + 8} cy={r * spacing + 8} r={1.4} fill={color} opacity={opacity} />);
    }
  }
  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
      {dots}
    </Svg>
  );
}
