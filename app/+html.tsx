import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Root HTML document for the static web export (app/_layout.tsx still controls everything
 * inside <body>). Per-page <title>/<meta> come from `expo-router/head` on each screen — this
 * only sets what's true platform-wide: charset, viewport, a default title/description for
 * crawlers that never run the per-page Head (e.g. a social-preview scraper that doesn't execute
 * JS), and RN Web's recommended scroll-reset so a native-style fixed-height layout isn't fighting
 * the browser's own scrolling.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#1F4530" />
        {/* The web build is light-only (see constants/theme-context.tsx) — tell the browser too, so
            form controls/scrollbars don't switch to dark under a light page. */}
        <meta name="color-scheme" content="light" />
        <title>FarmsClub — Bulk plants, seeds, pots, tools &amp; fertiliser</title>
        <meta
          name="description"
          content="Formulate India's B2B wholesale trade platform for bulk plants, seeds, pots, tools, and soil & fertiliser — quantity-tier pricing, sourced from nurseries and suppliers across India."
        />
        {/* Site-wide Open Graph defaults — the only OG tags a non-JS link-preview scraper sees.
            Per-page og:title/description/url/canonical are added client-side by SeoHead. */}
        <meta property="og:site_name" content="FarmsClub" />
        <meta property="og:type" content="website" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
