import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";

/** Visual container for AppShell's `stickyBar` slot: surface, top border, shadow, a centred row. */
export function StickyBar({ children, maxWidth = 1120, padBottomInset }: { children: React.ReactNode; maxWidth?: number; padBottomInset?: boolean }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingTop: 10,
        paddingBottom: 10 + (padBottomInset ? insets.bottom : 0),
        shadowColor: "#111C15",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <View style={{ width: "100%", maxWidth, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
        {children}
      </View>
    </View>
  );
}
