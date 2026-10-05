import { useState } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Catalogue" },
  { href: "/about", label: "How it works" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const compact = width < 760;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <View style={[styles.bar, { paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.push("/")} hitSlop={8}>
          <Logo size={19} showTagline={!compact} />
        </Pressable>

        {compact ? (
          <Pressable onPress={() => setMenuOpen((v) => !v)} hitSlop={10} style={styles.menuBtn}>
            <View style={{ gap: 4 }}>
              <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.ink, width: 14 }]} />
            </View>
          </Pressable>
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "center" }}>
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Pressable key={item.href} onPress={() => router.push(item.href)} hitSlop={6}>
                  <Text
                    style={{
                      fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium,
                      fontSize: 14,
                      color: active ? colors.brand : colors.inkSoft,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {compact && menuOpen && (
        <View style={[styles.mobileMenu, { borderTopColor: colors.border, paddingHorizontal: spacing.lg }]}>
          {NAV.map((item) => (
            <Pressable
              key={item.href}
              onPress={() => {
                setMenuOpen(false);
                router.push(item.href);
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { padding: 8 },
  menuLine: { width: 20, height: 2, borderRadius: 1 },
  mobileMenu: { borderTopWidth: 1 },
});
