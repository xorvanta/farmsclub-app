import { useEffect, useMemo, useState } from "react";
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
 *  retail storefront's FAQ accordion, separate content/audience.
 *
 *  Two modes, because the content set is now 100+ entries across 11 categories:
 *   - `limit` (Home teaser): one question per category up to the limit, so the teaser spans
 *     pricing/MOQ/RFQ/delivery/invoicing rather than showing the first N of whichever category
 *     happens to sort first.
 *   - full (/faqs): grouped under category headings. A flat 100-item list is unreadable,
 *     especially on a phone. */
export function FaqAccordion({ limit }: { limit?: number }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const [faqs, setFaqs] = useState<B2bFaq[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    b2bApi
      .getFaqs()
      .then((data) => {
        if (!cancelled) setFaqs(data);
      })
      .catch(() => {
        if (!cancelled) setFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    if (!faqs) return [];
    if (limit) {
      const seen = new Set<string>();
      const picked: B2bFaq[] = [];
      for (const faq of faqs) {
        if (seen.has(faq.category)) continue;
        seen.add(faq.category);
        picked.push(faq);
        if (picked.length >= limit) break;
      }
      // Fewer categories than the limit — top up in order so the teaser still fills out.
      if (picked.length < limit) {
        for (const faq of faqs) {
          if (picked.length >= limit) break;
          if (!picked.includes(faq)) picked.push(faq);
        }
      }
      return [{ category: null as string | null, items: picked }];
    }
    const byCategory = new Map<string, B2bFaq[]>();
    for (const faq of faqs) {
      const key = faq.category || "General";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(faq);
    }
    return [...byCategory.entries()].map(([category, items]) => ({ category, items }));
  }, [faqs, limit]);

  if (!faqs || faqs.length === 0) return null;

  return (
    <View style={{ gap: spacing.xl }}>
      {groups.map((group, groupIdx) => (
        <View key={group.category ?? `group-${groupIdx}`} style={{ gap: spacing.sm }}>
          {group.category && (
            <Text
              style={{
                fontFamily: fonts.bodySemiBold,
                fontSize: 11.5,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.inkFaint,
                marginBottom: 2,
              }}
            >
              {group.category}
            </Text>
          )}
          {group.items.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <Pressable
                key={faq.id}
                onPress={() => setOpenId(isOpen ? null : faq.id)}
                style={{
                  backgroundColor: isOpen ? colors.surface : colors.paper,
                  borderColor: isOpen ? colors.brand : colors.border,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  padding: spacing.md,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 13.5, color: colors.ink, lineHeight: 19 }}>
                    {faq.question}
                  </Text>
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
      ))}
    </View>
  );
}
