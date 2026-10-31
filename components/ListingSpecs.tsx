import { useState, type ReactNode } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { listingUnit, propagationLabel } from "@/lib/listing";
import type { B2bListing } from "@/lib/types";

// Trailing unit tokens in a spec key, and how they read in a label.
const UNIT_SUFFIXES: Record<string, string> = {
  mm: "mm", cm: "cm", m: "m", km: "km", inch: "inch", inches: "inch", ft: "ft",
  g: "g", gm: "g", gms: "g", kg: "kg", mg: "mg", l: "L", ltr: "L", litre: "L", liter: "L", ml: "ml",
  pct: "%", percent: "%",
};

/** "pot_diameter_cm" / "potDiameterCm" → "Pot diameter (cm)"; "heightInches" → "Height (inch)". */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  let unit: string | null = null;
  if (words.length > 1 && UNIT_SUFFIXES[words[words.length - 1]]) unit = UNIT_SUFFIXES[words.pop() as string];
  const text = words.join(" ");
  const label = text.charAt(0).toUpperCase() + text.slice(1);
  return unit ? `${label} (${unit})` : label;
}

function formatValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    const parts = v.map(formatValue).filter((x): x is string => !!x);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof v === "object") return null; // nested objects aren't meaningful as a single row
  const s = String(v).trim();
  return s ? s : null;
}

/** specification is either a JSON-encoded object of category fields or plain text. */
export function parseSpecification(spec: string | null): { rows: { label: string; value: string }[]; text: string | null } {
  if (!spec || !spec.trim()) return { rows: [], text: null };
  const trimmed = spec.trim();
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const rows = Object.entries(obj as Record<string, unknown>)
          .map(([k, v]) => ({ label: humanizeKey(k), value: formatValue(v) }))
          .filter((r): r is { label: string; value: string } => r.value != null);
        return { rows, text: null };
      }
    } catch {
      // not JSON — fall through to plain text
    }
  }
  return { rows: [], text: trimmed };
}

/** Plain-text one-liner of the spec, for meta descriptions. */
export function specificationSummary(spec: string | null): string | null {
  const { rows, text } = parseSpecification(spec);
  if (text) return text;
  if (!rows.length) return null;
  return rows.map((r) => `${r.label}: ${r.value}`).join(", ");
}

/** Storefront §9.2 Visual Specification Matrix — renders primary agronomic parameters as visual bento tiles,
 *  followed by any additional custom specification rows or notes. */
export function SpecificationSection({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const isPhone = width < 560;
  const { rows: specRows, text } = parseSpecification(listing.specification);
  const fixed: { label: string; value: string | null | undefined; icon: string }[] = [
    { label: "Variety", value: listing.variety?.trim(), icon: "leaf" },
    { label: "Propagation", value: propagationLabel(listing.propagation), icon: "graft" },
    { label: "Plant Age", value: listing.age?.trim(), icon: "clock" },
    { label: "Sapling Height", value: listing.height?.trim(), icon: "ruler" },
    { label: "Bag / Pot Size", value: listing.bag_size?.trim(), icon: "bag" },
    { label: "Trade Unit", value: listingUnit(listing), icon: "box" },
    { label: "Brand / Nursery", value: listing.manufacturer_brand?.trim(), icon: "shield" },
  ];
  const fixedLabels = new Set(fixed.map((f) => f.label.toLowerCase()));
  const filledFixed = fixed.filter((r): r is { label: string; value: string; icon: string } => !!r.value);
  const extraRows = specRows.filter((r) => !fixedLabels.has(r.label.toLowerCase()) && !["age", "height", "bag/pot size", "unit", "brand"].includes(r.label.toLowerCase()));

  if (!filledFixed.length && !extraRows.length && !text) return null;

  return (
    <View style={{ gap: isPhone ? 10 : spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: isPhone ? 15.5 : 16.5, color: colors.ink }}>
          Lot Specifications & Grading
        </Text>
      </View>

      {/* Visual Bento Grid for Primary Specs */}
      {filledFixed.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isPhone ? 8 : spacing.sm }}>
          {filledFixed.map((item) => (
            <View
              key={item.label}
              style={{
                flexGrow: 1,
                flexBasis: "45%",
                minWidth: 130,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: isPhone ? 10 : spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: isPhone ? 8 : 10,
              }}
            >
              <View
                style={{
                  width: isPhone ? 30 : 36,
                  height: isPhone ? 30 : 36,
                  borderRadius: 9,
                  backgroundColor: colors.brandSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SpecGlyph kind={item.icon} color={colors.brand} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.3, color: colors.inkFaint }}>
                  {item.label}
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: isPhone ? 13 : 14, lineHeight: isPhone ? 17 : 19, color: colors.ink, marginTop: 1 }}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Extra Custom Spec Rows */}
      {extraRows.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          {extraRows.map((r, i) => (
            <View
              key={`${r.label}-${i}`}
              style={[
                styles.row,
                {
                  paddingHorizontal: spacing.md + 2,
                  backgroundColor: i % 2 === 1 ? colors.paper : colors.surface,
                },
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Text style={{ flex: 1, minWidth: 0, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>{r.label}</Text>
              <Text style={{ flex: 1.4, minWidth: 0, fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink, textAlign: "right" }}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}

      {text ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SpecGlyph({ kind, color }: { kind: string; color: string }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "leaf":
      return (
        <Svg {...p}>
          <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <Path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </Svg>
      );
    case "graft":
      return (
        <Svg {...p}>
          <Path d="M12 22v-9" />
          <Path d="M12 13 7 8" />
          <Path d="M12 10l5-5" />
          <Circle cx={7} cy={6} r={2} />
          <Circle cx={17} cy={4} r={2} />
        </Svg>
      );
    case "clock":
      return (
        <Svg {...p}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v5l3 3" />
        </Svg>
      );
    case "ruler":
      return (
        <Svg {...p}>
          <Path d="M12 3v18" />
          <Path d="m8 7 4-4 4 4" />
          <Path d="m8 17 4 4 4-4" />
        </Svg>
      );
    case "bag":
      return (
        <Svg {...p}>
          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <Path d="M3 6h18" />
        </Svg>
      );
    default:
      return (
        <Svg {...p}>
          <Rect x={3} y={3} width={18} height={18} rx={3} />
          <Path d="m9 12 2 2 4-4" />
        </Svg>
      );
  }
}

/** Main image plus a thumbnail strip when there's more than one image. */
export function ImageGallery({
  images,
  fallback,
  aspectRatio,
  maxHeight,
  alt,
}: {
  images: string[];
  fallback: ReactNode;
  aspectRatio: number;
  maxHeight?: number;
  alt?: string;
}) {
  const { colors, fonts, radius, spacing } = useTheme();
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  return (
    <View>
      <View
        style={{
          aspectRatio,
          maxHeight,
          width: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#081E12",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        {current ? <Image source={{ uri: current }} style={styles.image} resizeMode="cover" alt={alt ? `${alt} — photo ${active + 1} of ${images.length}` : ""} /> : fallback}

        {/* Floating B2B Quality Stamp & Photo Counter */}
        <View style={{ position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <View style={{ backgroundColor: "rgba(8,30,18,0.82)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(229,180,98,0.4)" }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, color: "#E5B462" }}>
              ✓ QUALITY GRADED STOCK
            </Text>
          </View>
          {images.length > 1 ? (
            <View style={{ backgroundColor: "rgba(8,30,18,0.78)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill }}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF" }}>
                {active + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}
        >
          {images.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => setActive(i)}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${i + 1} of ${images.length}`}
              accessibilityState={{ selected: i === active }}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: i === active ? colors.brand : colors.border,
                opacity: i === active ? 1 : 0.72,
              }}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="cover" alt="" accessible={false} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  image: { width: "100%", height: "100%" },
});
