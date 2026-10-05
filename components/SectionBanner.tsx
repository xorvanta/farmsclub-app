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
          padding: spacing.xxl,
          overflow: "hidden",
          minHeight: 210,
          justifyContent: "center",
        }}
      >
        <DotGrid width={panelWidth} height={320} color="#FFFFFF" opacity={0.1} />
        <Svg width={260} height={260} style={{ position: "absolute", right: -60, bottom: -80 }}>
          <Circle cx={130} cy={130} r={105} fill={blob} opacity={0.5} />
          <Circle cx={70} cy={60} r={42} fill="#FFFFFF" opacity={0.1} />
          <Circle cx={200} cy={70} r={22} fill="#FFFFFF" opacity={0.14} />
        </Svg>
        <Svg width={120} height={120} style={{ position: "absolute", left: -30, top: -30 }}>
          <Circle cx={60} cy={60} r={50} fill={blob} opacity={0.3} />
        </Svg>

        {eyebrow && (
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.72)", marginBottom: 8 }}>
            {eyebrow}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.display, fontSize: 27, lineHeight: 33, color: "#FFFFFF", maxWidth: 500 }}>
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
