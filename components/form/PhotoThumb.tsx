import { Image, Pressable, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { compressImage, MAX_UPLOAD_BYTES, pickImages, previewUrl } from "@/lib/images";

export type PickedPhoto = { blob: Blob; preview: string | null };

/**
 * Opens the picker and compresses each chosen image on the device (≤1600 px JPEG). Files still
 * over the backend's 10 MB limit after compression are dropped and counted in `tooBig`.
 */
export async function pickCompressedPhotos(max: number): Promise<{ photos: PickedPhoto[]; tooBig: number }> {
  if (max <= 0) return { photos: [], tooBig: 0 };
  const files = await pickImages({ multiple: max > 1, max });
  const photos: PickedPhoto[] = [];
  let tooBig = 0;
  for (const f of files) {
    const blob = await compressImage(f);
    if (blob.size > MAX_UPLOAD_BYTES) {
      tooBig++;
      continue;
    }
    photos.push({ blob, preview: previewUrl(blob) });
  }
  return { photos, tooBig };
}

/** Square photo preview with an optional remove button and an optional badge/footer. */
export function PhotoThumb({
  uri,
  alt,
  size = 104,
  onRemove,
  removeLabel,
  badge,
  selected,
}: {
  uri: string | null;
  alt: string;
  size?: number;
  onRemove?: () => void;
  removeLabel?: string;
  badge?: string | null;
  selected?: boolean;
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, overflow: "hidden", borderWidth: selected ? 3 : 1, borderColor: selected ? colors.brand : colors.border, backgroundColor: colors.brandSoft }}>
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={alt} alt={alt} /> : null}
      {badge ? (
        <View style={{ position: "absolute", left: 4, top: 4, backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#FFFFFF" }}>{badge}</Text>
        </View>
      ) : null}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={removeLabel ?? "Remove"}
          hitSlop={6}
          style={{ position: "absolute", right: 2, top: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 18, lineHeight: 20 }} aria-hidden>
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
