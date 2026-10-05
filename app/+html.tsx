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
        <title>FarmsClub — Bulk Plants, Pots, Tools &amp; Fertiliser</title>
        <meta
          name="description"
          content="Formulate India's B2B wholesale trade platform for bulk plants, pots, tools, and soil & fertiliser — tiered pricing, sourced and delivered pan-India."
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
