import { useRef } from "react";
import { View, Text, Pressable, type ScrollView } from "react-native";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { Badge } from "@/components/Badge";
import { Link } from "expo-router";
import { useB2bContact, telUrl, whatsappUrl } from "@/constants/contact";

export default function Contact() {
  const { fonts, colors, spacing, radius } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contact = useB2bContact();
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  const phoneUrl = contact?.phone ? telUrl(contact.phone) : null;
  const hasDirect = !!(waUrl || phoneUrl || contact?.supportEmail);

  return (
    // No bottom nav on the form: it would sit over the keyboard and the submit button.
    <AppShell keyboardAware hideBottomNav scrollRef={scrollRef} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}>
      <SeoHead title="Contact · FarmsClub" description="Send Formulate India's trade desk a bulk sourcing requirement for plants, seeds, pots, tools, or soil & fertiliser." />
      
      <View style={{ marginBottom: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Badge label="Trade Desk" tone="brand" />
          <Badge label="Direct Sourcing" tone="accent" />
        </View>

        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, lineHeight: 32 }}>
          Talk to our Wholesale Trade Desk
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, maxWidth: 520, lineHeight: 21 }}>
          Not sure which listing fits your commercial requirement, or sourcing something custom that isn't listed yet?
          Submit your requirement below — our trade desk prepares customized quotes with freight estimates.
        </Text>

        {/* Direct channels cards */}
        {hasDirect ? (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Direct Channels {contact?.hoursLabel ? `(${contact.hoursLabel})` : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {waUrl ? (
                <Link href={waUrl} target="_blank" rel="noopener noreferrer" asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13 }}>💬</Text>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.brand }}>
                      WhatsApp {contact?.whatsappNumber}
                    </Text>
                  </Pressable>
                </Link>
              ) : null}

              {phoneUrl ? (
                <Link href={phoneUrl} asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13 }}>📞</Text>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>
                      Call {contact?.phone}
                    </Text>
                  </Pressable>
                </Link>
              ) : null}

              {contact?.supportEmail ? (
                <Link href={`mailto:${contact.supportEmail}`} asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13 }}>✉️</Text>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>
                      {contact.supportEmail}
                    </Text>
                  </Pressable>
                </Link>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.xl,
          shadowColor: "#111C15",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <RfqFormBody listing={null} listingId={null} scrollRef={scrollRef} />
      </View>
    </AppShell>
  );
}
