import Svg, { Path } from "react-native-svg";

/** Assistant/"magic" glyph — matches the Sparkles icon retail uses for Root (both the "Ask
 *  Root" header trigger and the chat panel's own header), rebuilt from primitives since this
 *  app has no icon library. One large 4-point star plus a small companion star. */
export function SparkleIcon({ size = 20, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 2c.4 3.2 1.1 5.3 2.1 6.3S16.4 9.8 19.5 10.2c-3.1.5-5.1 1.3-6.2 2.4-1.1 1.1-1.9 3.2-2.3 6.4-.5-3.2-1.3-5.3-2.4-6.4-1.1-1.1-3.2-1.9-6.4-2.3 3.2-.4 5.3-1.2 6.4-2.2C9.6 7.1 10.4 5 11 2Z"
        fill={color}
      />
      <Path
        d="M18.5 15.5c.2 1.4.6 2.3 1.1 2.9.5.5 1.4.9 2.9 1.1-1.4.2-2.3.6-2.9 1.1-.5.5-.9 1.4-1.1 2.9-.2-1.4-.6-2.4-1.1-2.9-.5-.5-1.4-.9-2.9-1.1 1.4-.2 2.3-.6 2.9-1.1.5-.5.9-1.5 1.1-2.9Z"
        fill={color}
        opacity={0.85}
      />
    </Svg>
  );
}
