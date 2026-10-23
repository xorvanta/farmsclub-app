import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { PlayGlyph, YouTubeEmbed, safeVideoId, youtubeThumb } from "@/components/YouTube";

export type HomeVideo = { videoId: string; title: string; farmSlug?: string | null; farmName?: string | null };

/** Admin-picked videos first, then featured farms' own videos; invalid ids and repeats dropped. */
export function mergeVideos(...lists: HomeVideo[][]): HomeVideo[] {
  const seen = new Set<string>();
  const out: HomeVideo[] = [];
  for (const list of lists) {
    for (const v of list) {
      const id = safeVideoId(v.videoId);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ ...v, videoId: id });
    }
  }
  return out;
}

/**
 * "See the farms": a dark full-width band with one large player and the other videos beside it
 * (below it on phones). Picking a video plays it in the large player. Real videos only — the
 * section isn't rendered when there are none.
 */
export function VideoShowcase({ videos, title, subtitle }: { videos: HomeVideo[]; title: string; subtitle?: string }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  if (videos.length === 0) return null;
  const current = videos[Math.min(active, videos.length - 1)];
  const others = videos.map((v, i) => ({ v, i })).filter(({ i }) => i !== active);

  const pick = (i: number) => {
    setActive(i);
    setAutoplay(true);
  };

  const thumb = ({ v, i }: { v: HomeVideo; i: number }, w: number | "100%") => (
    <Pressable
      key={v.videoId}
      onPress={() => pick(i)}
      accessibilityRole="button"
      accessibilityLabel={`Play ${v.title}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        width: w,
        flexDirection: wide ? "row" : "column",
        gap: spacing.md,
        alignItems: wide ? "center" : "stretch",
        padding: wide ? 8 : 0,
        borderRadius: radius.md,
        backgroundColor: wide && (hovered || pressed) ? "rgba(255,255,255,0.08)" : "transparent",
      })}
    >
      <View style={{ width: wide ? 136 : "100%", aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#000" }}>
        <Image source={{ uri: youtubeThumb(v.videoId) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessible={false} />
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <PlayGlyph size={30} />
        </View>
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: 2 }}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, lineHeight: 18, color: "#FFFFFF" }}>{v.title}</Text>
        {v.farmName ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{v.farmName}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <View style={{ backgroundColor: colors.brandDark, paddingVertical: wide ? 64 : 40, marginTop: 56 }}>
      <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#E7B57A" }}>Watch</Text>
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: wide ? 32 : 24, lineHeight: wide ? 38 : 30, color: "#FFFFFF", marginTop: 6 }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ fontFamily: fonts.body, fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>{subtitle}</Text> : null}

        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.xl, marginTop: spacing.xl }}>
          <View style={{ flex: wide ? 2 : undefined }}>
            <YouTubeEmbed key={current.videoId} videoId={current.videoId} title={current.title} autoplay={autoplay} caption={false} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.md, flexWrap: "wrap" }}>
              <Text style={{ flexShrink: 1, fontFamily: fonts.heading, fontSize: 17, color: "#FFFFFF" }}>{current.title}</Text>
              {current.farmSlug ? (
                <Link href={{ pathname: "/farms/[slug]", params: { slug: current.farmSlug } }} style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: "#E7B57A", paddingVertical: 8 }}>
                  {current.farmName ? `Visit ${current.farmName}` : "Visit the farm"} →
                </Link>
              ) : null}
            </View>
          </View>
          {others.length > 0 ? (
            wide ? (
              <View style={{ flex: 1, gap: 4 }}>{others.slice(0, 5).map((o) => thumb(o, "100%"))}</View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
                {others.map((o) => thumb(o, 200))}
              </ScrollView>
            )
          ) : null}
        </View>
      </View>
    </View>
  );
}
