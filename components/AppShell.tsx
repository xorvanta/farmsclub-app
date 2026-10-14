import type { Ref } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav, BOTTOM_NAV_HEIGHT } from "./MobileBottomNav";

/** Widest the main content column gets on large screens — past this, lines and card grids get
 *  too long to scan. Full-bleed pieces (hero, footer) ignore it. */
export const CONTENT_MAX_WIDTH = 1200;

/** Side padding that keeps content inside CONTENT_MAX_WIDTH, centred, on wide screens (and the
 *  normal 16px gutter on everything narrower). For lists whose rows can't simply be wrapped in a
 *  max-width container (FlatList grids with a full-bleed footer). */
export function useContentGutter(maxWidth: number = CONTENT_MAX_WIDTH): number {
  const { width } = useWindowDimensions();
  const { spacing } = useTheme();
  return Math.max(spacing.lg, Math.round((width - maxWidth) / 2));
}

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
 *
 * The top chrome sits below the status bar / notch (safe-area top inset, painted in the
 * announcement bar's colour). `keyboardAware` (forms) lifts content above the on-screen keyboard;
 * every scroll view keeps taps on buttons working while the keyboard is open.
 */
export function AppShell({
  children,
  noScroll,
  hideBottomNav,
  keyboardAware,
  scrollRef,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  noScroll?: boolean;
  hideBottomNav?: boolean;
  keyboardAware?: boolean;
  /** The page ScrollView, for screens that need to scroll programmatically (e.g. to a form error). */
  scrollRef?: Ref<ScrollView>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const showBottomNav = width < CHAT_COMPACT_WIDTH && !hideBottomNav;
  const navClearance = showBottomNav ? BOTTOM_NAV_HEIGHT + insets.bottom : 0;

  const topChrome = (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.brandDark }}>
      <AnnouncementBar />
      <Header />
    </View>
  );

  const body = noScroll ? (
    <View style={{ flex: 1, paddingBottom: navClearance }}>{children}</View>
  ) : (
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: navClearance }}>
      <View style={contentContainerStyle}>{children}</View>
      <Footer />
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {topChrome}
      {keyboardAware && Platform.OS !== "web" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
      {showBottomNav && <MobileBottomNav />}
    </View>
  );
}
