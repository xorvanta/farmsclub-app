import Svg, { Path } from "react-native-svg";

/** Simple speech-bubble glyph for the chat FAB — built from primitives, no icon library. */
export function ChatBubbleIcon({ size = 24, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
        fill={color}
      />
      <Path d="M8 8h8M8 11.3h5" stroke="#133222" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
