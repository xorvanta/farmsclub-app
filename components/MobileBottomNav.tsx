import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { useChat } from "@/lib/chat-context";
import { NavIcon } from "@/components/graphics/NavIcon";
import { StepIcon } from "@/components/graphics/StepIcon";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";

export const BOTTOM_NAV_HEIGHT = 58;

/** Mobile-only sticky action bar — same role as retail's MobileBottomNav: one real entry point
 *  per primary destination, thumb-reachable, visible on every scroll position. FarmsClub has no
 *  cart/wishlist/account, so the 4 tabs are Home, Catalogue, Enquire (the RFQ/contact path —
 *  this platform's equivalent of retail's Cart as "the" conversion action) and Trellis (same
 *  toggle the desktop announcement bar's "Ask Trellis" link uses — exactly one chat entry point
 *  per breakpoint, never two). Pages with their own fixed bottom bar (listing detail's
 *  "Request a Quote" CTA) hide this via AppShell's hideBottomNav, same as retail hides its own
 *  nav on product/cart/checkout pages rather than stacking two bottom bars. */
export function MobileBottomNav() {
  const { colors, fonts } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isOpen, openChat, closeChat } = useChat();

  const items = [
    { key: "home", label: "Home", render: (c: string) => <NavIcon icon="home" size={20} color={c} />, active: pathname === "/", onPress: () => router.push("/") },
    { key: "catalogue", label: "Catalogue", render: (c: string) => <NavIcon icon="grid" size={20} color={c} />, active: pathname.startsWith("/listings"), onPress: () => router.push("/listings") },
    { key: "enquire", label: "Enquire", render: (c: string) => <StepIcon icon="form" size={20} color={c} />, active: pathname === "/contact", onPress: () => router.push("/contact") },
    { key: "trellis", label: "Trellis", render: (c: string) => <SparkleIcon size={18} color={c} />, active: isOpen, onPress: () => (isOpen ? closeChat() : openChat()) },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          height: BOTTOM_NAV_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {items.map((item) => {
        const tint = item.active ? colors.brand : colors.inkFaint;
        return (
          <Pressable key={item.key} onPress={item.onPress} style={styles.item} hitSlop={4}>
            {item.render(tint)}
            <Text
              style={{
                fontFamily: item.active ? fonts.bodySemiBold : fonts.bodyMedium,
                fontSize: 10,
                color: tint,
                marginTop: 3,
              }}
            >
              {item.label}
            </Text>
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
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 8 },
});
