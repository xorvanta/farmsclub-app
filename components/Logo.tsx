import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { LogoMark } from "@/components/graphics/LogoMark";

const WORDMARKS = [
  { text: "FarmsClub", lang: "en" as const },
  { text: "फार्म्सक्लब", lang: "hi" as const },
];

const ROTATE_MS = 5000;
const FADE_MS = 320;

/**
 * Header/footer wordmark — crosses between the Roman and Devanagari rendering of the brand
 * name every 3s (per the user's direction). Width is pinned to the widest variant so the
 * nav bar doesn't reflow as it rotates.
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
  const taglineColor = onDark ? "rgba(255,255,255,0.65)" : colors.inkFaint;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % WORDMARKS.length);
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
      });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [opacity]);

  const current = WORDMARKS[index];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.4 }}>
      <LogoMark size={size * 1.5} onDark={onDark} />
      <View>
        <Animated.Text
          style={{
            opacity,
            fontFamily: current.lang === "hi" ? fonts.devanagari : fonts.display,
            fontSize: current.lang === "hi" ? size * 1.05 : size,
            color: textColor,
            letterSpacing: current.lang === "hi" ? 0 : -0.3,
          }}
        >
          {current.text}
        </Animated.Text>
        {showTagline && (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: size * 0.42, color: taglineColor, letterSpacing: 0.3, marginTop: 1 }}>
            BY FORMULATE INDIA
          </Text>
        )}
      </View>
    </View>
  );
}
