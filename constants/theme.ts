/**
 * FarmsClub design tokens — a B2B trade platform for bulk plants, pots, tools, and
 * soil/fertiliser, run by Formulate India. Deliberately distinct from Paudhewale retail's
 * consumer-facing palette: this is a procurement tool (price tiers, MOQ, dispatch states),
 * not a lifestyle storefront — so the system favours density and legibility over imagery.
 *
 * Light and dark variants both defined; `useTheme()` (see theme-context.tsx) picks one from
 * the device's color scheme.
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
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

// Brand — deep pine, a trade-serious green distinct from a consumer plant shop's palette.
export const light = {
  brand: "#1F4530",
  brandDark: "#133222",
  brandSoft: "#E7EEE4",
  accent: "#C8761A",
  accentDark: "#A3600F",
  accentSoft: "#FBEEDC",
  ink: "#16201A",
  inkSoft: "#596356",
  inkFaint: "#8B9389",
  paper: "#F7F4ED",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  border: "#E4DFD0",
  borderStrong: "#CFC8B4",
  success: "#2E8B57",
  successSoft: "#E3F2E8",
  warning: "#B4791F",
  warningSoft: "#FBEFDC",
  danger: "#B23A3A",
  dangerSoft: "#FBE7E6",
  info: "#3A6EA5",
  infoSoft: "#E6EEF6",
};

export const dark = {
  brand: "#6FC28F",
  brandDark: "#4E9E6C",
  brandSoft: "#1C2B21",
  accent: "#E0A24E",
  accentDark: "#C78A36",
  accentSoft: "#332616",
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
