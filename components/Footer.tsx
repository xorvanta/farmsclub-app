import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { CATEGORIES } from "@/constants/categories";
import { Logo } from "@/components/Logo";

const YEAR = new Date().getFullYear();

export function Footer() {
  const { colors, fonts, spacing } = useTheme();
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

      <View style={[styles.bottomBar, { borderTopColor: "rgba(255,255,255,0.15)", marginTop: spacing.xl, paddingTop: spacing.lg }]}>
        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>
          © {YEAR} Formulate India. All rights reserved.
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
  bottomBar: { borderTopWidth: 1 },
});
