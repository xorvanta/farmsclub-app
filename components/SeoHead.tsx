import { Platform } from "react-native";
import { usePathname } from "expo-router";
import Head from "expo-router/head";

/**
 * Public site origin for canonical/og:url. Set EXPO_PUBLIC_SITE_URL (e.g. https://farmsclub.in)
 * in Vercel once the domain is attached; until then the browser's own origin is used at runtime.
 */
function siteOrigin(): string | null {
  const env = process.env.EXPO_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return null;
}

/** Per-page <title>, description, canonical and Open Graph tags. Client-rendered only: with
 *  web.output "static" Expo Router doesn't put Head tags into the exported HTML (see README),
 *  so these reach JS-executing crawlers (Google) and the browser tab, not non-JS scrapers.
 *  og:site_name / og:type are static, site-wide, in app/+html.tsx. */
export function SeoHead({
  title,
  description,
  image,
  noindex,
}: {
  title: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
}) {
  const pathname = usePathname();
  const origin = siteOrigin();
  const url = origin ? `${origin}${pathname === "/" ? "" : pathname}` : null;
  return (
    <Head>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {url ? <link rel="canonical" href={url} /> : null}
      {noindex ? <meta name="robots" content="noindex" /> : null}
      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      {url ? <meta property="og:url" content={url} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
    </Head>
  );
}
