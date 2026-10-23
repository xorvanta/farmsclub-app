import { useState } from "react";
import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

/** A YouTube video id is exactly 11 URL-safe characters — anything else is never embedded. */
export function safeVideoId(id: string | null | undefined): string | null {
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * 16:9 YouTube player via youtube-nocookie.com (no tracking cookies until play). Click-to-load:
 * the thumbnail is shown first and the iframe is only created on tap, so a profile page doesn't
 * pull YouTube's player JS for every video up front. Native opens the video in the YouTube app.
 */
/** `caption={false}` hides the title strip over the thumbnail (when the page shows the title itself). */
export function YouTubeEmbed({ videoId, title, autoplay = false, caption = true }: { videoId: string; title: string; autoplay?: boolean; caption?: boolean }) {
  const { fonts, radius } = useTheme();
  const id = safeVideoId(videoId);
  const [playing, setPlaying] = useState(autoplay);
  if (!id) return null;

  return (
    <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" }}>
      {playing && Platform.OS === "web" ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title || "Farm video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ border: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <Pressable
          onPress={() => (Platform.OS === "web" ? setPlaying(true) : Linking.openURL(`https://www.youtube.com/watch?v=${id}`))}
          accessibilityRole="button"
          accessibilityLabel={`Play video${title ? `: ${title}` : ""}`}
          style={{ flex: 1 }}
        >
          <Image source={{ uri: youtubeThumb(id) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" alt="" accessible={false} />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" }}>
            <PlayGlyph />
          </View>
          {title && caption ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.45)" }}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, color: "#FFFFFF", fontSize: 13 }}>
                {title}
              </Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

export function PlayGlyph({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 68 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3Z" fill="#E1251B" />
      <Path d="M45 24 27 14v20Z" fill="#FFFFFF" />
    </Svg>
  );
}
