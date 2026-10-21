import { useState, type ReactNode } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
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

/** Storefront §9.2 specification table — only filled rows: Variety · Propagation · Age · Height ·
 *  Bag/pot size · Unit · then any other spec fields/text the listing carries. */
export function SpecificationSection({ listing }: { listing: B2bListing }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const { rows: specRows, text } = parseSpecification(listing.specification);
  const fixed: { label: string; value: string | null | undefined }[] = [
    { label: "Variety", value: listing.variety?.trim() },
    { label: "Propagation", value: propagationLabel(listing.propagation) },
    { label: "Age", value: listing.age?.trim() },
    { label: "Height", value: listing.height?.trim() },
    { label: "Bag/pot size", value: listing.bag_size?.trim() },
    { label: "Unit", value: listingUnit(listing) },
    { label: "Brand", value: listing.manufacturer_brand?.trim() },
  ];
  const fixedLabels = new Set(fixed.map((f) => f.label.toLowerCase()));
  const rows = [
    ...fixed.filter((r): r is { label: string; value: string } => !!r.value),
    ...specRows.filter((r) => !fixedLabels.has(r.label.toLowerCase())),
  ];
  if (!rows.length && !text) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 16.5, color: colors.ink }}>
        Specifications
      </Text>
      {rows.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            overflow: "hidden",
            backgroundColor: colors.surface,
            shadowColor: "#111C15",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 5,
            elevation: 1,
          }}
        >
          {rows.map((r, i) => (
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
              <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>{r.label}</Text>
              <Text style={{ flex: 1.4, fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink, textAlign: "right" }}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}
      {text ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 21 }}>{text}</Text>
      ) : null}
    </View>
  );
}

/** Main image plus a thumbnail strip when there's more than one image. */
/** `maxHeight` caps the main image on wide screens (an aspect ratio alone would make it as tall
 *  as the column is wide). `alt` describes the images for screen readers. */
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
  const { colors, radius, spacing } = useTheme();
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
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {current ? <Image source={{ uri: current }} style={styles.image} resizeMode="cover" alt={alt ? `${alt} — photo ${active + 1} of ${images.length}` : ""} /> : fallback}
      </View>
      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md }}
        >
          {images.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => setActive(i)}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${i + 1} of ${images.length}`}
              accessibilityState={{ selected: i === active }}
              style={{
                width: 68,
                height: 68,
                borderRadius: radius.md,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: i === active ? colors.brand : colors.border,
                opacity: i === active ? 1 : 0.78,
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 12 },
  image: { width: "100%", height: "100%" },
});
