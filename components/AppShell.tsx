import { useState, type Ref } from "react";
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
import { AnnouncementBar } from "./AnnouncementBar";
import { Header, HEADER_COMPACT_WIDTH } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav, BOTTOM_NAV_HEIGHT } from "./MobileBottomNav";
import { ChatFab } from "./ChatFab";

/** Widest the main content column gets on large screens. Full-bleed pieces (hero, footer) ignore it. */
export const CONTENT_MAX_WIDTH = 1200;

/** Side padding that keeps content inside CONTENT_MAX_WIDTH, centred, on wide screens (and the
 *  normal 16px gutter on everything narrower). */
export function useContentGutter(maxWidth: number = CONTENT_MAX_WIDTH): number {
  const { width } = useWindowDimensions();
  const { spacing } = useTheme();
  return Math.max(spacing.lg, Math.round((width - maxWidth) / 2));
}

/** Width available to a centred content column (for picking a grid's column count). */
export function useContentWidth(maxWidth: number = CONTENT_MAX_WIDTH): number {
  const { width } = useWindowDimensions();
  const { spacing } = useTheme();
  return Math.min(width, maxWidth + spacing.lg * 2) - spacing.lg * 2;
}

/**
 * Standard page chrome: header, scrollable content, footer, the mobile bottom bar (below 760 px),
 * and the floating Trellis button. Every route uses this so the chrome never drifts between pages.
 *
 * `stickyBar` (e.g. a listing's "Request a quote" bar, a farm's WhatsApp/"Ask about this farm"
 * bar) is pinned to the bottom, ABOVE the mobile bottom bar (Storefront §2.2); content gets
 * enough bottom padding to scroll clear of both, and the chat button sits above them.
 *
 * `noScroll` is for screens that own their scrolling (a FlatList grid). `hideBottomNav` for forms
 * (the bar would sit over the keyboard and the submit button). `contentContainerStyle` constrains
 * the content only, never the full-bleed Footer.
 */
export function AppShell({
  children,
  noScroll,
  hideBottomNav,
  hideChatFab,
  keyboardAware,
  scrollRef,
  contentContainerStyle,
  stickyBar,
}: {
  children: React.ReactNode;
  noScroll?: boolean;
  hideBottomNav?: boolean;
  hideChatFab?: boolean;
  keyboardAware?: boolean;
  /** The page ScrollView, for screens that need to scroll programmatically (e.g. to a form error). */
  scrollRef?: Ref<ScrollView>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  stickyBar?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [stickyHeight, setStickyHeight] = useState(0);
  const showBottomNav = width < HEADER_COMPACT_WIDTH && !hideBottomNav;
  const navClearance = showBottomNav ? BOTTOM_NAV_HEIGHT + insets.bottom : 0;
  const stickyClearance = stickyBar ? stickyHeight : 0;
  const bottomClearance = navClearance + stickyClearance;

  const topChrome = (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.brandDark }}>
      <AnnouncementBar />
      <Header />
    </View>
  );

  const body = noScroll ? (
    <View style={{ flex: 1, paddingBottom: bottomClearance }}>{children}</View>
  ) : (
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomClearance }}>
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
      {stickyBar ? (
        <View
          onLayout={(e) => setStickyHeight(Math.round(e.nativeEvent.layout.height))}
          style={{ position: "absolute", left: 0, right: 0, bottom: navClearance, zIndex: 35 }}
        >
          {stickyBar}
        </View>
      ) : null}
      {hideChatFab ? null : <ChatFab bottom={bottomClearance} />}
      {showBottomNav && <MobileBottomNav />}
    </View>
  );
}
