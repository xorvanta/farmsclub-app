import { useRef } from "react";
import { View, Text, Pressable, type ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { Tag } from "@/components/Tag";
import { useB2bContact, telUrl, whatsappUrl } from "@/constants/contact";

function firstParam(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").trim().slice(0, 200);
}

/**
 * Enquire (Storefront §9.4). Prefill from the URL:
 *  - `product` — the name of a listing that is not available or a 3D Orchard Plan summary
 *  - `topic` (e.g. "Farm verification") + optional `farm` — from the farm pages / FAQs.
 */
export default function Contact() {
  const { fonts, colors, spacing, radius } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ product?: string; topic?: string; farm?: string }>();
  const product = firstParam(params.product);
  const topic = firstParam(params.topic);
  const farm = firstParam(params.farm);
  const initialNotes = product ? product : topic ? (farm ? `${topic} — ${farm}` : topic) : "";

  const contact = useB2bContact();
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  const phoneUrl = contact?.phone ? telUrl(contact.phone) : null;
  const hasDirect = !!(waUrl || phoneUrl || contact?.supportEmail);

  const channel = (href: string, label: string, external?: boolean) => (
    <Link href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} asChild>
      <Pressable
        style={{
          backgroundColor: "rgba(255,255,255,0.12)",
          borderColor: "rgba(229,180,98,0.4)",
          borderWidth: 1,
          borderRadius: radius.pill,
          paddingHorizontal: 14,
          minHeight: 40,
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: "#E5B462" }}>{label}</Text>
      </Pressable>
    </Link>
  );

  return (
    <AppShell
      keyboardAware
      hideBottomNav
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: "100%", alignSelf: "center" }}
    >
      <SeoHead
        title="Enquire · FarmsClub"
        description="Talk to the FarmsClub team about bulk planting material, a farm on FarmsClub, or getting your own farm verified."
      />

      <LinearGradient
        colors={["#071A10", "#123824", "#184A30"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginBottom: spacing.lg,
          borderRadius: radius.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: "rgba(229,180,98,0.35)",
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#52C388" }} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, color: "#E5B462", textTransform: "uppercase" }}>
            DIRECT B2B PROCUREMENT DESK
          </Text>
          {topic ? <Tag label={topic} tone="accent" /> : null}
        </View>

        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 28, color: "#FFFFFF", lineHeight: 34 }}>
          Talk to the FarmsClub team
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: "rgba(255,255,255,0.85)", maxWidth: 560, lineHeight: 21 }}>
          Tell us what you need — bulk saplings, custom varieties, railway dispatch quotes, or farm verification.
        </Text>

        {hasDirect ? (
          <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Reach us directly{contact?.hoursLabel ? ` (${contact.hoursLabel})` : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {waUrl ? channel(waUrl, `WhatsApp ${contact?.whatsappNumber}`, true) : null}
              {phoneUrl ? channel(phoneUrl, `Call ${contact?.phone}`) : null}
              {contact?.supportEmail ? channel(`mailto:${contact.supportEmail}`, contact.supportEmail) : null}
            </View>
          </View>
        ) : null}
      </LinearGradient>

      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.xl,
          padding: spacing.xl,
          shadowColor: "#081E12",
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        <RfqFormBody key={initialNotes} listing={null} listingId={null} scrollRef={scrollRef} initialNotes={initialNotes || undefined} />
      </View>
    </AppShell>
  );
}
