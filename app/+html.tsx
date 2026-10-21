import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML document for the static web export (app/_layout.tsx still controls everything inside
 * <body>). Per-page <title>/<meta>/canonical come from SeoHead on each screen — this only sets what
 * is true site-wide, for crawlers and link-preview scrapers that never run JS.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#143D28" />
        {/* The web build is light-only (see constants/theme-context.tsx). */}
        <meta name="color-scheme" content="light" />
        {/* BETA (Storefront §12.3): no indexing until farmsclub.in is live — REMOVE AT LAUNCH, together
            with BETA_NOINDEX in components/SeoHead.tsx and the X-Robots-Tag header in vercel.json. */}
        <meta name="robots" content="noindex, nofollow" />
        <title>FarmsClub · India's trusted farm network</title>
        <meta
          name="description"
          content="Meet the farms behind India's orchards and plantations, and source planting material in bulk from the same network."
        />
        <meta property="og:site_name" content="FarmsClub" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FarmsClub · India's trusted farm network" />
        <meta
          property="og:description"
          content="Meet the farms behind India's orchards and plantations, and source planting material in bulk from the same network."
        />
        <meta property="og:image" content="https://farmsclub.in/og-farmsclub.png" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
