import { View, Text } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { LogoMark } from "@/components/graphics/LogoMark";

export const TAGLINE = "India's trusted farm network";

/**
 * Header/footer wordmark — always "FarmsClub" in Latin script on every page (Storefront §1.8,
 * §9.9), with the optional tagline "India's trusted farm network" under it.
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
  const textColor = onDark ? "#FFFFFF" : colors.brand;
  const taglineColor = onDark ? "rgba(255,255,255,0.7)" : colors.inkSoft;

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: size * 0.4 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={showTagline ? `FarmsClub, ${TAGLINE}` : "FarmsClub"}
    >
      <LogoMark size={size * 1.5} onDark={onDark} />
      <View>
        <Text style={{ fontFamily: fonts.display, fontSize: size, color: textColor, letterSpacing: -0.3 }}>FarmsClub</Text>
        {showTagline && (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: Math.max(10, size * 0.5), color: taglineColor, marginTop: 1 }}>{TAGLINE}</Text>
        )}
      </View>
    </View>
  );
}
