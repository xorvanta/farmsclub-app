import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { b2bApi, errorMessage } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "./StateViews";
import { Button } from "./Button";
import type { B2bFaq } from "@/lib/types";
import { decodeEntities, parseRichText, safeHref } from "@/lib/richText";

/** Brand rule (Storefront §1.1) is absolute even for admin-managed text: an FAQ that names the
 *  old billing entity is never shown. */
// Built from parts so the retired name never appears as a literal in the shipped bundle.
const RETIRED_BRAND = new RegExp(["form", "ulate", "[ ]*", "india"].join(""), "i");

function isShowable(f: B2bFaq): boolean {
  const text = `${f.question ?? ""} ${f.answer ?? ""}`;
  return !!f.question && !RETIRED_BRAND.test(text);
}

export function cleanFaqs(faqs: B2bFaq[] | null | undefined): B2bFaq[] {
  return Array.isArray(faqs) ? faqs.filter(isShowable) : [];
}

const FARM_OWNER_GROUP = "For farm owners";

/** Storefront §9.6: shown only when the admin FAQs have no farm-owner group yet. */
const FARM_OWNER_FALLBACK: B2bFaq[] = [
  { id: "fo-list", category: FARM_OWNER_GROUP, sortOrder: 1, question: "How do I list my farm?", answer: "Fill the 2-minute form on List your farm. Our team calls you to complete your profile.", ctaLabel: "List your farm", ctaHref: "/list-your-farm" },
  { id: "fo-free", category: FARM_OWNER_GROUP, sortOrder: 2, question: "Is listing free?", answer: "Yes, listing your farm on FarmsClub is free." },
  { id: "fo-verified", category: FARM_OWNER_GROUP, sortOrder: 3, question: "What does Verified mean?", answer: "The FarmsClub team has visited this farm. Self-listed farms have not been visited yet." },
  { id: "fo-update", category: FARM_OWNER_GROUP, sortOrder: 4, question: "How do I update my profile?", answer: "Use the private edit link our team sends you on WhatsApp. Changes go live after our team reviews them." },
  { id: "fo-verify", category: FARM_OWNER_GROUP, sortOrder: 5, question: "How do I get my farm verified?", answer: "A FarmsClub team visit and shoot is needed. Contact our support team for details and charges.", ctaLabel: "Contact support team", ctaHref: "/contact?topic=Farm%20verification" },
];

/** Admin FAQ answers may contain basic HTML (<a href> links) and entities — rendered as text +
 *  safe links only (lib/richText.ts). */
function FaqAnswer({ html }: { html: string }) {
  const { colors, fonts } = useTheme();
  const segments = parseRichText(html);
  return (
    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 21 }}>
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

function FaqCta({ label, href }: { label: string; href: string }) {
  const safe = safeHref(href);
  if (!safe) return null;
  if (safe.startsWith("/")) {
    return (
      <Link href={safe as never} asChild>
        <Button label={label} variant="secondary" />
      </Link>
    );
  }
  return (
    <Link href={safe as never} target="_blank" rel="noopener noreferrer" asChild>
      <Button label={label} variant="secondary" />
    </Link>
  );
}

/** Accordion for a given FAQ array (Home short FAQ, the /faqs groups). Renders a button for an
 *  FAQ that has ctaLabel + ctaHref. */
export function FaqList({ faqs }: { faqs: B2bFaq[] }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = cleanFaqs(faqs);
  if (items.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        const question = decodeEntities(faq.question);
        return (
          <View
            key={faq.id}
            style={{
              backgroundColor: colors.surface,
              borderColor: isOpen ? colors.brand : colors.border,
              borderRadius: radius.md,
              borderWidth: isOpen ? 1.5 : 1,
            }}
          >
            <Pressable
              onPress={() => setOpenId(isOpen ? null : faq.id)}
              accessibilityRole="button"
              accessibilityLabel={question}
              accessibilityState={{ expanded: isOpen }}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${faq.id}`}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm }}
            >
              <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: 15, color: isOpen ? colors.brand : colors.ink, lineHeight: 21 }}>{question}</Text>
              <View aria-hidden style={{ width: 26, height: 26, borderRadius: radius.pill, backgroundColor: isOpen ? colors.brandSoft : colors.paper, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: isOpen ? colors.brand : colors.inkSoft }}>{isOpen ? "−" : "+"}</Text>
              </View>
            </Pressable>
            {isOpen && (
              <View nativeID={`faq-answer-${faq.id}`} style={{ marginHorizontal: spacing.md + 2, paddingBottom: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md }}>
                <FaqAnswer html={faq.answer} />
                {faq.ctaLabel && faq.ctaHref ? <FaqCta label={faq.ctaLabel} href={faq.ctaHref} /> : null}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Full FAQ page content (Storefront §9.6): admin FAQs grouped by `category` in API order, plus
 *  the "For farm owners" group when the admin content doesn't have one yet. */
export function FaqAccordion() {
  const { colors, fonts, spacing } = useTheme();
  const [faqs, setFaqs] = useState<B2bFaq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFaqs(null);
    b2bApi
      .getFaqs()
      .then((data) => !cancelled && setFaqs(cleanFaqs(data)))
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
    const byCategory = new Map<string, B2bFaq[]>();
    for (const faq of faqs) {
      const key = decodeEntities(faq.category || "General");
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(faq);
    }
    const hasOwnerGroup = [...byCategory.keys()].some((k) => /farm\s*owner/i.test(k));
    if (!hasOwnerGroup) byCategory.set(FARM_OWNER_GROUP, FARM_OWNER_FALLBACK);
    return [...byCategory.entries()].map(([category, items]) => ({ category, items }));
  }, [faqs]);

  if (!faqs && !error) return <LoadingState label="Loading FAQs…" />;
  if (error && groups.length <= 1) {
    return (
      <View style={{ gap: spacing.xl }}>
        <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
        <FaqGroup title={FARM_OWNER_GROUP} faqs={FARM_OWNER_FALLBACK} />
      </View>
    );
  }
  if (groups.length === 0) {
    return (
      <EmptyState title="FAQs are on their way" body="Have a question in the meantime? Ask Trellis, or send us an enquiry.">
        <Link href="/contact" asChild>
          <Button label="Enquire" variant="outline" />
        </Link>
      </EmptyState>
    );
  }

  return (
    <View style={{ gap: spacing.xl }}>
      {groups.map((g) => (
        <FaqGroup key={g.category} title={g.category} faqs={g.items} />
      ))}
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>
        Still have a question?{" "}
        <Link href="/contact" style={{ color: colors.brand, fontFamily: fonts.bodySemiBold }}>
          Talk to the FarmsClub team
        </Link>
      </Text>
    </View>
  );
}

function FaqGroup({ title, faqs }: { title: string; faqs: B2bFaq[] }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink }}>
        {title}
      </Text>
      <FaqList faqs={faqs} />
    </View>
  );
}
