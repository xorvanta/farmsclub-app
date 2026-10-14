import { useEffect, useState } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link, type Href } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { CATEGORIES } from "@/constants/categories";
import { Logo } from "@/components/Logo";
import { TrustBadges } from "@/components/TrustBadges";
import { b2bApi } from "@/lib/api";
import type { B2bBillingEntity } from "@/lib/types";
import { useB2bContact, telUrl, whatsappUrl } from "@/constants/contact";

const YEAR = new Date().getFullYear();

/** "Address line, City" + ", State" — the state only when the address doesn't already end with
 *  (or contain) it, so an admin who typed the full address doesn't see the state twice. */
export function formatRegisteredAddress(address: string | null | undefined, state: string | null | undefined): string | null {
  const a = address?.trim() || "";
  const st = state?.trim() || "";
  if (!a) return null;
  if (!st || a.toLowerCase().includes(st.toLowerCase())) return a;
  return `${a}, ${st}`;
}

export function Footer() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const stacked = width < 680;
  const [billingEntity, setBillingEntity] = useState<B2bBillingEntity | null>(null);
  const contact = useB2bContact();
  const waUrl = contact?.whatsappNumber ? whatsappUrl(contact.whatsappNumber) : null;
  const phoneUrl = contact?.phone ? telUrl(contact.phone) : null;
  const address = formatRegisteredAddress(billingEntity?.registeredAddress, billingEntity?.state);
  const contactTextStyle = { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: "rgba(255,255,255,0.85)" } as const;

  useEffect(() => {
    let cancelled = false;
    b2bApi
      .getBillingEntity()
      .then((data) => {
        if (!cancelled) setBillingEntity(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.brand, paddingHorizontal: spacing.lg }]}>
      <View style={[styles.columns, stacked && styles.columnsStacked]}>
        <View style={[stacked ? styles.fullWidth : styles.brandBlock, { gap: 12 }]}>
          <Logo size={19} onDark />
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 18, maxWidth: 280 }}>
            Formulate India's B2B wholesale trade platform for plants, seeds, pots, tools, and
            soil &amp; fertiliser — sourced from nurseries and suppliers across India.
          </Text>

          {/* Only what an admin has actually configured (B2B Console > Settings) — nothing else. */}
          {contact && (waUrl || phoneUrl || contact.supportEmail || contact.hoursLabel) ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              {waUrl ? (
                <Link href={waUrl} target="_blank" rel="noopener noreferrer" style={contactTextStyle}>
                  WhatsApp: {contact.whatsappNumber}
                </Link>
              ) : null}
              {phoneUrl ? (
                <Link href={phoneUrl} style={contactTextStyle}>
                  Phone: {contact.phone}
                </Link>
              ) : null}
              {contact.supportEmail ? (
                <Link href={`mailto:${contact.supportEmail}`} style={contactTextStyle}>
                  {contact.supportEmail}
                </Link>
              ) : null}
              {contact.hoursLabel ? (
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Trade desk: {contact.hoursLabel}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={stacked ? styles.fullWidth : styles.columnBlock}>
          <FooterColumn
            title="Catalogue"
            links={CATEGORIES.map((c) => ({ label: c.label, href: { pathname: "/listings", params: { category: c.value } } }))}
          />
        </View>
        <View style={stacked ? styles.fullWidth : styles.columnBlock}>
          <FooterColumn
            title="Company"
            links={[
              { label: "How it works", href: "/about" },
              { label: "FAQs", href: "/faqs" },
              { label: "Enquire / contact us", href: "/contact" },
            ]}
          />
        </View>
        <View style={stacked ? styles.fullWidth : styles.columnBlock}>
          <FooterColumn
            title="Legal"
            links={[
              { label: "Terms of trade", href: "/terms" },
              { label: "Privacy policy", href: "/privacy" },
            ]}
          />
        </View>
      </View>

      {/* Registered entity + "Why FarmsClub" trust card — real policies/facts, not marketing
          filler. The entity name/address come from the same admin-editable Billing Entity
          record B2B invoices use (Admin > B2B Console > Billing Entity) — never hardcoded here,
          so an admin updating it there updates this footer too. */}
      <View style={[styles.lowerRow, stacked && styles.lowerRowStacked]}>
        <View style={[stacked ? styles.fullWidth : styles.addressBlock, { gap: 4 }]}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
            Registered entity
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 18, marginTop: 2 }}>
            {billingEntity?.legalName ?? "Formulate India"}
            {address ? `\n${address}` : ""}
          </Text>
        </View>

        <View
          style={[
            styles.trustCard,
            stacked ? styles.fullWidth : { flex: 1, maxWidth: 360 },
            { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", borderRadius: radius.lg, padding: spacing.lg },
          ]}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
            Why FarmsClub
          </Text>
          <TrustBadges variant="list" />
        </View>
      </View>

      <View style={[styles.bottomBar, { borderTopColor: "rgba(255,255,255,0.15)", marginTop: spacing.xl, paddingTop: spacing.lg }]}>
        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>
          © {YEAR} {billingEntity?.legalName ?? "Formulate India"}, a Xorvanta Technologies venture. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: Href }[] }) {
  const { fonts, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
        {title}
      </Text>
      {links.map((l) => (
        <Link key={l.label} href={l.href} style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.85)", paddingVertical: 2 }}>
          {l.label}
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 40, paddingBottom: 28 },
  // Row (desktop) layout uses flex on each child; stacked (mobile) layout deliberately uses
  // width:"100%" instead of flex on every child (see fullWidth) — flex:1 inside a column-
  // direction container with no fixed parent height is the kind of flexbox case that resolves
  // inconsistently across engines, and was the actual cause of the trust card rendering too
  // short (its 4th row spilling outside its own border) and uneven gaps between sections on
  // mobile. width:"100%" has no such ambiguity.
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 32 },
  columnsStacked: { flexDirection: "column", gap: 28 },
  brandBlock: { flex: 1.3 },
  columnBlock: { flex: 1, minWidth: 140 },
  fullWidth: { width: "100%" },
  lowerRow: { flexDirection: "row", gap: 32, marginTop: 36, paddingTop: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", alignItems: "flex-start" },
  lowerRowStacked: { flexDirection: "column", alignItems: "stretch", gap: 24 },
  addressBlock: { flex: 1 },
  trustCard: { borderWidth: 1 },
  bottomBar: { borderTopWidth: 1 },
});
