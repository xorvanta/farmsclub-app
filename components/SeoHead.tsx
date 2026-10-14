import { usePathname } from "expo-router";
import Head from "expo-router/head";

/**
 * Public site origin for canonical/og:url — only ever EXPO_PUBLIC_SITE_URL (set it in Vercel's
 * Production environment once the domain is attached). Deliberately no fallback to the browser's
 * own origin: on a Vercel preview or *.vercel.app host that would declare the preview URL as
 * canonical. With it unset, canonical/og:url are simply omitted.
 */
function siteOrigin(): string | null {
  const env = process.env.EXPO_PUBLIC_SITE_URL?.trim();
  if (env && /^https?:\/\/[^\s/]+/.test(env)) return env.replace(/\/+$/, "");
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
