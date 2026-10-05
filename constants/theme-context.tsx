import { createContext, useContext, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";
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
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
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
