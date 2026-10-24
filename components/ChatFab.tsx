import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { useChat } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";

/**
 * Floating Trellis chat button (Storefront §2.2) — bottom-right, sitting above the mobile bottom
 * bar and any sticky page bar (`bottom` is that clearance). Hidden while the chat is open.
 */
export function ChatFab({ bottom }: { bottom: number }) {
  const { colors, fonts } = useTheme();
  const { isOpen, openChat } = useChat();
  const { width } = useWindowDimensions();
  if (isOpen) return null;
  const withLabel = width >= 760;
  const size = width < 560 ? 48 : 52;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", right: width < 560 ? 12 : 16, bottom: bottom + 12, zIndex: 45 }}>
      <Pressable
        onPress={() => openChat()}
        accessibilityRole="button"
        accessibilityLabel="Ask Trellis, the FarmsClub assistant"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          height: size,
          minWidth: size,
          paddingHorizontal: withLabel ? 18 : 0,
          justifyContent: "center",
          borderRadius: size / 2,
          backgroundColor: colors.brand,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.9)",
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        })}
      >
        <SparkleIcon size={20} />
        {withLabel ? <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: "#FFFFFF" }}>Ask Trellis</Text> : null}
      </Pressable>
    </View>
  );
}
