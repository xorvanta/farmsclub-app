import { View, Text, Pressable, Linking, useWindowDimensions } from "react-native";
import { useTheme } from "@/constants/theme-context";

// Real contact details — same numbers already hardcoded in paudhewale-dashboard-frontend's
// StorefrontFooter.jsx, no separate public API exposes SupportContactSettingsService today so
// this follows that same established pattern rather than inventing a new one.
const WHATSAPP_NUMBER = "917969513372";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Thin static strip above the main header — trade-desk hours and a quick WhatsApp link, the
 *  kind of utility bar common on B2B platforms (IndiaMART etc.). No backend/notification
 *  state; just real, occasionally-editable content. */
export function AnnouncementBar() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;

  return (
    <View style={{ backgroundColor: colors.brandDark, paddingVertical: 7, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#6FC28F" }} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.88)" }} numberOfLines={1}>
          Trade desk: Mon–Sat, 10am–6pm IST{!compact ? " · Pan-India sourcing & delivery" : ""}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>·</Text>
        <Pressable onPress={() => Linking.openURL(WHATSAPP_URL)} hitSlop={6}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF", textDecorationLine: "underline" }}>
            WhatsApp us →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
