import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { useChat, CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";
import { useB2bContact, whatsappUrl } from "@/constants/contact";

/** Thin strip above the main header — trade-desk hours and a WhatsApp link (each only once an
 *  admin has configured it, see constants/contact.ts) and, on desktop, the "Ask Trellis" trigger.
 *  Below CHAT_COMPACT_WIDTH the chat entry point is MobileBottomNav's "Trellis" tab instead, so
 *  there's exactly one trigger per breakpoint. Renders nothing when it would be empty. */
export function AnnouncementBar() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const { openChat } = useChat();
  const contact = useB2bContact();
  const compact = width < 560;
  const showChatTrigger = width >= CHAT_COMPACT_WIDTH;
  const hours = contact?.hoursLabel ?? null;
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  // A true, non-promissory line — sellers are nurseries/suppliers in many states; delivery to a
  // given location is only ever confirmed per enquiry by the trade desk.
  const tagline = compact ? null : "Sourcing from nurseries across India";

  const parts: React.ReactNode[] = [];
  if (hours) parts.push(<Text key="hours" style={textStyle(fonts.bodyMedium)}>{compact ? hours : `Trade desk: ${hours}`}</Text>);
  if (tagline) parts.push(<Text key="tagline" style={textStyle(fonts.bodyMedium)}>{tagline}</Text>);
  if (waUrl) {
    parts.push(
      <Link key="wa" href={waUrl} target="_blank" rel="noopener noreferrer" accessibilityLabel="WhatsApp our trade desk (opens WhatsApp)">
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF", textDecorationLine: "underline" }}>WhatsApp us →</Text>
      </Link>,
    );
  }

  if (parts.length === 0 && !showChatTrigger) return null;

  return (
    <View style={{ backgroundColor: colors.brandDark, paddingVertical: 7, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: showChatTrigger ? "space-between" : "center", flexWrap: "wrap", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", flexShrink: 1 }}>
          {parts.length > 0 && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#6FC28F" }} />}
          {parts.flatMap((p, i) =>
            i === 0 ? [p] : [<Text key={`sep-${i}`} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }} aria-hidden>·</Text>, p],
          )}
        </View>

        {showChatTrigger && (
          <Pressable
            onPress={() => openChat()}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Ask Trellis, the FarmsClub sourcing assistant"
          >
            <SparkleIcon size={12} />
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF" }}>Ask Trellis</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function textStyle(fontFamily: string) {
  return { fontFamily, fontSize: 11, color: "rgba(255,255,255,0.88)" } as const;
}
