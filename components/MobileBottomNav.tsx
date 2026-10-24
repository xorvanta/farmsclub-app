import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";
import { useTheme } from "@/constants/theme-context";
import { trellis } from "@/constants/theme";
import { NavIcon } from "@/components/graphics/NavIcon";
import { StepIcon } from "@/components/graphics/StepIcon";

export const BOTTOM_NAV_HEIGHT = 58;

/** Mobile-only bottom bar (Storefront §2.2): Home · Farms · Bulk supply · Enquire · Trellis. Trellis is
 *  the last tab, in its own warm gradient so it reads as the assistant rather than a page (owner,
 *  25 Oct 2026, like Amazon's Rufus tab). Wider screens have "Ask Trellis" in the header instead. */
export function MobileBottomNav() {
  const { colors, fonts } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isOpen, openChat } = useChat();

  const items: { key: string; label: string; href: Href; active: boolean; render: (c: string) => React.ReactNode }[] = [
    { key: "home", label: "Home", href: "/", active: pathname === "/", render: (c) => <NavIcon icon="home" size={20} color={c} /> },
    { key: "farms", label: "Farms", href: "/farms", active: pathname.startsWith("/farms"), render: (c) => <NavIcon icon="farm" size={21} color={c} /> },
    { key: "bulk", label: "Bulk supply", href: "/listings", active: pathname.startsWith("/listings") || pathname.startsWith("/rfq"), render: (c) => <NavIcon icon="grid" size={20} color={c} /> },
    { key: "enquire", label: "Enquire", href: "/contact", active: pathname === "/contact", render: (c) => <StepIcon icon="form" size={20} color={c} /> },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { height: BOTTOM_NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      {items.map((item) => {
        const tint = item.active ? colors.brand : colors.inkSoft;
        return (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href)}
            style={styles.item}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.active }}
            aria-current={item.active ? "page" : undefined}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.active ? colors.brandSoft : "transparent" }]}>{item.render(tint)}</View>
            <Text style={{ fontFamily: item.active ? fonts.bodyBold : fonts.bodyMedium, fontSize: 10.5, color: tint, marginTop: 2 }}>{item.label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => openChat()}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel="Ask Trellis, the FarmsClub assistant"
        accessibilityState={{ expanded: isOpen }}
      >
        {({ pressed }) => (
          <>
            <LinearGradient
              colors={trellis.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconWrap, styles.trellisChip, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            >
              <SparkleIcon size={18} />
            </LinearGradient>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: trellis.ink, marginTop: 2 }}>Trellis</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderTopWidth: 1,
    zIndex: 40,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 4, minHeight: 48 },
  iconWrap: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  trellisChip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: trellis.glow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
