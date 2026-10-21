import { Image, Platform, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

const UNSPLASH = /^https:\/\/images\.unsplash\.com\//;
const WIDTHS = [320, 480, 640, 960, 1280, 1600];

/** srcset for hosts that resize on request (Unsplash serves WebP/AVIF with auto=format). */
function srcSetFor(uri: string): string | undefined {
  if (!UNSPLASH.test(uri)) return undefined;
  const base = uri.split("?")[0];
  return WIDTHS.map((w) => `${base}?w=${w}&q=72&auto=format&fit=crop ${w}w`).join(", ");
}

/**
 * An image that fills its box (object-fit: cover). Web renders a real <img> with
 * `loading="lazy"`, `decoding="async"`, `sizes` and a srcset where the host can resize — so
 * below-the-fold farm/listing photos don't load until scrolled to (Storefront §12.5). `alt` is
 * required: pass "" only for a purely decorative image.
 */
export function Photo({
  uri,
  alt,
  style,
  sizes = "(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 400px",
  eager,
}: {
  uri: string;
  alt: string;
  style?: StyleProp<ViewStyle>;
  sizes?: string;
  /** Above-the-fold hero/cover: load immediately. */
  eager?: boolean;
}) {
  if (Platform.OS === "web") {
    const srcSet = srcSetFor(uri);
    return (
      <View style={[{ overflow: "hidden" }, style]}>
        <img
          src={srcSet ? `${uri.split("?")[0]}?w=960&q=72&auto=format&fit=crop` : uri}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          // fetchpriority is a valid attribute; React 19 passes it through.
          {...(eager ? { fetchPriority: "high" as const } : {})}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </View>
    );
  }
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" } as StyleProp<ImageStyle>}
        resizeMode="cover"
        accessibilityLabel={alt || undefined}
        accessible={!!alt}
      />
    </View>
  );
}
