import { View, Text } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { useB2bContact, whatsappUrl } from "@/constants/contact";

/** Thin strip above the header — the FarmsClub team's hours and WhatsApp link, each only once an
 *  admin has configured it (constants/contact.ts). Renders nothing when there's nothing to say.
 *  (Trellis is the floating chat button now, not a link here.) */
export function AnnouncementBar() {
  const { colors, fonts, spacing } = useTheme();
  const contact = useB2bContact();
  const hours = contact?.hoursLabel ?? null;
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  if (!hours && !waUrl) return null;

  return (
    <View style={{ backgroundColor: colors.brandDark, paddingVertical: 7, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
        {hours ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.9)" }}>FarmsClub team: {hours}</Text> : null}
        {hours && waUrl ? <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }} aria-hidden>·</Text> : null}
        {waUrl ? (
          <Link href={waUrl} target="_blank" rel="noopener noreferrer" accessibilityLabel="WhatsApp the FarmsClub team (opens WhatsApp)">
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: "#FFFFFF", textDecorationLine: "underline" }}>WhatsApp us →</Text>
          </Link>
        ) : null}
      </View>
    </View>
  );
}
