import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
 * "See the farms": a dark full-width Sovereign Mandi cinema reel with one large player and the other videos beside it
 * (below it on phones). Picking a video plays it in the large player. Real videos only — the
 * section isn't rendered when there are none.
 */
export function VideoShowcase({ videos, title, subtitle }: { videos: HomeVideo[]; title: string; subtitle?: string }) {
  const { fonts, spacing, radius } = useTheme();
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
        padding: wide ? 10 : 0,
        borderRadius: radius.lg,
        borderWidth: wide ? 1 : 0,
        borderColor: wide && (hovered || pressed) ? "rgba(229,180,98,0.35)" : "rgba(255,255,255,0.06)",
        backgroundColor: wide && (hovered || pressed) ? "rgba(229,180,98,0.08)" : "rgba(255,255,255,0.02)",
      })}
    >
      <View
        style={{
          width: wide ? 140 : "100%",
          aspectRatio: 16 / 9,
          borderRadius: radius.md,
          overflow: "hidden",
          backgroundColor: "#000",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <Image source={{ uri: youtubeThumb(v.videoId) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessible={false} />
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <PlayGlyph size={30} />
        </View>
      </View>
      <View style={{ flex: wide ? 1 : undefined, gap: 3 }}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, lineHeight: 18, color: "#FFFFFF" }}>
          {v.title}
        </Text>
        {v.farmName ? (
          <Text numberOfLines={1} style={{ fontFamily: fonts.mono, fontSize: 11, color: "#E5B462" }}>
            {v.farmName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={["#06150D", "#0E2D1D", "#081E12"]}
      style={{
        paddingVertical: wide ? 64 : 40,
        marginTop: 56,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(229,180,98,0.22)",
      }}
    >
      <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.pill,
              backgroundColor: "rgba(229,180,98,0.14)",
              borderWidth: 1,
              borderColor: "rgba(229,180,98,0.35)",
            }}
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: "#E5B462" }}>
              GROUND-FILMED DISPATCH REEL · {videos.length} FILMS
            </Text>
          </View>
        </View>
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: wide ? 34 : 24, lineHeight: wide ? 40 : 30, color: "#FFFFFF", marginTop: 10 }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ fontFamily: fonts.body, fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>{subtitle}</Text> : null}

        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.xl, marginTop: spacing.xl }}>
          <View style={{ flex: wide ? 2 : undefined }}>
            <YouTubeEmbed key={current.videoId} videoId={current.videoId} title={current.title} autoplay={autoplay} caption={false} />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
                marginTop: spacing.md,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                flexWrap: "wrap",
              }}
            >
              <Text style={{ flexShrink: 1, fontFamily: fonts.heading, fontSize: 17, color: "#FFFFFF" }}>{current.title}</Text>
              {current.farmSlug ? (
                <Link
                  href={{ pathname: "/farms/[slug]", params: { slug: current.farmSlug } }}
                  style={{
                    fontFamily: fonts.bodySemiBold,
                    fontSize: 13.5,
                    color: "#081E12",
                    backgroundColor: "#E5B462",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                  }}
                >
                  {current.farmName ? `Inspect ${current.farmName}` : "Inspect Farm Dossier"} →
                </Link>
              ) : null}
            </View>
          </View>
          {others.length > 0 ? (
            wide ? (
              <View style={{ flex: 1, gap: 8 }}>{others.slice(0, 5).map((o) => thumb(o, "100%"))}</View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
                {others.map((o) => thumb(o, 210))}
              </ScrollView>
            )
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}
