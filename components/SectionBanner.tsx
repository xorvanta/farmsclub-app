import { View, Text, Image, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { photoUrl } from "@/constants/categoryImages";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  tone?: "brand" | "accent";
  /** A real photo URL (Unsplash base, not yet sized) to use as the banner background. */
  photo?: string;
  /** Set false when the banner sits inside a container that already has side padding. */
  insetHorizontal?: boolean;
  children?: React.ReactNode;
};

/**
 * Reusable poster banner — a real photo with a brand-tinted gradient for legibility, used to
 * break up list/detail pages the same way the home page's promo panel does, instead of every
 * page just being a stack of cards. Per the user's direction this uses real photography, not
 * abstract shapes (see constants/categoryImages.ts for the sourcing note).
 */
export function SectionBanner({ eyebrow, title, body, tone = "brand", photo, insetHorizontal = true, children }: Props) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const panelWidth = Math.round(Math.min(width - (insetHorizontal ? spacing.lg * 2 : 0), 1088));
  const tintTop = tone === "brand" ? "rgba(19,50,34,0.72)" : "rgba(163,96,15,0.72)";
  const tintBottom = tone === "brand" ? "rgba(19,50,34,0.9)" : "rgba(163,96,15,0.9)";

  return (
    <View style={insetHorizontal ? { paddingHorizontal: spacing.lg } : undefined}>
      <View
        style={{
          borderRadius: compact ? radius.md : radius.lg,
          padding: compact ? spacing.lg : spacing.xxl,
          overflow: "hidden",
          minHeight: compact ? 160 : 220,
          justifyContent: "center",
          backgroundColor: tone === "brand" ? colors.brandDark : colors.accentDark,
        }}
      >
        {photo && (
          <Image
            source={{ uri: photoUrl(photo, { w: panelWidth * 2, h: compact ? 320 : 440, q: 68 }) }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
          />
        )}
        <LinearGradient colors={[tintTop, tintBottom]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

        {eyebrow && (
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: compact ? 10.5 : 12, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.78)", marginBottom: compact ? 5 : 8 }}>
            {eyebrow}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.display, fontSize: compact ? 20 : 27, lineHeight: compact ? 25 : 33, color: "#FFFFFF", maxWidth: 500 }}>
          {title}
        </Text>
        {body && (
          <Text style={{ fontFamily: fonts.body, fontSize: compact ? 12.5 : 13.5, color: "rgba(255,255,255,0.88)", marginTop: compact ? 6 : 8, maxWidth: 440, lineHeight: compact ? 17.5 : 19 }}>
            {body}
          </Text>
        )}
        {children && <View style={{ marginTop: compact ? spacing.md : spacing.lg, alignSelf: "flex-start" }}>{children}</View>}
      </View>
    </View>
  );
}
