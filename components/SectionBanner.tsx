import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { DotGrid } from "@/components/graphics/DotGrid";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  tone?: "brand" | "accent";
  /** Set false when the banner sits inside a container that already has side padding. */
  insetHorizontal?: boolean;
  children?: React.ReactNode;
};

/**
 * Reusable poster banner — a solid colour-block panel with a dot-grid texture and a loose
 * blob cluster bleeding off the edge, used to break up list/detail pages the same way the
 * home page's promo panel does, instead of every page just being a stack of cards.
 */
export function SectionBanner({ eyebrow, title, body, tone = "brand", insetHorizontal = true, children }: Props) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width - spacing.lg * 2, 1088);
  const bg = tone === "brand" ? colors.brand : colors.accent;
  const blob = tone === "brand" ? colors.accentDark : colors.brandDark;

  return (
    <View style={insetHorizontal ? { paddingHorizontal: spacing.lg } : undefined}>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: radius.lg,
          padding: spacing.xl,
          overflow: "hidden",
          minHeight: 150,
          justifyContent: "center",
        }}
      >
        <DotGrid width={panelWidth} height={260} color="#FFFFFF" opacity={0.1} />
        <Svg width={180} height={180} style={{ position: "absolute", right: -40, bottom: -50 }}>
          <Circle cx={90} cy={90} r={70} fill={blob} opacity={0.55} />
          <Circle cx={40} cy={40} r={30} fill="#FFFFFF" opacity={0.08} />
        </Svg>

        {eyebrow && (
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
            {eyebrow}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.display, fontSize: 23, lineHeight: 29, color: "#FFFFFF", maxWidth: 480 }}>
          {title}
        </Text>
        {body && (
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.82)", marginTop: 8, maxWidth: 440, lineHeight: 19 }}>
            {body}
          </Text>
        )}
        {children && <View style={{ marginTop: spacing.lg, alignSelf: "flex-start" }}>{children}</View>}
      </View>
    </View>
  );
}
