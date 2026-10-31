import { useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Link, usePathname, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Polygon } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { trellis } from "@/constants/theme";
import { useChat } from "@/lib/chat-context";
import { useTour } from "@/lib/tour-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";
import { Logo } from "@/components/Logo";

/** Storefront §2.1 desktop links. */
const NAV: { href: Href; path: string; label: string; badge?: string }[] = [
  { href: "/listings", path: "/listings", label: "Bulk Supply", badge: "B2B" },
  { href: "/farms", path: "/farms", label: "Verified Farms" },
  { href: "/about", path: "/about", label: "How It Works" },
  { href: "/faqs", path: "/faqs", label: "FAQs" },
];

/** Mobile hamburger: the same links + "List your farm" + "Enquire". */
const MOBILE_NAV: { href: Href; path: string; label: string }[] = [
  ...NAV,
  { href: "/list-your-farm", path: "/list-your-farm", label: "List your farm" },
  { href: "/contact", path: "/contact", label: "Enquire" },
];

export const HEADER_COMPACT_WIDTH = 820;

function isActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Every destination is an expo-router <Link>, so the web build renders real <a href> anchors
 *  (crawlable, middle-click / open-in-new-tab work) while native still navigates in-app. */
export function Header() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const compact = width < HEADER_COMPACT_WIDTH;
  const [menuOpen, setMenuOpen] = useState(false);
  const { isOpen: chatOpen, openChat } = useChat();
  const { openTour } = useTour();
  const showTagline = width >= 400;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        shadowColor: "#081E12",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        zIndex: 30,
      }}
    >
      <View style={[styles.bar, { paddingHorizontal: spacing.lg, maxWidth: 1232, width: "100%", alignSelf: "center" }]}>
        <Link href="/" asChild>
          <Pressable hitSlop={8} accessibilityRole="link" accessibilityLabel="FarmsClub home" style={{ minHeight: 44, justifyContent: "center" }}>
            <Logo size={19} showTagline={showTagline} />
          </Pressable>
        </Link>

        {compact ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Pressable
              onPress={() => openTour(0)}
              accessibilityRole="button"
              accessibilityLabel="Take 30-second Mandi tour"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                height: 36,
                borderRadius: radius.pill,
                backgroundColor: colors.goldSoft,
                borderWidth: 1,
                borderColor: colors.gold,
              }}
            >
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.goldDark} strokeWidth={2.2}>
                <Circle cx={12} cy={12} r={10} />
                <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </Svg>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.goldDark }}>Tour</Text>
            </Pressable>

            <Pressable
              onPress={() => setMenuOpen((v) => !v)}
              style={[styles.menuBtn, { backgroundColor: menuOpen ? colors.brandSoft : colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={menuOpen ? "Close menu" : "Open menu"}
              accessibilityState={{ expanded: menuOpen }}
              aria-expanded={menuOpen}
            >
              <View style={{ gap: 4 }}>
                <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
                <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
                <View style={[styles.menuLine, { backgroundColor: colors.ink, width: 14 }]} />
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
                backgroundColor: colors.paper,
                padding: 4,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              accessibilityRole="menubar"
            >
              {NAV.map((item) => {
                const active = isActive(pathname, item.path);
                return (
                  <Link key={item.path} href={item.href} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityState={{ selected: active }}
                      aria-current={active ? "page" : undefined}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        minHeight: 36,
                        justifyContent: "center",
                        borderRadius: radius.pill,
                        backgroundColor: active ? colors.brand : "transparent",
                      }}
                    >
                      <Text style={{ fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 13.5, color: active ? "#FFFFFF" : colors.ink }}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View
                          style={{
                            backgroundColor: active ? "#E5B462" : colors.brandSoft,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: radius.pill,
                          }}
                        >
                          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9.5, color: active ? "#081E12" : colors.brand }}>
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  </Link>
                );
              })}
            </View>

            {/* Interactive Tour Guide Button */}
            <Pressable
              onPress={() => openTour(0)}
              accessibilityRole="button"
              accessibilityLabel="Take 30-second interactive platform tour"
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 13,
                minHeight: 42,
                borderRadius: radius.pill,
                backgroundColor: pressed ? colors.brandSoft : colors.goldSoft,
                borderWidth: 1,
                borderColor: colors.gold,
              })}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.goldDark} strokeWidth={2.2}>
                <Circle cx={12} cy={12} r={10} />
                <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </Svg>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.goldDark }}>Tour</Text>
            </Pressable>

            {/* Desktop's way into Trellis */}
            <Pressable
              onPress={() => openChat()}
              accessibilityRole="button"
              accessibilityLabel="Ask Trellis, the FarmsClub assistant"
              accessibilityState={{ expanded: chatOpen }}
              style={({ pressed }) => ({ borderRadius: radius.pill, transform: [{ scale: pressed ? 0.96 : 1 }] })}
            >
              <LinearGradient
                colors={trellis.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: radius.pill,
                  paddingHorizontal: 16,
                  minHeight: 42,
                  shadowColor: trellis.glow,
                  shadowOpacity: 0.28,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }}
              >
                <SparkleIcon size={16} />
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: "#FFFFFF" }}>Ask Trellis</Text>
              </LinearGradient>
            </Pressable>

            <Link href="/list-your-farm" asChild>
              <Pressable
                accessibilityRole="link"
                style={{
                  backgroundColor: colors.brand,
                  borderRadius: radius.pill,
                  paddingHorizontal: 16,
                  minHeight: 42,
                  justifyContent: "center",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: "#FFFFFF" }}>+ List Farm</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>

      {compact && menuOpen && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.path);
            const cta = item.path === "/list-your-farm";
            return (
              <Link key={item.path} href={item.href} asChild>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    minHeight: 48,
                    justifyContent: "center",
                    paddingHorizontal: spacing.sm,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  }}
                  accessibilityRole="link"
                >
                  <Text style={{ fontFamily: active || cta ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 15.5, color: cta ? colors.cta : active ? colors.brand : colors.ink }}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  menuLine: { width: 18, height: 2, borderRadius: 1 },
});
