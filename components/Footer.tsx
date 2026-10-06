import { View, Text, Pressable, Linking, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { CATEGORIES } from "@/constants/categories";
import { Logo } from "@/components/Logo";
import { TrustBadges } from "@/components/TrustBadges";

const YEAR = new Date().getFullYear();
// Same real contact details already hardcoded in paudhewale-dashboard-frontend's
// StorefrontFooter.jsx — see AnnouncementBar.tsx for why these are hardcoded rather than fetched.
const WHATSAPP_NUMBER = "917969513372";
const SUPPORT_EMAIL = "help@paudhewale.com";

export function Footer() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const stacked = width < 680;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.brand, paddingHorizontal: spacing.lg }]}>
      <View style={[styles.columns, stacked && { flexDirection: "column", gap: spacing.xl }]}>
        <View style={{ flex: 1.3, gap: 12 }}>
          <Logo size={19} onDark />
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 18, maxWidth: 280 }}>
            Formulate India's B2B wholesale trade platform for plants, pots, tools, and
            soil &amp; fertiliser — sourced and delivered pan-India.
          </Text>

          <View style={{ gap: 6, marginTop: 4 }}>
            <Pressable onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)} hitSlop={4}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
                WhatsApp: +91 {WHATSAPP_NUMBER.slice(2, 7)} {WHATSAPP_NUMBER.slice(7)}
              </Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} hitSlop={4}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
        </View>

        <FooterColumn
          title="Catalogue"
          links={CATEGORIES.map((c) => ({ label: c.label, onPress: () => router.push({ pathname: "/listings", params: { category: c.value } }) }))}
        />
        <FooterColumn
          title="Company"
          links={[
            { label: "How sourcing works", onPress: () => router.push("/about") },
            { label: "FAQs", onPress: () => router.push("/faqs") },
            { label: "Enquire / contact us", onPress: () => router.push("/contact") },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { label: "Terms of trade", onPress: () => router.push("/terms") },
            { label: "Privacy policy", onPress: () => router.push("/privacy") },
          ]}
        />
      </View>

      {/* Registered address + "Why FarmsClub" trust card — real policies/facts, not marketing filler */}
      <View style={[styles.lowerRow, stacked && { flexDirection: "column" }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
            Registered office
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 18, marginTop: 2 }}>
            Xorvanta Technologies Pvt Ltd{"\n"}Agam Kuan, Patna, Bihar – 800007, India
          </Text>
        </View>

        <View
          style={[
            styles.trustCard,
            !stacked && { maxWidth: 360 },
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
          © {YEAR} Formulate India, a Xorvanta Technologies venture. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; onPress: () => void }[] }) {
  const { fonts, spacing } = useTheme();
  return (
    <View style={{ flex: 1, gap: spacing.sm, minWidth: 140 }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
        {title}
      </Text>
      {links.map((l) => (
        <Pressable key={l.label} onPress={l.onPress} hitSlop={4}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 40, paddingBottom: 28 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 32 },
  lowerRow: { flexDirection: "row", gap: 32, marginTop: 36, paddingTop: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", alignItems: "flex-start" },
  trustCard: { flex: 1, borderWidth: 1 },
  bottomBar: { borderTopWidth: 1 },
});
