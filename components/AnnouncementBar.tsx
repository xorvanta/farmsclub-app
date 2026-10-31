import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { useB2bContact, whatsappUrl } from "@/constants/contact";
import { useTour } from "@/lib/tour-context";

/**
 * Executive B2B Live Trade Strip above the header:
 * Shows live B2B trade badges (Quantity Tiers · Road & Rail Dispatch), the admin's hours & WhatsApp
 * link when configured, and a quick "30s Tour" trigger on desktop (mobile already has the Tour button in Header).
 */
export function AnnouncementBar() {
  const { colors, fonts, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 640;
  const contact = useB2bContact();
  const { openTour } = useTour();
  const hours = contact?.hoursLabel ?? null;
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;

  return (
    <View
      style={{
        backgroundColor: colors.brandDark,
        paddingVertical: 6,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(229,180,98,0.18)",
      }}
    >
      <View
        style={{
          maxWidth: 1232,
          width: "100%",
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Left: Live B2B Telemetry */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(82,195,136,0.14)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#52C388" }} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, color: "#6FC28F" }}>
              B2B WHOLESALE DESK
            </Text>
          </View>
          {!compact ? (
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.82)", flexShrink: 1 }}>
              Direct Farm Network · Volume Slab Pricing · Road & Rail Dispatch
            </Text>
          ) : (
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.78)", flexShrink: 1 }}>
              Bulk Supply · Verified Farms
            </Text>
          )}
        </View>

        {/* Right: Hours, WhatsApp & Desktop Tour Trigger */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {hours && !compact ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.82)" }}>
              Desk: {hours}
            </Text>
          ) : null}
          {waUrl ? (
            <Link href={waUrl} target="_blank" rel="noopener noreferrer" accessibilityLabel="WhatsApp the FarmsClub team (opens WhatsApp)">
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#6FC28F", textDecorationLine: "underline" }}>
                WhatsApp →
              </Text>
            </Link>
          ) : null}
          {!compact ? (
            <Pressable
              onPress={() => openTour(0)}
              accessibilityRole="button"
              accessibilityLabel="Open interactive platform tour"
              style={{
                backgroundColor: "rgba(229,180,98,0.18)",
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.4)",
                paddingHorizontal: 9,
                paddingVertical: 2,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#E5B462" }}>✦ 30s Tour</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
