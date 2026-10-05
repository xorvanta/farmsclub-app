import type { ThemeColors } from "@/constants/theme";
import type { Category } from "@/lib/types";

/**
 * Per-category accent, drawn from the existing theme tokens (never a new hardcoded hex) so
 * each category reads as visually distinct — plants green, pots terracotta, tools steel,
 * soil earthy amber, other neutral — while staying correct in both light and dark mode.
 */
export function categoryAccent(category: Category | null | undefined, colors: ThemeColors) {
  switch (category) {
    case "PLANT":
      return { fg: colors.brand, bg: colors.brandSoft };
    case "POT":
      return { fg: colors.accentDark, bg: colors.accentSoft };
    case "TOOL":
      return { fg: colors.info, bg: colors.infoSoft };
    case "SOIL_FERTILISER":
      return { fg: colors.warning, bg: colors.warningSoft };
    default:
      return { fg: colors.inkSoft, bg: colors.border };
  }
}
