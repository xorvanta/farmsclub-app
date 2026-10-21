import { Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Photo } from "@/components/Photo";
import { Tag } from "@/components/Tag";
import type { FarmFactKey, FarmProfile } from "@/lib/types";

/** Pieces of the farm profile (Storefront §6). Each returns null when it has nothing to show. */

const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** [1, 2, 3] → "Jan, Feb, Mar". Invalid entries dropped. */
export function monthsLabel(months: unknown): string | null {
  if (!Array.isArray(months)) return null;
  const names = [...new Set(months.map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))]
    .sort((a, b) => a - b)
    .map((m) => MONTHS[m - 1]);
  return names.length ? names.join(", ") : null;
}

const FACT_LABELS: { key: FarmFactKey; label: string }[] = [
  { key: "total_land", label: "Total land" },
  { key: "established_year", label: "Established" },
  { key: "soil_type", label: "Soil" },
  { key: "irrigation", label: "Irrigation" },
  { key: "farming_method", label: "Farming method" },
  { key: "annual_production", label: "Annual production" },
  { key: "mother_plant_stock", label: "Mother plant stock" },
  { key: "workforce_size", label: "Workforce" },
  { key: "main_markets", label: "Main markets" },
  { key: "certifications", label: "Certifications" },
];

export function factRows(facts: FarmProfile["facts"] | null | undefined): { label: string; value: string }[] {
  if (!facts) return [];
  const rows: { label: string; value: string }[] = [];
  for (const { key, label } of FACT_LABELS) {
    let v = clean(facts[key]);
    if (!v) continue;
    if (key === "total_land" && /^\d+(\.\d+)?$/.test(v)) v = `${v} ${Number(v) === 1 ? "acre" : "acres"}`;
    rows.push({ label, value: v });
  }
  return rows;
}

export function Block({ title, children, nativeID }: { title: string; children: React.ReactNode; nativeID?: string }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View nativeID={nativeID} style={{ gap: spacing.md }}>
      <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 21, color: colors.ink, lineHeight: 27 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Block 3 — key facts as a wrap of small tiles. */
export function FactsRow({ facts, columns }: { facts: FarmProfile["facts"]; columns: number }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const rows = factRows(facts);
  if (!rows.length) return null;
  const basis = `${Math.floor(100 / columns) - 2}%` as const;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }} accessibilityLabel="Key facts">
      {rows.map((r) => (
        <View
          key={r.label}
          style={{
            flexBasis: basis,
            flexGrow: 1,
            minWidth: 130,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing.md,
            gap: 3,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.inkFaint }}>{r.label}</Text>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink, lineHeight: 20 }}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Paragraphs({ text, size = 15 }: { text: string; size?: number }) {
  const { colors, fonts, spacing } = useTheme();
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <View style={{ gap: spacing.md }}>
      {paras.map((p, i) => (
        <Text key={i} style={{ fontFamily: fonts.body, fontSize: size, color: colors.ink, lineHeight: size * 1.6 }}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/** Block 4 — short intro (lead), story, owner card, quote, advice. */
export function StoryBlock({ farm }: { farm: FarmProfile }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const intro = clean(farm.short_intro);
  const story = clean(farm.story);
  const quote = clean(farm.owner_quote);
  const advice = clean(farm.advice);
  const ownerName = clean(farm.owner?.name);
  const ownerRole = clean(farm.owner?.role);
  const ownerPhoto = clean(farm.owner?.photo_url);
  const languages = (farm.owner?.languages ?? []).map(clean).filter((l): l is string => !!l);
  const hasOwner = !!(ownerName || ownerPhoto);
  if (!intro && !story && !quote && !advice && !hasOwner) return null;

  return (
    <Block title="Our story">
      {intro ? <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink, lineHeight: 26 }}>{intro}</Text> : null}
      {story ? <Paragraphs text={story} /> : null}
      {hasOwner ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md }}>
          {ownerPhoto ? (
            <Photo uri={ownerPhoto} alt={ownerName ?? "Farm owner"} style={{ width: 64, height: 64, borderRadius: 32 }} sizes="64px" />
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {ownerName ? <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{ownerName}</Text> : null}
            {ownerRole ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft }}>{ownerRole}</Text> : null}
            {languages.length ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>Speaks: {languages.join(", ")}</Text> : null}
          </View>
        </View>
      ) : null}
      {quote ? (
        <View style={{ borderLeftWidth: 4, borderLeftColor: colors.accent, paddingLeft: spacing.lg, paddingVertical: spacing.xs }}>
          <Text style={{ fontFamily: fonts.headingMedium, fontSize: 17, fontStyle: "italic", color: colors.ink, lineHeight: 26 }}>“{quote}”</Text>
          {ownerName ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft, marginTop: 6 }}>— {ownerName}</Text> : null}
        </View>
      ) : null}
      {advice ? (
        <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }}>
          <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.brand }}>
            Advice for new farmers
          </Text>
          <Paragraphs text={advice} size={14.5} />
        </View>
      ) : null}
    </Block>
  );
}

/** Block 5 — what they grow. Mention only: no price, no buy button. */
export function GrownBlock({ farm, width }: { farm: FarmProfile; width: number }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const rows = (farm.grown ?? []).filter((g) => clean(g.crop) || clean(g.variety) || clean(g.note));
  if (!rows.length) return null;
  const cols = width >= 900 ? 3 : width >= 560 ? 2 : 1;
  const gap = spacing.md;
  const cardW = Math.floor((width - gap * (cols - 1)) / cols);
  return (
    <Block title="What we grow">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {rows.map((g, i) => {
          const crop = clean(g.crop);
          const months = monthsLabel(g.harvest_months);
          const photo = clean(g.photo_url);
          return (
            <View key={i} style={{ width: cardW, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" }}>
              {photo ? <Photo uri={photo} alt={[crop, clean(g.variety)].filter(Boolean).join(" — ") || farm.name} style={{ width: "100%", aspectRatio: 4 / 3 }} /> : null}
              <View style={{ padding: spacing.md, gap: 4 }}>
                {crop ? <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{crop}</Text> : null}
                {clean(g.variety) ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.inkSoft }}>Variety: {clean(g.variety)}</Text> : null}
                {clean(g.area_or_count) ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft }}>{clean(g.area_or_count)}</Text> : null}
                {months ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft }}>Harvest: {months}</Text> : null}
                {clean(g.note) ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20, marginTop: 2 }}>{clean(g.note)}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Block>
  );
}

/** A simple name + one-line description list (services, farm products). */
function MentionList({ title, items }: { title: string; items: { name: string | null; description: string | null }[] }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const rows = items.filter((s) => clean(s.name));
  if (!rows.length) return null;
  return (
    <Block title={title}>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg }}>
        {rows.map((s, i) => (
          <View key={i} style={{ padding: spacing.md, gap: 2, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink }}>{clean(s.name)}</Text>
            {clean(s.description) ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 }}>{clean(s.description)}</Text> : null}
          </View>
        ))}
      </View>
    </Block>
  );
}

/** Block 6 — services offered (mention only). */
export function ServicesBlock({ farm }: { farm: FarmProfile }) {
  return <MentionList title="Services offered" items={(farm.services ?? []).map((s) => ({ name: s.name, description: s.description }))} />;
}

/** Block 8 — farm products (the API only returns them when admin has turned them on). */
export function ProductsBlock({ farm }: { farm: FarmProfile }) {
  return <MentionList title="Farm products" items={(farm.products ?? []).map((p) => ({ name: p.name, description: p.note }))} />;
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  const { colors, fonts } = useTheme();
  if (!value) return null;
  return (
    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.inkSoft }}>{label}: </Text>
      {value}
    </Text>
  );
}

/** Block 7 — on-site training and online course. Mention only: no book/buy buttons. */
export function TrainingBlock({ farm }: { farm: FarmProfile }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const onsite = farm.training?.onsite ?? null;
  const course = farm.training?.course ?? null;
  const courseTitle = clean(course?.title);
  if (!onsite && !(course && (courseTitle || clean(course.language)))) return null;
  const card = { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 6, flexGrow: 1, flexBasis: 260 } as const;
  return (
    <Block title="Training & courses">
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {onsite ? (
          <View style={card}>
            <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>
              On-site training
            </Text>
            <DetailLine label="Duration" value={clean(onsite.duration)} />
            <DetailLine label="Topics" value={clean(onsite.topics)} />
            <DetailLine label="Language" value={clean(onsite.language)} />
            <DetailLine label="Batch size" value={clean(onsite.batch_size)} />
            <DetailLine label="Fee" value={clean(onsite.fee_text)} />
            <DetailLine label="Months" value={monthsLabel(onsite.months)} />
          </View>
        ) : null}
        {course && (courseTitle || clean(course.language)) ? (
          <View style={card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
              <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>
                Online course
              </Text>
              <Tag label="Coming soon" tone="accent" />
            </View>
            {courseTitle ? <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink }}>{courseTitle}</Text> : null}
            <DetailLine label="Language" value={clean(course.language)} />
          </View>
        ) : null}
      </View>
    </Block>
  );
}
