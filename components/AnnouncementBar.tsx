import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { useB2bContact, whatsappUrl } from "@/constants/contact";
import { useTour } from "@/lib/tour-context";

/**
 * Sovereign Mandi Live Trade Strip above the header:
 * Shows live B2B trade badges (Quantity Tiers · Road & Rail Dispatch), the admin's hours & WhatsApp
 * link when configured, and a quick "30s Mandi Tour" trigger.
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
        paddingVertical: 7,
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
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {/* Left: Live Mandi Telemetry */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(82,195,136,0.14)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#52C388" }} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.6, color: "#6FC28F" }}>
              B2B MANDI EXCHANGE
            </Text>
          </View>
          {!compact ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.82)" }}>
              Direct Farm Network · Volume Slab Pricing · Road & Rail Dispatch
            </Text>
          ) : null}
        </View>

        {/* Right: Hours, WhatsApp & Interactive Tour Trigger */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {hours && !compact ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.82)" }}>
              Desk: {hours}
            </Text>
          ) : null}
          {waUrl ? (
            <Link href={waUrl} target="_blank" rel="noopener noreferrer" accessibilityLabel="WhatsApp the FarmsClub team (opens WhatsApp)">
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: "#6FC28F", textDecorationLine: "underline" }}>
                WhatsApp Desk →
              </Text>
            </Link>
          ) : null}
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
        </View>
      </View>
    </View>
  );
}
