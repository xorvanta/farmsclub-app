import { Linking, Platform, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { farmWhatsappHref } from "@/lib/api";

export const WHATSAPP_GREEN = "#25D366";
/** Darker WhatsApp green for the label/background so white text meets contrast (≈4.6:1). */
const WHATSAPP_GREEN_DARK = "#128C4A";

/** The official WhatsApp glyph (speech bubble with handset). */
export function WhatsAppGlyph({ size = 22, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path
        fill={color}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
      />
    </Svg>
  );
}

/**
 * "Chat with the farm" — only rendered by callers when the profile says `whatsapp_available`
 * (Verified farm with WhatsApp, not hidden by admin; Admin §3.9). Links to the backend redirect,
 * which counts the click and forwards to WhatsApp; the number is never on the page. Opens in a new
 * tab (web) / the WhatsApp app (native).
 */
export function WhatsAppButton({ slug, src, fullWidth, compact }: { slug: string; src: "profile" | "sticky"; fullWidth?: boolean; compact?: boolean }) {
  const { fonts, radius } = useTheme();
  const href = farmWhatsappHref(slug, src);
  const label = "Chat with the farm";

  const inner = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: WHATSAPP_GREEN_DARK,
        borderRadius: radius.pill,
        paddingHorizontal: compact ? 16 : 22,
        minHeight: 48,
        alignSelf: fullWidth ? "stretch" : "flex-start",
      }}
    >
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: WHATSAPP_GREEN, alignItems: "center", justifyContent: "center" }}>
        <WhatsAppGlyph size={18} />
      </View>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#FFFFFF" }}>{label}</Text>
    </View>
  );

  if (Platform.OS === "web") {
    // A real anchor: new tab, no referrer/opener leak.
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`${label} on WhatsApp (opens WhatsApp)`}
        style={{ textDecoration: "none", display: "flex", alignSelf: fullWidth ? "stretch" : "flex-start" }}
      >
        {inner}
      </a>
    );
  }
  return (
    <Pressable onPress={() => Linking.openURL(href)} accessibilityRole="link" accessibilityLabel={`${label} on WhatsApp`}>
      {inner}
    </Pressable>
  );
}
