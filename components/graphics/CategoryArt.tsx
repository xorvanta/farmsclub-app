import { View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { categoryAccent } from "@/constants/categoryTheme";
import { CATEGORY_PHOTOS, photoUrl } from "@/constants/categoryImages";
import type { Category } from "@/lib/types";

/**
 * Real photography tile for one category (nursery/pots/tools/soil/warehouse) with a brand-tinted
 * gradient for text legibility — used as the listing-card image fallback (most bulk listings
 * won't have a dedicated photo yet) and on the home category grid.
 */
export function CategoryArt({ category, style, width = 400 }: { category: Category | null | undefined; style?: object; width?: number }) {
  const { colors } = useTheme();
  const { fg } = categoryAccent(category, colors);
  const photo = CATEGORY_PHOTOS[(category ?? "OTHER") as Category];

  return (
    <View style={[{ overflow: "hidden", backgroundColor: fg }, style]}>
      <Image
        source={{ uri: photoUrl(photo, { w: width, h: width, q: 70 }) }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.38)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" }}
      />
    </View>
  );
}
