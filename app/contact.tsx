import { useRef } from "react";
import { View, Text, Pressable, type ScrollView } from "react-native";
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
 *  - `product` — the name of a listing that is not available (→ "What are you looking to source?")
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
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 44,
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.brand }}>{label}</Text>
      </Pressable>
    </Link>
  );

  return (
    // No bottom nav on the form: it would sit over the keyboard and the submit button.
    <AppShell
      keyboardAware
      hideBottomNav
      hideChatFab
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
    >
      <SeoHead
        title="Enquire · FarmsClub"
        description="Talk to the FarmsClub team about bulk planting material, a farm on FarmsClub, or getting your own farm verified."
      />

      <View style={{ marginBottom: spacing.xl, gap: spacing.sm }}>
        {topic ? <Tag label={topic} tone="brand" /> : null}
        <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, lineHeight: 32 }}>
          Talk to the FarmsClub team
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, maxWidth: 540, lineHeight: 21 }}>
          Tell us what you need — planting material in bulk, something not listed yet, or a question about a farm. Our team gets back to you.
        </Text>

        {hasDirect ? (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Reach us directly{contact?.hoursLabel ? ` (${contact.hoursLabel})` : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {waUrl ? channel(waUrl, `WhatsApp ${contact?.whatsappNumber}`, true) : null}
              {phoneUrl ? channel(phoneUrl, `Call ${contact?.phone}`) : null}
              {contact?.supportEmail ? channel(`mailto:${contact.supportEmail}`, contact.supportEmail) : null}
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
        }}
      >
        {/* key: a different prefill (navigating between topics) starts a fresh form. */}
        <RfqFormBody key={initialNotes} listing={null} listingId={null} scrollRef={scrollRef} initialNotes={initialNotes || undefined} />
      </View>
    </AppShell>
  );
}
