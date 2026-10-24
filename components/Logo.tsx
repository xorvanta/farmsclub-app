import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Platform } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { LogoMark } from "@/components/graphics/LogoMark";

export const TAGLINE = "India's trusted farm network";

const WORDMARKS = [
  { text: "FarmsClub", lang: "en" as const },
  { text: "फार्म्सक्लब", lang: "hi" as const },
];

const ROTATE_MS = 5000;
const FADE_MS = 320;

function prefersReducedMotion(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Header/footer wordmark — crosses between "FarmsClub" and its Devanagari rendering every 5s (owner,
 * 24 Oct 2026: brings back the Hindi logo the v1.2 storefront had dropped), with the optional tagline
 * under it. Stays on the Latin name with reduced motion. The accessible name is always "FarmsClub".
 */
export function Logo({
  size = 20,
  showTagline = false,
  onDark = false,
}: {
  size?: number;
  showTagline?: boolean;
  onDark?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const textColor = onDark ? "#FFFFFF" : colors.brand;
  const taglineColor = onDark ? "rgba(255,255,255,0.7)" : colors.inkSoft;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const native = Platform.OS !== "web";
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: native }).start(() => {
        setIndex((i) => (i + 1) % WORDMARKS.length);
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, easing: Easing.in(Easing.quad), useNativeDriver: native }).start();
      });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [opacity]);

  const current = WORDMARKS[index];
  const hindi = current.lang === "hi";
  const lineHeight = Math.round(size * 1.35);

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: size * 0.4 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={showTagline ? `FarmsClub, ${TAGLINE}` : "FarmsClub"}
    >
      <LogoMark size={size * 1.5} onDark={onDark} />
      <View>
        {/* Fixed line height so the bar doesn't jump when the taller Devanagari line swaps in. */}
        <Animated.Text
          numberOfLines={1}
          style={{
            opacity,
            fontFamily: hindi ? fonts.devanagari : fonts.display,
            fontSize: hindi ? size * 0.98 : size,
            lineHeight,
            height: lineHeight,
            color: textColor,
            letterSpacing: hindi ? 0 : -0.3,
          }}
        >
          {current.text}
        </Animated.Text>
        {showTagline && (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: Math.max(10, size * 0.5), color: taglineColor, marginTop: 1 }}>{TAGLINE}</Text>
        )}
      </View>
    </View>
  );
}
