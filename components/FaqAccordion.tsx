import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { b2bApi } from "@/lib/api";
import type { B2bFaq } from "@/lib/types";

// Admin FAQ answers may contain basic HTML (<a href> links, per the admin form's own hint) —
// RN Text can't render markup, so strip tags rather than show literal "<a href=...>" text.
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Real, admin-managed FAQ content (see B2bFaqService, /admin/faqs B2B tab) — same role as the
 *  retail storefront's FAQ accordion, separate content/audience. Used on Home (above the
 *  footer) and the dedicated /faqs page. */
export function FaqAccordion({ limit }: { limit?: number }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const [faqs, setFaqs] = useState<B2bFaq[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    b2bApi
      .getFaqs()
      .then((data) => {
        if (!cancelled) setFaqs(limit ? data.slice(0, limit) : data);
      })
      .catch(() => {
        if (!cancelled) setFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (!faqs || faqs.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <Pressable
            key={faq.id}
            onPress={() => setOpenId(isOpen ? null : faq.id)}
            style={[
              {
                backgroundColor: isOpen ? colors.surface : colors.paper,
                borderColor: isOpen ? colors.brand : colors.border,
                borderRadius: radius.md,
                borderWidth: 1,
                padding: spacing.md,
              },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 13.5, color: colors.ink }}>{faq.question}</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: isOpen ? colors.brand : colors.inkFaint }}>
                {isOpen ? "–" : "+"}
              </Text>
            </View>
            {isOpen && (
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 8, lineHeight: 18 }}>
                {stripHtml(faq.answer)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
