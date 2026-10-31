import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { PressableLink } from "./PressableLink";
import { Photo } from "./Photo";
import { Tag, VerifiedTag } from "./Tag";
import { TiltCard } from "./3d/TiltCard";
import { LogoMark } from "./graphics/LogoMark";
import type { FarmCardApi, HomeFarmCard } from "@/lib/types";

/** One shape for both farm-card payloads (snake_case cards and the home content's camelCase ones). */
export type FarmCardData = {
  slug: string;
  name: string;
  district: string | null;
  state: string | null;
  image: string | null;
  types: string[];
  crops: string[];
  verified: boolean;
  training: boolean;
  video: boolean;
};

const clean = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

export function fromFarmCard(c: FarmCardApi): FarmCardData {
  const crops = (c.crops ?? []).map((x) => clean(x.name)).filter((x): x is string => !!x);
  // "Other" free-text crops count as main crops too (comma-separated by the owner).
  for (const o of (c.other_crops ?? "").split(",")) {
    const v = clean(o);
    if (v && !crops.some((x) => x.toLowerCase() === v.toLowerCase())) crops.push(v);
  }
  return {
    slug: c.slug,
    name: c.name,
    district: clean(c.district?.name),
    state: clean(c.state?.name),
    image: clean(c.card_image_url) ?? clean(c.cover_url),
    types: (c.farm_types ?? []).map((x) => clean(x.name)).filter((x): x is string => !!x),
    crops,
    verified: !!c.verified,
    training: !!c.training_available,
    video: !!c.has_video,
  };
}

export function fromHomeFarmCard(c: HomeFarmCard): FarmCardData {
  return {
    slug: c.slug,
    name: c.name,
    district: clean(c.district),
    state: clean(c.state),
    image: clean(c.coverUrl) ?? clean(c.videoThumbnailUrl),
    types: (c.types ?? []).map((x) => clean(x.nameEn)).filter((x): x is string => !!x),
    crops: (c.crops ?? []).map((x) => clean(x.nameEn)).filter((x): x is string => !!x),
    verified: !!c.verified,
    training: !!c.training,
    video: !!c.heroVideo,
  };
}

/** Grid columns for the content width: 1 on phones, 2 on tablets, 3–4 on desktop (§5). */
export function farmColumns(contentWidth: number): number {
  if (contentWidth < 560) return 1;
  if (contentWidth < 880) return 2;
  if (contentWidth < 1120) return 3;
  return 4;
}

/** "District, State" — whichever parts exist. */
export function placeLine(district: string | null, state: string | null): string | null {
  const parts = [district, state].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Storefront §4.1 Verified Farm Estate Card: 4:3 cover with 3D tilt, visual badges, location overlay, and crop pills. */
export function FarmCard({ farm, width }: { farm: FarmCardData; width?: number }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const place = placeLine(farm.district, farm.state);
  const crops = farm.crops.slice(0, 3);
  const moreCrops = farm.crops.length - crops.length;

  return (
    <TiltCard style={{ width, flex: 1 }}>
      <PressableLink
        href={{ pathname: "/farms/[slug]", params: { slug: farm.slug } }}
        accessibilityLabel={[farm.name, place, farm.verified ? "Verified" : "Self-listed"].filter(Boolean).join(", ")}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={{ aspectRatio: 4 / 3, width: "100%", backgroundColor: colors.brandSoft, position: "relative" }}>
          {farm.image ? (
            <Photo uri={farm.image} alt={farm.name} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <LogoMark size={44} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(8,30,18,0.38)", "transparent", "rgba(8,30,18,0.82)"]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Badges: Verified & Film */}
          <View style={{ position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <VerifiedTag verified={farm.verified} />
            {farm.video ? <Tag label="Farm Film" tone="onPhoto" icon="▶" /> : null}
          </View>

          {/* Bottom Location Pin on Photo */}
          {place ? (
            <View style={{ position: "absolute", left: 10, right: 10, bottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: "#E5B462" }}>
                📍 {place}
              </Text>
              {farm.training ? <Tag label="Training" tone="accent" /> : null}
            </View>
          ) : null}
        </View>

        <View style={{ padding: spacing.md, gap: 7, flex: 1 }}>
          <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink, lineHeight: 21 }}>
            {farm.name}
          </Text>

          {farm.types.length > 0 ? (
            <View style={styles.wrap}>
              {farm.types.slice(0, 2).map((t) => (
                <Tag key={t} label={t} tone="brand" />
              ))}
            </View>
          ) : null}

          {crops.length > 0 ? (
            <View style={[styles.wrap, { marginTop: "auto", paddingTop: 4 }]}>
              {crops.map((c) => (
                <View
                  key={c}
                  style={{
                    backgroundColor: colors.paper,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.pill,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink }}>{c}</Text>
                </View>
              ))}
              {moreCrops > 0 ? (
                <View style={{ justifyContent: "center", paddingHorizontal: 4 }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: colors.inkFaint }}>{`+${moreCrops}`}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </PressableLink>
    </TiltCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    shadowColor: "#081E12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
