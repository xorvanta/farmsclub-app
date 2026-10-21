import { Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";

export type TagTone = "verified" | "quiet" | "brand" | "accent" | "neutral" | "onPhoto";

/**
 * Small non-interactive label: spec chips, farm type, "Training", "Video". `verified` is the only
 * badge-style tone (Storefront §3.2 — Self-listed farms get a quiet label, never a badge).
 */
export function Tag({ label, tone = "neutral", icon }: { label: string; tone?: TagTone; icon?: string }) {
  const { colors, fonts, radius } = useTheme();
  const map: Record<TagTone, { bg: string; fg: string; border?: string }> = {
    verified: { bg: colors.success, fg: "#FFFFFF" },
    quiet: { bg: "transparent", fg: colors.inkSoft, border: colors.border },
    brand: { bg: colors.brandSoft, fg: colors.brand },
    accent: { bg: colors.accentSoft, fg: colors.accentDark },
    neutral: { bg: colors.paper, fg: colors.inkSoft, border: colors.border },
    onPhoto: { bg: "rgba(12,41,26,0.78)", fg: "#FFFFFF" },
  };
  const t = map[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: t.bg,
        borderColor: t.border ?? "transparent",
        borderWidth: t.border ? 1 : 0,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      {icon ? <Text style={{ fontSize: 10.5, color: t.fg }} aria-hidden>{icon}</Text> : null}
      <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: t.fg, letterSpacing: 0.1 }}>
        {label}
      </Text>
    </View>
  );
}

/** The Verified badge or the quiet "Self-listed" label. */
export function VerifiedTag({ verified }: { verified: boolean }) {
  return verified ? <Tag label="Verified" tone="verified" icon="✓" /> : <Tag label="Self-listed" tone="quiet" />;
}
