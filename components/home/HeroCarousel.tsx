import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { useTour } from "@/lib/tour-context";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import { TiltCard } from "@/components/3d/TiltCard";

export type HeroSlide = {
  key: string;
  image: string;
  title: string;
  subline?: string | null;
  cta?: { label: string; href: Href } | null;
  secondary?: { label: string; href: Href } | null;
  /** Small label above the title, e.g. the farm's place on a featured-farm slide. */
  eyebrow?: string | null;
};

const INTERVAL_MS = 6500;

function prefersReducedMotion(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const TRADE_STATS = [
  { badge: "VOLUME SLABS", value: "Tiered Rates", sub: "Volume drops unit price" },
  { badge: "LOGISTICS", value: "Road & Rail", sub: "Pan-India nursery transit" },
  { badge: "NETWORK", value: "Ground-Filmed", sub: "Verified mother stock" },
];

/**
 * Full-bleed Executive B2B Hero Stage: cross-fading slides with a 3D floating telemetry card on desktop,
 * balanced mobile layout that never clips headlines, and quick triggers for the 3D Orchard Planner & Tour.
 */
export function HeroCarousel({ slides, height, children }: { slides: HeroSlide[]; height: number; children?: React.ReactNode }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const { openTour } = useTour();
  const { width } = useWindowDimensions();
  const wide = width >= 940;
  const compact = width < 560;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const fades = useRef<Animated.Value[]>([]);
  if (fades.current.length !== slides.length) fades.current = slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0));
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    fades.current.forEach((v, i) => Animated.timing(v, { toValue: i === index ? 1 : 0, duration: 700, useNativeDriver: Platform.OS !== "web" }).start());
  }, [index]);

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;
  const hoverProps = Platform.OS === "web" ? { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } : {};

  const scrollToPlanner = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.getElementById("orchard-3d-planner")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <View style={{ height, position: "relative", overflow: "hidden", backgroundColor: colors.brandDark }} {...hoverProps} accessibilityLabel="Highlights">
      {slides.map((s, i) => (
        <Animated.View
          key={s.key}
          style={[StyleSheet.absoluteFill, { opacity: fades.current[i] }]}
          pointerEvents={i === index ? "auto" : "none"}
          aria-hidden={i !== index}
        >
          <Photo uri={s.image} alt="" eager={i === 0} sizes="100vw" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(6,22,13,0.92)", "rgba(8,28,18,0.72)", "rgba(8,28,18,0.38)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient colors={["transparent", "rgba(6,22,13,0.86)"]} style={[StyleSheet.absoluteFill, { top: "45%" }]} />

          <View
            style={{
              flex: 1,
              flexDirection: wide ? "row" : "column",
              alignItems: wide ? "center" : "stretch",
              justifyContent: wide ? "space-between" : "center",
              width: "100%",
              maxWidth: 1232,
              alignSelf: "center",
              paddingHorizontal: spacing.lg,
              paddingTop: compact ? 18 : 28,
              paddingBottom: compact ? 64 : 76,
              gap: compact ? spacing.md : spacing.xl,
            }}
          >
            {/* Left Headline & CTAs */}
            <View style={{ maxWidth: wide ? 640 : 600, width: "100%", flexShrink: 1, minWidth: 0 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(229,180,98,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(229,180,98,0.45)",
                  borderRadius: radius.pill,
                  paddingHorizontal: compact ? 10 : 12,
                  paddingVertical: 4,
                  marginBottom: compact ? 8 : spacing.md,
                  maxWidth: "100%",
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#52C388" }} />
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: fonts.bodyBold, fontSize: compact ? 10 : 11, letterSpacing: 0.7, textTransform: "uppercase", color: "#E5B462", flexShrink: 1 }}
                >
                  {s.eyebrow ?? "B2B WHOLESALE SUPPLY & FARM NETWORK"}
                </Text>
              </View>

              <Text
                numberOfLines={compact ? 2 : 3}
                style={{
                  fontFamily: fonts.display,
                  fontSize: wide ? 50 : compact ? 25 : 38,
                  lineHeight: wide ? 56 : compact ? 31 : 44,
                  color: "#FFFFFF",
                }}
              >
                {s.title}
              </Text>

              {s.subline ? (
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: compact ? 13.5 : 17,
                    lineHeight: compact ? 19 : 25,
                    color: "rgba(255,255,255,0.88)",
                    marginTop: compact ? 6 : spacing.sm,
                    maxWidth: 540,
                  }}
                >
                  {s.subline}
                </Text>
              ) : null}

              {s.cta || s.secondary ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: compact ? 12 : spacing.lg }}>
                  {s.cta ? (
                    <Link href={s.cta.href} asChild>
                      <Button label={s.cta.label} />
                    </Link>
                  ) : null}
                  {s.secondary ? (
                    <Link href={s.secondary.href} asChild>
                      <Button label={s.secondary.label} variant="outline" inverted />
                    </Link>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Right 3D Floating Trade Command Card (Desktop Only — High-Impact Position) */}
            {wide ? (
              <TiltCard maxTilt={3.5} scale={1.01} style={{ width: 350 }}>
                <View
                  style={{
                    backgroundColor: "rgba(8, 28, 17, 0.78)",
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: "rgba(229,180,98,0.36)",
                    gap: spacing.md,
                    shadowColor: "#000",
                    shadowOpacity: 0.35,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 12 },
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.9, color: "#E5B462" }}>
                      B2B TRADE TELEMETRY
                    </Text>
                    <View style={{ backgroundColor: "rgba(82,195,136,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#6FC28F" }}>● LIVE DESK</Text>
                    </View>
                  </View>

                  <View style={{ gap: 8 }}>
                    {TRADE_STATS.map((st) => (
                      <View
                        key={st.badge}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderRadius: radius.md,
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <View>
                          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#E5B462", letterSpacing: 0.5 }}>{st.badge}</Text>
                          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.72)" }}>{st.sub}</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.display, fontSize: 15, color: "#FFFFFF" }}>{st.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, paddingTop: 2 }}>
                    <Pressable
                      onPress={scrollToPlanner}
                      accessibilityRole="button"
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderRadius: radius.md,
                        backgroundColor: "rgba(229,180,98,0.18)",
                        borderWidth: 1,
                        borderColor: "#E5B462",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#E5B462" }}>📐 3D Orchard Sim</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openTour(0)}
                      accessibilityRole="button"
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderRadius: radius.md,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.22)",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#FFFFFF" }}>✦ 30s Guide</Text>
                    </Pressable>
                  </View>
                </View>
              </TiltCard>
            ) : null}
          </View>
        </Animated.View>
      ))}

      {children}

      {count > 1 ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: compact ? 44 : 64 }} pointerEvents="box-none">
          <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: 8 }} pointerEvents="box-none">
            {slides.map((s, i) => (
              <Pressable
                key={s.key}
                onPress={() => go(i)}
                accessibilityRole="button"
                accessibilityLabel={`Show slide ${i + 1} of ${count}`}
                accessibilityState={{ selected: i === index }}
                hitSlop={10}
                style={{ height: 6, width: i === index ? 32 : 10, borderRadius: 3, backgroundColor: i === index ? "#E5B462" : "rgba(255,255,255,0.42)" }}
              />
            ))}
            {wide ? (
              <View style={{ marginLeft: "auto", flexDirection: "row", gap: 8 }}>
                <Arrow dir="left" onPress={() => go(index - 1)} />
                <Arrow dir="right" onPress={() => go(index + 1)} />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function Arrow({ dir, onPress, tone = "light" }: { dir: "left" | "right"; onPress: () => void; tone?: "light" | "dark" }) {
  const { colors } = useTheme();
  const light = tone === "light";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={dir === "left" ? "Previous" : "Next"}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: light ? "rgba(229,180,98,0.55)" : colors.border,
        shadowColor: "#081E12",
        shadowOpacity: light ? 0 : 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        backgroundColor: light ? (hovered || pressed ? "rgba(229,180,98,0.25)" : "rgba(8,30,18,0.55)") : hovered || pressed ? colors.brandSoft : colors.surface,
      })}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={light ? "#FFFFFF" : colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
      </Svg>
    </Pressable>
  );
}
