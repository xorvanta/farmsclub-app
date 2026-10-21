import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { NavIcon } from "@/components/graphics/NavIcon";
import { StepIcon } from "@/components/graphics/StepIcon";

export const BOTTOM_NAV_HEIGHT = 58;

/** Mobile-only bottom bar (Storefront §2.2): Home · Farms · Bulk supply · Enquire. Trellis is the
 *  floating chat button (ChatFab), not a tab. */
export function MobileBottomNav() {
  const { colors, fonts } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

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
});
