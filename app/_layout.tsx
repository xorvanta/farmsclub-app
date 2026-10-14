import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import {
  useFonts as useArchivo,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  useFonts as useDevanagari,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from "@expo-google-fonts/noto-sans-devanagari";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/constants/theme-context";
import { ChatProvider } from "@/lib/chat-context";
import { ChatWidget } from "@/components/ChatWidget";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Light icons: the top of every screen is the dark-green announcement bar (AppShell). */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
      <ChatWidget />
    </View>
  );
}

export default function RootLayout() {
  const [archivoLoaded] = useArchivo({ Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [devanagariLoaded] = useDevanagari({ NotoSansDevanagari_600SemiBold, NotoSansDevanagari_700Bold });
  const ready = archivoLoaded && interLoaded && devanagariLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  // Native waits for fonts behind the splash screen. Web renders straight away (system-font
  // fallback until the web fonts arrive), so the static export contains the real page — headings,
  // copy and <a href> links — instead of an empty shell for crawlers and slow connections.
  if (!ready && Platform.OS !== "web") return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ChatProvider>
          <RootStack />
        </ChatProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
