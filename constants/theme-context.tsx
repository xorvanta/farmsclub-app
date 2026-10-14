import { createContext, useContext, type PropsWithChildren } from "react";
import { Platform, useColorScheme } from "react-native";
import { light, dark, type ThemeColors, fonts, spacing, radius } from "./theme";

type Theme = {
  colors: ThemeColors;
  fonts: typeof fonts;
  spacing: typeof spacing;
  radius: typeof radius;
  scheme: "light" | "dark";
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Web is always light: much of the design paints white text over photos/brand panels and
  // light-surface cards next to them, and the dark tokens were never contrast-checked against
  // that mix. Native apps are already light-only via app.json's userInterfaceStyle.
  const systemScheme = useColorScheme();
  const scheme = Platform.OS !== "web" && systemScheme === "dark" ? "dark" : "light";
  const value: Theme = {
    colors: scheme === "dark" ? dark : light,
    fonts,
    spacing,
    radius,
    scheme,
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
