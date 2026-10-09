import { useState, type ReactNode } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/constants/theme-context";

/** "pot_diameter_cm" / "potDiameterCm" → "Pot diameter cm". */
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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

export function SpecificationSection({ specification, brand }: { specification: string | null; brand: string | null }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const { rows: specRows, text } = parseSpecification(specification);
  const rows = brand ? [{ label: "Brand", value: brand }, ...specRows] : specRows;
  if (!rows.length && !text) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>Specification</Text>
      {rows.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surface }}>
          {rows.map((r, i) => (
            <View
              key={`${r.label}-${i}`}
              style={[
                styles.row,
                { paddingHorizontal: spacing.md },
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>{r.label}</Text>
              <Text style={{ flex: 1.4, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink, textAlign: "right" }}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}
      {text ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 }}>{text}</Text>
      ) : null}
    </View>
  );
}

/** Main image plus a thumbnail strip when there's more than one image. */
export function ImageGallery({ images, fallback, aspectRatio }: { images: string[]; fallback: ReactNode; aspectRatio: number }) {
  const { colors, radius, spacing } = useTheme();
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  return (
    <View>
      <View style={{ aspectRatio, position: "relative" }}>
        {current ? <Image source={{ uri: current }} style={styles.image} resizeMode="cover" /> : fallback}
      </View>
      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
        >
          {images.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => setActive(i)}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.sm,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: i === active ? colors.brand : colors.border,
              }}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 12 },
  image: { width: "100%", height: "100%" },
});
