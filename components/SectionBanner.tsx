import { View, Text, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { Photo } from "./Photo";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  tone?: "brand" | "accent";
  /** Optional photo behind a brand-tinted gradient (a farm photo, or a home-page mood photo — see constants/homePhotos). */
  photo?: string | null;
  /** Set false when the banner sits inside a container that already has side padding. */
  insetHorizontal?: boolean;
  children?: React.ReactNode;
};

/** Brand panel used for page intros and the "List your farm" banner. */
export function SectionBanner({ eyebrow, title, body, tone = "brand", photo, insetHorizontal = true, children }: Props) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const tintTop = tone === "brand" ? "rgba(19,50,34,0.72)" : "rgba(163,96,15,0.72)";
  const tintBottom = tone === "brand" ? "rgba(19,50,34,0.92)" : "rgba(163,96,15,0.92)";

  return (
    <View style={insetHorizontal ? { paddingHorizontal: spacing.lg } : undefined}>
      <View
        style={{
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          borderRadius: compact ? radius.md : radius.lg,
          padding: compact ? spacing.lg : spacing.xxl,
          overflow: "hidden",
          minHeight: compact ? 150 : 200,
          justifyContent: "center",
          backgroundColor: tone === "brand" ? colors.brand : colors.accentDark,
        }}
      >
        {photo ? <Photo uri={photo} alt="" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
        <LinearGradient
          colors={photo ? [tintTop, tintBottom] : tone === "brand" ? [colors.brand, colors.brandDark] : [colors.accent, colors.accentDark]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {eyebrow && (
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: compact ? 11 : 12, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.8)", marginBottom: compact ? 5 : 8 }}>
            {eyebrow}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.display, fontSize: compact ? 21 : 28, lineHeight: compact ? 27 : 34, color: "#FFFFFF", maxWidth: 560 }}>{title}</Text>
        {body && (
          <Text style={{ fontFamily: fonts.body, fontSize: compact ? 14 : 15, color: "rgba(255,255,255,0.9)", marginTop: compact ? 6 : 10, maxWidth: 520, lineHeight: compact ? 20 : 22 }}>
            {body}
          </Text>
        )}
        {children && <View style={{ marginTop: compact ? spacing.md : spacing.lg, alignSelf: "flex-start" }}>{children}</View>}
      </View>
    </View>
  );
}
