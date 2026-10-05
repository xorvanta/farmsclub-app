import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Standard page chrome: nav header, scrollable content, footer. Every route uses this so nav/
 * footer can never drift out of sync between pages.
 *
 * `contentContainerStyle` constrains the CONTENT only (e.g. a narrow centered form column) — it
 * is deliberately NOT passed to the ScrollView's own contentContainerStyle, which would also
 * squeeze the full-bleed Footer rendered after it. `noScroll` is for screens that manage their
 * own scrolling internally (e.g. a sticky bottom CTA bar over a ScrollView, or a FlatList that
 * needs to be the single scrollable list itself).
 */
export function AppShell({
  children,
  noScroll,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  noScroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  if (noScroll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <Header />
        {children}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Header />
      <ScrollView>
        <View style={contentContainerStyle}>{children}</View>
        <Footer />
      </ScrollView>
    </View>
  );
}
