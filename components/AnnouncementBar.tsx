import { View, Text, Pressable, Linking, useWindowDimensions } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { useChat, CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";

// Real contact details — same numbers already hardcoded in paudhewale-dashboard-frontend's
// StorefrontFooter.jsx, no separate public API exposes SupportContactSettingsService today so
// this follows that same established pattern rather than inventing a new one.
const WHATSAPP_NUMBER = "917969513372";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Thin static strip above the main header — trade-desk hours, a WhatsApp link, and (desktop
 *  only) the "Ask Trellis" trigger, same placement retail uses for "Ask Root" in its own header
 *  utility strip. Below CHAT_COMPACT_WIDTH, ChatWidget's floating button is the only entry
 *  point instead — see that file for why the breakpoint is shared. */
export function AnnouncementBar() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const { openChat } = useChat();
  const compact = width < 560;
  const showChatTrigger = width >= CHAT_COMPACT_WIDTH;

  return (
    <View style={{ backgroundColor: colors.brandDark, paddingVertical: 7, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: showChatTrigger ? "space-between" : "center", flexWrap: "wrap", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#6FC28F" }} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.88)" }}>
            {compact ? "Mon–Sat, 10am–6pm" : "Trade desk: Mon–Sat, 10am–6pm IST · Pan-India sourcing & delivery"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>·</Text>
          <Pressable onPress={() => Linking.openURL(WHATSAPP_URL)} hitSlop={6}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF", textDecorationLine: "underline" }}>
              WhatsApp us →
            </Text>
          </Pressable>
        </View>

        {showChatTrigger && (
          <Pressable onPress={() => openChat()} style={{ flexDirection: "row", alignItems: "center", gap: 5 }} hitSlop={6}>
            <SparkleIcon size={12} />
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF" }}>Ask Trellis</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
