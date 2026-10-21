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

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", right: 16, bottom: bottom + 14, zIndex: 45 }}>
      <Pressable
        onPress={() => openChat()}
        accessibilityRole="button"
        accessibilityLabel="Ask Trellis, the FarmsClub assistant"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          height: 52,
          minWidth: 52,
          paddingHorizontal: withLabel ? 18 : 0,
          justifyContent: "center",
          borderRadius: 26,
          backgroundColor: colors.brand,
          opacity: pressed ? 0.9 : 1,
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
