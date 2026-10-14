/**
 * FarmsClub design tokens — a B2B trade platform for bulk plants, pots, tools, and
 * soil/fertiliser, run by Formulate India. Deliberately distinct from Paudhewale retail's
 * consumer-facing palette: this is a procurement tool (price tiers, MOQ, dispatch states),
 * not a lifestyle storefront — so the system favours density and legibility over imagery.
 *
 * Light and dark variants both defined; `useTheme()` (see theme-context.tsx) picks one. The
 * web build always uses light — see theme-context.tsx.
 */

export const fonts = {
  display: "Archivo_700Bold",
  displaySemiBold: "Archivo_600SemiBold",
  heading: "Archivo_600SemiBold",
  headingMedium: "Archivo_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  devanagari: "NotoSansDevanagari_700Bold",
  devanagariSemiBold: "NotoSansDevanagari_600SemiBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

// Brand — deep forest pine, a trade-serious green distinct from a consumer plant shop's palette.
export const light = {
  brand: "#143D28",
  brandDark: "#0C291A",
  brandSoft: "#EBF3EC",
  accent: "#C25E1A",
  accentDark: "#A24B10",
  accentSoft: "#FBF1E6",
  // Primary-button fill (Warm Terracotta). White text on it is 4.95+:1 (WCAG AA compliant for normal text).
  cta: "#C25E1A",
  ink: "#111C15",
  inkSoft: "#4F5D54",
  inkFaint: "#839287",
  paper: "#F9F8F5",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  border: "#E6E2D8",
  borderStrong: "#D0C9BA",
  success: "#238350",
  successSoft: "#E5F5EC",
  warning: "#B87A18",
  warningSoft: "#FCF2DD",
  danger: "#B83A3A",
  dangerSoft: "#FCEBEB",
  info: "#2868A4",
  infoSoft: "#E7EFF8",
};

export const dark = {
  brand: "#6FC28F",
  brandDark: "#4E9E6C",
  brandSoft: "#1C2B21",
  accent: "#E0A24E",
  accentDark: "#C78A36",
  accentSoft: "#332616",
  cta: "#C25E1A",

  ink: "#EDEFE9",
  inkSoft: "#B2BBB0",
  inkFaint: "#7C867C",
  paper: "#12160F",
  surface: "#1A2018",
  surfaceRaised: "#212821",
  border: "#2C332B",
  borderStrong: "#3C443A",
  success: "#52C388",
  successSoft: "#1C3023",
  warning: "#E0AC56",
  warningSoft: "#352A17",
  danger: "#E68787",
  dangerSoft: "#3A2323",
  info: "#7FA8D6",
  infoSoft: "#1E2A36",
};

export type ThemeColors = typeof light;
