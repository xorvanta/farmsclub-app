import { ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav, BOTTOM_NAV_HEIGHT } from "./MobileBottomNav";

/**
 * Standard page chrome: nav header, scrollable content, footer, and (mobile only) a sticky
 * bottom nav bar — same role as retail's MobileBottomNav. Every route uses this so nav/footer/
 * bottom-bar can never drift out of sync between pages.
 *
 * `contentContainerStyle` constrains the CONTENT only (e.g. a narrow centered form column) — it
 * is deliberately NOT passed to the ScrollView's own contentContainerStyle, which would also
 * squeeze the full-bleed Footer rendered after it. `noScroll` is for screens that manage their
 * own scrolling internally (e.g. a sticky bottom CTA bar over a ScrollView, or a FlatList that
 * needs to be the single scrollable list itself) — those screens should pass `hideBottomNav` if
 * they already render their own fixed bottom bar, so the two never stack.
 */
export function AppShell({
  children,
  noScroll,
  hideBottomNav,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  noScroll?: boolean;
  hideBottomNav?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const showBottomNav = width < CHAT_COMPACT_WIDTH && !hideBottomNav;
  const navClearance = showBottomNav ? BOTTOM_NAV_HEIGHT + insets.bottom : 0;

  if (noScroll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <AnnouncementBar />
        <Header />
        <View style={{ flex: 1, paddingBottom: navClearance }}>{children}</View>
        {showBottomNav && <MobileBottomNav />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AnnouncementBar />
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: navClearance }}>
        <View style={contentContainerStyle}>{children}</View>
        <Footer />
      </ScrollView>
      {showBottomNav && <MobileBottomNav />}
    </View>
  );
}
