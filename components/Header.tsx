import { useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Link, usePathname, type Href } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Logo } from "@/components/Logo";

/** Storefront §2.1 desktop links. */
const NAV: { href: Href; path: string; label: string }[] = [
  { href: "/farms", path: "/farms", label: "Farms" },
  { href: "/listings", path: "/listings", label: "Bulk supply" },
  { href: "/about", path: "/about", label: "How it works" },
  { href: "/faqs", path: "/faqs", label: "FAQs" },
];

/** Mobile hamburger: the same links + "List your farm" + "Enquire". */
const MOBILE_NAV: { href: Href; path: string; label: string }[] = [
  ...NAV,
  { href: "/list-your-farm", path: "/list-your-farm", label: "List your farm" },
  { href: "/contact", path: "/contact", label: "Enquire" },
];

export const HEADER_COMPACT_WIDTH = 760;

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
  // Tagline hidden below 400 px where the bar gets tight (§2.1).
  const showTagline = width >= 400;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        shadowColor: "#111C15",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
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
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            style={[styles.menuBtn, { backgroundColor: menuOpen ? colors.brandSoft : "transparent", borderRadius: radius.md }]}
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
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }} accessibilityRole="menubar">
              {NAV.map((item) => {
                const active = isActive(pathname, item.path);
                return (
                  <Link key={item.path} href={item.href} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityState={{ selected: active }}
                      aria-current={active ? "page" : undefined}
                      style={{
                        paddingHorizontal: spacing.md,
                        minHeight: 40,
                        justifyContent: "center",
                        borderRadius: radius.pill,
                        backgroundColor: active ? colors.brandSoft : "transparent",
                      }}
                    >
                      <Text style={{ fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 14, color: active ? colors.brand : colors.inkSoft }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>

            <Link href="/list-your-farm" asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => ({
                  backgroundColor: colors.cta,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.lg,
                  minHeight: 44,
                  justifyContent: "center",
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: "#FFFFFF" }}>List your farm</Text>
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
  bar: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  menuLine: { width: 20, height: 2, borderRadius: 1 },
});
