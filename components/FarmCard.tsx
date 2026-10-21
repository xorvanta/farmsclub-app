import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { PressableLink } from "./PressableLink";
import { Photo } from "./Photo";
import { Tag, VerifiedTag } from "./Tag";
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

/** Storefront §4.1 farm card: 4:3 cover, name, place, ≤2 farm types, ≤3 crops (+N), tags. */
export function FarmCard({ farm, width }: { farm: FarmCardData; width?: number }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const place = placeLine(farm.district, farm.state);
  const crops = farm.crops.slice(0, 3);
  const moreCrops = farm.crops.length - crops.length;

  return (
    <PressableLink
      href={{ pathname: "/farms/[slug]", params: { slug: farm.slug } }}
      accessibilityLabel={[farm.name, place, farm.verified ? "Verified" : "Self-listed"].filter(Boolean).join(", ")}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={{ aspectRatio: 4 / 3, width: "100%", backgroundColor: colors.brandSoft }}>
        {farm.image ? (
          <Photo uri={farm.image} alt={farm.name} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <LogoMark size={44} />
          </View>
        )}
        {farm.video ? (
          <View style={{ position: "absolute", left: 8, bottom: 8 }}>
            <Tag label="Video" tone="onPhoto" icon="▶" />
          </View>
        ) : null}
      </View>

      <View style={{ padding: spacing.md, gap: 6, flex: 1 }}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.heading, fontSize: 15.5, color: colors.ink, lineHeight: 21 }}>
          {farm.name}
        </Text>
        {place ? (
          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft }}>
            {place}
          </Text>
        ) : null}
        {farm.types.length > 0 ? (
          <View style={styles.wrap}>
            {farm.types.slice(0, 2).map((t) => (
              <Tag key={t} label={t} tone="brand" />
            ))}
          </View>
        ) : null}
        {crops.length > 0 ? (
          <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink }}>
            {crops.join(" · ")}
            {moreCrops > 0 ? <Text style={{ color: colors.inkFaint }}>{`  +${moreCrops}`}</Text> : null}
          </Text>
        ) : null}
        <View style={[styles.wrap, { marginTop: "auto", paddingTop: 4 }]}>
          <VerifiedTag verified={farm.verified} />
          {farm.training ? <Tag label="Training" tone="accent" /> : null}
        </View>
      </View>
    </PressableLink>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    shadowColor: "#111C15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
