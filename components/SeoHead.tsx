import { usePathname } from "expo-router";
import Head from "expo-router/head";

/**
 * Canonical origin — every page declares its farmsclub.in URL (Storefront §12.4), also while the
 * beta runs on farmsclub-app.vercel.app. EXPO_PUBLIC_SITE_URL overrides it.
 */
export const SITE_ORIGIN = (() => {
  const env = process.env.EXPO_PUBLIC_SITE_URL?.trim();
  return env && /^https?:\/\/[^\s/]+/.test(env) ? env.replace(/\/+$/, "") : "https://farmsclub.in";
})();

/**
 * Beta: every page is noindex (Storefront §12.3) — together with the X-Robots-Tag header in
 * vercel.json and the static meta in app/+html.tsx. AT LAUNCH on farmsclub.in: set this to false,
 * remove the meta in +html.tsx and the X-Robots-Tag header in vercel.json.
 */
export const BETA_NOINDEX = true;

/** Default share image (FarmsClub brand image) when a page has none of its own. */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-farmsclub.png`;

/** Per-page <title>, description, canonical, robots and Open Graph tags. Client-rendered (with
 *  web.output "static" Expo Router doesn't put Head tags into the exported HTML), so these reach
 *  JS-executing crawlers and the browser tab; the static defaults live in app/+html.tsx. */
export function SeoHead({
  title,
  description,
  image,
  noindex,
  path,
}: {
  title: string;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
  /** Canonical path when it differs from the current one (e.g. a farm reached by an old slug). */
  path?: string;
}) {
  const pathname = usePathname();
  const p = path ?? pathname;
  const url = `${SITE_ORIGIN}${p === "/" ? "" : p}`;
  const desc = description?.trim() || null;
  const og = image || DEFAULT_OG_IMAGE;
  return (
    <Head>
      <title>{title}</title>
      {desc ? <meta name="description" content={desc} /> : null}
      <link rel="canonical" href={url} />
      {noindex || BETA_NOINDEX ? <meta name="robots" content="noindex, nofollow" /> : null}
      <meta property="og:title" content={title} />
      {desc ? <meta property="og:description" content={desc} /> : null}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={og} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}
