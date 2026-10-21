import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { YouTubeEmbed, PlayGlyph, safeVideoId, youtubeThumb } from "@/components/YouTube";
import type { FarmProfile } from "@/lib/types";

/**
 * Storefront §6 block 10: a row of YouTube thumbnails; tapping one plays it in the on-page player
 * above the row (youtube-nocookie). Renders nothing when there are no valid extra videos.
 */
export function FarmVideos({ videos, farmName }: { videos: FarmProfile["videos"]; farmName: string }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const valid = videos.filter((v) => safeVideoId(v.video_id));
  const [active, setActive] = useState<string | null>(null);
  if (!valid.length) return null;
  const current = valid.find((v) => v.video_id === active) ?? null;

  return (
    <View style={{ gap: spacing.md }}>
      {current ? <YouTubeEmbed key={current.video_id} videoId={current.video_id} title={current.title || `${farmName} video`} autoplay /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {valid.map((v) => {
          const selected = v.video_id === active;
          return (
            <Pressable
              key={v.video_id}
              onPress={() => setActive(v.video_id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Play video${v.title ? `: ${v.title}` : ""}`}
              style={{ width: 220, gap: 6 }}
            >
              <View
                style={{
                  width: 220,
                  aspectRatio: 16 / 9,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  backgroundColor: "#000",
                  borderWidth: 2,
                  borderColor: selected ? colors.brand : "transparent",
                }}
              >
                <Image source={{ uri: youtubeThumb(v.video_id) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" alt="" accessible={false} />
                <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                  <PlayGlyph size={44} />
                </View>
              </View>
              {v.title ? (
                <Text numberOfLines={2} style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink }}>
                  {v.title}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
