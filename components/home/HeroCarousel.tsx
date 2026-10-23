import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";

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

/**
 * Full-bleed photo carousel for the top of the home page: cross-fading slides, each with one
 * short title and a button. Advances on its own (not with reduced motion), pauses while hovered,
 * and has dots + arrows. `children` sits over every slide (the page's hidden H1).
 */
export function HeroCarousel({ slides, height, children }: { slides: HeroSlide[]; height: number; children?: React.ReactNode }) {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
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
            colors={["rgba(8,28,18,0.82)", "rgba(8,28,18,0.45)", "rgba(8,28,18,0.15)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient colors={["transparent", "rgba(8,28,18,0.55)"]} style={[StyleSheet.absoluteFill, { top: "55%" }]} />
          <View style={{ flex: 1, justifyContent: "center", width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, paddingBottom: compact ? 56 : 72 }}>
            <View style={{ maxWidth: 620 }}>
              {s.eyebrow ? (
                <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: "#FFFFFF" }}>{s.eyebrow}</Text>
                </View>
              ) : null}
              <Text style={{ fontFamily: fonts.display, fontSize: wide ? 52 : compact ? 31 : 40, lineHeight: wide ? 58 : compact ? 37 : 46, color: "#FFFFFF" }}>{s.title}</Text>
              {s.subline ? (
                <Text numberOfLines={3} style={{ fontFamily: fonts.body, fontSize: compact ? 15 : 18, lineHeight: compact ? 22 : 27, color: "rgba(255,255,255,0.9)", marginTop: spacing.md }}>
                  {s.subline}
                </Text>
              ) : null}
              {s.cta || s.secondary ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl }}>
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
          </View>
        </Animated.View>
      ))}

      {children}

      {count > 1 ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: compact ? 52 : 64 }} pointerEvents="box-none">
          <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: 8 }} pointerEvents="box-none">
            {slides.map((s, i) => (
              <Pressable
                key={s.key}
                onPress={() => go(i)}
                accessibilityRole="button"
                accessibilityLabel={`Show slide ${i + 1} of ${count}`}
                accessibilityState={{ selected: i === index }}
                hitSlop={10}
                style={{ height: 6, width: i === index ? 28 : 10, borderRadius: 3, backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.45)" }}
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
        borderColor: light ? "rgba(255,255,255,0.5)" : colors.border,
        shadowColor: "#0C291A",
        shadowOpacity: light ? 0 : 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        backgroundColor: light ? (hovered || pressed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)") : hovered || pressed ? colors.brandSoft : colors.surface,
      })}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={light ? "#FFFFFF" : colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
      </Svg>
    </Pressable>
  );
}
