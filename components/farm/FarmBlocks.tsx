import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { Photo } from "@/components/Photo";
import { Tag } from "@/components/Tag";
import type { FarmFactKey, FarmProfile } from "@/lib/types";

const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

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

export function factRows(facts: FarmProfile["facts"] | null | undefined): { key: FarmFactKey; label: string; value: string }[] {
  if (!facts) return [];
  const rows: { key: FarmFactKey; label: string; value: string }[] = [];
  for (const { key, label } of FACT_LABELS) {
    let v = clean(facts[key]);
    if (!v) continue;
    if (key === "total_land" && /^\d+(\.\d+)?$/.test(v)) v = `${v} ${Number(v) === 1 ? "acre" : "acres"}`;
    rows.push({ key, label, value: v });
  }
  return rows;
}

export function Block({ title, children, nativeID }: { title: string; children: React.ReactNode; nativeID?: string }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View nativeID={nativeID} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 6, height: 18, borderRadius: 3, backgroundColor: colors.accent }} />
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: 21, color: colors.ink, lineHeight: 27 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Block 3 — key facts as icon-backed visual bento tiles. */
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
            minWidth: 135,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
            <FactGlyph factKey={r.key} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.inkFaint }}>{r.label}</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, lineHeight: 19, marginTop: 1 }}>{r.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FactGlyph({ kind, color, factKey }: { kind?: string; factKey: FarmFactKey; color: string }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (factKey) {
    case "total_land":
      return (
        <Svg {...p}>
          <Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
          <Path d="M9 3v15" />
          <Path d="M15 6v15" />
        </Svg>
      );
    case "established_year":
      return (
        <Svg {...p}>
          <Rect x={3} y={4} width={18} height={18} rx={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
      );
    case "irrigation":
      return (
        <Svg {...p}>
          <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </Svg>
      );
    default:
      return (
        <Svg {...p}>
          <Path d="M12 20v-8" />
          <Path d="M12 13c0-3.5 2.5-6 6.5-6.5-.5 4-3 6.5-6.5 6.5Z" />
          <Path d="M12 15c0-3-2-5-5.5-5.5.5 3.3 2.5 5.5 5.5 5.5Z" />
        </Svg>
      );
  }
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.lg,
            padding: spacing.md,
          }}
        >
          {ownerPhoto ? (
            <Photo uri={ownerPhoto} alt={ownerName ?? "Farm owner"} style={{ width: 68, height: 68, borderRadius: 34 }} sizes="68px" />
          ) : null}
          <View style={{ flex: 1, gap: 3 }}>
            {ownerName ? <Text style={{ fontFamily: fonts.heading, fontSize: 16.5, color: colors.ink }}>{ownerName}</Text> : null}
            {ownerRole ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.brand }}>{ownerRole}</Text> : null}
            {languages.length ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>Speaks: {languages.join(", ")}</Text> : null}
          </View>
        </View>
      ) : null}
      {quote ? (
        <LinearGradient
          colors={["#081E12", "#123824"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: "#E5B462",
          }}
        >
          <Text style={{ fontFamily: fonts.headingMedium, fontSize: 17, fontStyle: "italic", color: "#FFFFFF", lineHeight: 26 }}>“{quote}”</Text>
          {ownerName ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: "#E5B462", marginTop: 8 }}>— {ownerName}</Text> : null}
        </LinearGradient>
      ) : null}
      {advice ? (
        <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: "rgba(18,56,36,0.14)" }}>
          <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.brand }}>
            🌱 Advice for new farmers
          </Text>
          <Paragraphs text={advice} size={14.5} />
        </View>
      ) : null}
    </Block>
  );
}

/** Block 5 — what they grow, with a visual 12-Month Harvest Calendar strip. */
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
          const activeMonths = new Set(Array.isArray(g.harvest_months) ? g.harvest_months.map(Number) : []);
          const photo = clean(g.photo_url);
          return (
            <View
              key={i}
              style={{
                width: cardW,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                overflow: "hidden",
              }}
            >
              {photo ? <Photo uri={photo} alt={[crop, clean(g.variety)].filter(Boolean).join(" — ") || farm.name} style={{ width: "100%", aspectRatio: 4 / 3 }} /> : null}
              <View style={{ padding: spacing.md, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                  {crop ? <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{crop}</Text> : null}
                  {clean(g.area_or_count) ? <Tag label={clean(g.area_or_count)!} tone="brand" /> : null}
                </View>

                {clean(g.variety) ? (
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkSoft }}>
                    Variety: <Text style={{ color: colors.ink }}>{clean(g.variety)}</Text>
                  </Text>
                ) : null}

                {/* Visual 12-Month Harvest Season Bar */}
                {months ? (
                  <View style={{ gap: 4, marginTop: 2 }}>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.inkSoft }}>
                      Harvest: {months}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 2 }} aria-hidden>
                      {MONTH_SHORT.map((mLabel, mIdx) => {
                        const isHarvest = activeMonths.has(mIdx + 1);
                        return (
                          <View
                            key={mIdx}
                            style={{
                              flex: 1,
                              height: 18,
                              borderRadius: 3,
                              backgroundColor: isHarvest ? colors.brand : colors.paper,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9, color: isHarvest ? "#E5B462" : colors.inkFaint }}>
                              {mLabel}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {clean(g.note) ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 20, marginTop: 2 }}>{clean(g.note)}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Block>
  );
}

function MentionList({ title, items }: { title: string; items: { name: string | null; description: string | null }[] }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const rows = items.filter((s) => clean(s.name));
  if (!rows.length) return null;
  return (
    <Block title={title}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {rows.map((s, i) => (
          <View
            key={i}
            style={{
              flexGrow: 1,
              flexBasis: 240,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink }}>{clean(s.name)}</Text>
            {clean(s.description) ? <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 }}>{clean(s.description)}</Text> : null}
          </View>
        ))}
      </View>
    </Block>
  );
}

export function ServicesBlock({ farm }: { farm: FarmProfile }) {
  return <MentionList title="Services offered" items={(farm.services ?? []).map((s) => ({ name: s.name, description: s.description }))} />;
}

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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text accessibilityRole="header" aria-level={3} style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>
                On-site training
              </Text>
              <Tag label="Field Practical" tone="brand" />
            </View>
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
