import { useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Link, usePathname } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Catalogue" },
  { href: "/about", label: "How it works" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
] as const;

// Mobile's hamburger only needs what MobileBottomNav doesn't already cover (Home, Catalogue,
// and Contact/"Enquire" all have their own bottom-nav tab) — repeating them here too would just
// be two paths to the same three destinations, not easier navigation.
const MOBILE_SECONDARY_NAV = [
  { href: "/about", label: "How it works" },
  { href: "/faqs", label: "FAQs" },
] as const;

/** Every destination is an expo-router <Link>, so the web build renders real <a href> anchors
 *  (crawlable, middle-click / open-in-new-tab work) while native still navigates in-app. */
export function Header() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const compact = width < 760;
  const [menuOpen, setMenuOpen] = useState(false);

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
      <View style={[styles.bar, { paddingHorizontal: spacing.lg }]}>
        <Link href="/" asChild>
          <Pressable hitSlop={8} accessibilityRole="link" accessibilityLabel="FarmsClub home">
            <Logo size={19} showTagline={!compact} />
          </Pressable>
        </Link>

        {compact ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Pressable
              onPress={() => setMenuOpen((v) => !v)}
              hitSlop={10}
              style={[
                styles.menuBtn,
                {
                  backgroundColor: menuOpen ? colors.brandSoft : "transparent",
                  borderRadius: radius.md,
                },
              ]}
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
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }} accessibilityRole="menubar">
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} asChild>
                    <Pressable
                      hitSlop={4}
                      accessibilityRole="link"
                      accessibilityState={{ selected: active }}
                      aria-current={active ? "page" : undefined}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: 6,
                        borderRadius: radius.pill,
                        backgroundColor: active ? colors.brandSoft : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium,
                          fontSize: 13.5,
                          color: active ? colors.brand : colors.inkSoft,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>

            <Link href="/contact" asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => [
                  styles.ctaButton,
                  {
                    backgroundColor: colors.cta,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 7,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: "#FFFFFF" }}>
                  Trade Enquiry
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>

      {compact && menuOpen && (
        <View
          style={[
            styles.mobileMenu,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.paper,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          {MOBILE_SECONDARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.md,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                }}
                accessibilityRole="link"
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink }}>{item.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { padding: 8 },
  menuLine: { width: 20, height: 2, borderRadius: 1 },
  mobileMenu: { borderTopWidth: 1 },
  ctaButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
});
