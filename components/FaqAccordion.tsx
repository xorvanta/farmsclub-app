import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { b2bApi, errorMessage } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "./StateViews";
import { Button } from "./Button";
import { Link } from "expo-router";
import type { B2bFaq } from "@/lib/types";
import { decodeEntities, parseRichText } from "@/lib/richText";

/** Admin FAQ answers may contain basic HTML (<a href> links, per the admin form's own hint) and
 *  HTML entities. Rendered as text + safe links only — see lib/richText.ts. */
function FaqAnswer({ html }: { html: string }) {
  const { colors, fonts } = useTheme();
  const segments = parseRichText(html);
  return (
    <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 8, lineHeight: 18 }}>
      {segments.map((seg, i) =>
        seg.href ? (
          <Link
            key={i}
            href={seg.href}
            {...(seg.href.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            style={{ color: colors.brand, textDecorationLine: "underline", fontFamily: fonts.bodyMedium }}
          >
            {seg.text}
          </Link>
        ) : (
          <Text key={i}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFaqs(null);
    b2bApi
      .getFaqs()
      .then((data) => {
        if (!cancelled) setFaqs(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setFaqs([]);
          setError(errorMessage(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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

  // Home teaser (`limit`) quietly disappears when there's nothing to show; the full /faqs page
  // always explains what's happening instead of rendering a blank page.
  if (limit) {
    if (!faqs || faqs.length === 0) return null;
  } else {
    if (error) return <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />;
    if (!faqs) return <LoadingState label="Loading FAQs…" />;
    if (faqs.length === 0) {
      return (
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <EmptyState title="FAQs are on their way" body="Have a question in the meantime? Ask Trellis in the chat, or send us an enquiry." />
          <Link href="/contact" asChild>
            <Button label="Contact our trade desk" variant="outline" />
          </Link>
        </View>
      );
    }
  }

  return (
    <View style={{ gap: spacing.xl }}>
      {groups.map((group, groupIdx) => (
        <View key={group.category ?? `group-${groupIdx}`} style={{ gap: spacing.sm }}>
          {group.category && (
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: fonts.bodySemiBold,
                fontSize: 11.5,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.inkFaint,
                marginBottom: 2,
              }}
            >
              {decodeEntities(group.category)}
            </Text>
          )}
          {group.items.map((faq) => {
            const isOpen = openId === faq.id;
            const question = decodeEntities(faq.question);
            return (
              <View
                key={faq.id}
                style={{
                  backgroundColor: isOpen ? colors.surface : colors.paper,
                  borderColor: isOpen ? colors.brand : colors.border,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  padding: spacing.md,
                }}
              >
                {/* The question row is the toggle (a button with expanded state); the answer sits
                    outside it so its links stay separately focusable and tappable. */}
                <Pressable
                  onPress={() => setOpenId(isOpen ? null : faq.id)}
                  accessibilityRole="button"
                  accessibilityLabel={question}
                  accessibilityState={{ expanded: isOpen }}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}
                >
                  <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 13.5, color: colors.ink, lineHeight: 19 }}>{question}</Text>
                  <Text aria-hidden style={{ fontFamily: fonts.heading, fontSize: 16, color: isOpen ? colors.brand : colors.inkSoft }}>
                    {isOpen ? "–" : "+"}
                  </Text>
                </Pressable>
                {isOpen && (
                  <View nativeID={`faq-answer-${faq.id}`}>
                    <FaqAnswer html={faq.answer} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
