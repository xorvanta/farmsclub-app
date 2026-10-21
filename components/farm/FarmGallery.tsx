import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Photo } from "@/components/Photo";
import { Button } from "@/components/Button";
import type { FarmProfile } from "@/lib/types";

type GalleryPhoto = FarmProfile["gallery"][number];

const GRID_COUNT = 6;

/**
 * Storefront §6 block 9: a grid of 6 photos + "View all (N)" → lightbox with caption, prev/next,
 * and a category filter when categories are set. Every control is a ≥44 px button; arrow keys and
 * Escape work in the lightbox on web.
 */
export function FarmGallery({ photos, farmName, width }: { photos: GalleryPhoto[]; farmName: string; width: number }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(
    () => [...new Set(photos.map((p) => p.category?.trim()).filter((c): c is string => !!c))],
    [photos],
  );
  const filtered = category ? photos.filter((p) => p.category?.trim() === category) : photos;
  const altFor = (p: GalleryPhoto, i: number) => p.caption?.trim() || `${farmName} photo ${i + 1}`;

  const cols = width >= 640 ? 3 : 2;
  const gap = spacing.sm;
  const tile = Math.floor((width - gap * (cols - 1)) / cols);

  if (!photos.length) return null;
  const shown = filtered.slice(0, GRID_COUNT);

  return (
    <View style={{ gap: spacing.md }}>
      {categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {[null, ...categories].map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c ?? "all"}
                onPress={() => setCategory(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                aria-pressed={active}
                style={{
                  minHeight: 44,
                  paddingHorizontal: spacing.lg,
                  justifyContent: "center",
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.border,
                  backgroundColor: active ? colors.brand : colors.surface,
                }}
              >
                <Text style={{ fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 13.5, color: active ? "#FFFFFF" : colors.ink }}>
                  {c ?? "All"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {shown.map((p, i) => (
          <Pressable
            key={`${p.url}-${i}`}
            onPress={() => setOpen(i)}
            accessibilityRole="button"
            accessibilityLabel={`Open photo: ${altFor(p, i)}`}
            style={{ width: tile, aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.brandSoft }}
          >
            <Photo uri={p.url} alt={altFor(p, i)} style={{ width: "100%", height: "100%" }} sizes="(max-width: 640px) 50vw, 360px" />
          </Pressable>
        ))}
      </View>

      {filtered.length > 1 ? (
        <Button label={`View all (${filtered.length})`} variant="outline" onPress={() => setOpen(0)} />
      ) : null}

      {open !== null && filtered.length > 0 ? (
        <Lightbox photos={filtered} index={Math.min(open, filtered.length - 1)} onIndex={setOpen} onClose={() => setOpen(null)} altFor={altFor} />
      ) : null}
    </View>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  altFor,
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  altFor: (p: GalleryPhoto, i: number) => string;
}) {
  const { fonts, spacing } = useTheme();
  const { width, height } = useWindowDimensions();
  const p = photos[index];
  const prev = () => onIndex((index - 1 + photos.length) % photos.length);
  const next = () => onIndex((index + 1) % photos.length);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const ctrl = (label: string, glyph: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 22, fontFamily: fonts.bodySemiBold }} aria-hidden>
        {glyph}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(8,14,10,0.94)", padding: spacing.lg, gap: spacing.md }} aria-modal accessibilityViewIsModal>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: fonts.bodyMedium, fontSize: 13 }}>
            {index + 1} / {photos.length}
          </Text>
          {ctrl("Close photos", "×", onClose)}
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: Math.min(width - spacing.lg * 2, 1100), height: Math.max(200, height - 220) }}>
            <PhotoContain uri={p.url} alt={altFor(p, index)} />
          </View>
        </View>
        {p.caption?.trim() ? (
          <Text style={{ color: "#FFFFFF", fontFamily: fonts.body, fontSize: 14, textAlign: "center", lineHeight: 20 }}>{p.caption.trim()}</Text>
        ) : null}
        {photos.length > 1 ? (
          <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xl }}>
            {ctrl("Previous photo", "‹", prev)}
            {ctrl("Next photo", "›", next)}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Whole photo, letterboxed (the lightbox must not crop). */
function PhotoContain({ uri, alt }: { uri: string; alt: string }) {
  if (Platform.OS === "web") {
    return <img src={uri} alt={alt} decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />;
  }
  return <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" accessibilityLabel={alt} />;
}
