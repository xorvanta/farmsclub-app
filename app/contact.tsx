import { useRef } from "react";
import { View, Text, type ScrollView } from "react-native";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { Link } from "expo-router";
import { useB2bContact, telUrl, whatsappUrl } from "@/constants/contact";

export default function Contact() {
  const { fonts, colors, spacing } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contact = useB2bContact();
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  const phoneUrl = contact?.phone ? telUrl(contact.phone) : null;
  const linkStyle = { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.brand } as const;
  const hasDirect = !!(waUrl || phoneUrl || contact?.supportEmail);

  return (
    // No bottom nav on the form: it would sit over the keyboard and the submit button.
    <AppShell keyboardAware hideBottomNav scrollRef={scrollRef} contentContainerStyle={{ padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <SeoHead title="Contact · FarmsClub" description="Send Formulate India's trade desk a bulk sourcing requirement for plants, seeds, pots, tools, or soil & fertiliser." />
      <View style={{ marginBottom: spacing.lg }}>
        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Talk to our trade desk</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 6, maxWidth: 480, lineHeight: 20 }}>
          Not sure which listing fits your requirement, or sourcing something that isn't live yet?
          Tell us what you need — this goes straight to the same team that handles every quote.
        </Text>
        {/* Direct channels only when an admin has configured them (B2B Console > Settings). */}
        {hasDirect ? (
          <View style={{ marginTop: spacing.md, gap: 4 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>
              Prefer to reach us directly{contact?.hoursLabel ? ` (${contact.hoursLabel})` : ""}?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
              {waUrl ? <Link href={waUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>WhatsApp {contact?.whatsappNumber}</Link> : null}
              {phoneUrl ? <Link href={phoneUrl} style={linkStyle}>Call {contact?.phone}</Link> : null}
              {contact?.supportEmail ? <Link href={`mailto:${contact.supportEmail}`} style={linkStyle}>{contact.supportEmail}</Link> : null}
            </View>
          </View>
        ) : null}
      </View>
      <RfqFormBody listing={null} listingId={null} scrollRef={scrollRef} />
    </AppShell>
  );
}
