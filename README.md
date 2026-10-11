# FarmsClub

FarmsClub is Formulate India's B2B wholesale trade platform — bulk plants, pots, tools, and
soil/fertiliser, sold with tiered pricing and sourced through a sealed-bid supplier network.
It's the public-facing counterpart to the admin/seller B2B console in the Paudhewale dashboard,
calling the same backend's `/public/b2b/**` endpoints (no auth, no seller identity ever exposed).

Built with **Expo + Expo Router** — one React Native codebase targets web, iOS, and Android.
Only the web target is wired up for deployment today; native builds (EAS Build) are a later step
once there's a reason to ship an app binary.

## Stack

- Expo SDK 57, React Native 0.86, React 19
- Expo Router (file-based routing, shared across web/iOS/Android)
- TypeScript, strict mode
- Plain `StyleSheet` + a small theme-token system (`constants/theme.ts`) — no UI kit, no NativeWind
- Fonts: Archivo (headings) + Inter (body/UI), via `@expo-google-fonts/*`

## Project layout

```
app/                 Expo Router routes (file-based)
  _layout.tsx         Root layout — font loading, theme provider, Stack
  index.tsx            Home
  listings/index.tsx   Catalogue browse (search + category filter)
  listings/[id].tsx    Listing detail — price tiers, MOQ, dispatch info, RFQ CTA
  rfq/[listingId].tsx  RFQ submission form
  about.tsx            "How sourcing works" trust page
components/          Shared UI (Button, Badge, ListingCard, PriceTierTable, TextField, …)
constants/           Design tokens (theme.ts), theme context, category list
lib/                 API client (api.ts), TypeScript types matching the backend DTOs, formatting helpers
```

## Backend

Calls three public endpoints on the same Spring Boot backend the dashboard uses
(`PublicB2bController`):

- `GET /public/b2b/listings` / `/public/b2b/listings/{id}` — browse live listings + price tiers
- `POST /public/b2b/rfq` — submit a buyer enquiry (creates an admin-brokered `b2b_leads` row)

`lib/api.ts` resolves the base URL (it must include the `/api/v1` context path) like this:

1. `EXPO_PUBLIC_API_URL`, if set, always wins.
2. **Web, unset** — same-origin `/api/v1`. On Vercel, `vercel.json` rewrites `/api/v1/*` to the
   Cloud Run backend, so requests stay same-origin and the backend never needs a CORS entry for
   this app (the same pattern `paudhewale-dashboard-frontend` uses). There is deliberately **no**
   silent fallback to the absolute backend URL on web.
3. **Native (iOS/Android), unset** — the absolute Cloud Run URL, since an app binary has no
   rewrite layer in front of it.

For local `npm run web` there is no Vercel rewrite, so point it at the backend explicitly:

```bash
EXPO_PUBLIC_API_URL=https://xoms-backend-752519899091.asia-south1.run.app/api/v1 npm run web
```

(The backend must allow `http://localhost:8081` in CORS for that to work; otherwise use
`vercel dev`, which applies the same rewrites locally.)

Backend error text is never shown to buyers verbatim: `friendlyMessage()` in `lib/api.ts` only
passes through plain human sentences and replaces anything technical (SQL, class names,
status codes, ALL_CAPS codes…) with a generic message; network failures get a
"check your connection" message.

## Running locally

```bash
npm install
npm run web      # http://localhost:8081
```

## Deploying to Vercel

1. Push this repo to GitHub, import it into a new Vercel project.
2. `vercel.json` already sets **Build Command** `npm run build:web` and **Output Directory**
   `dist`. `build:web` runs `expo export --platform web` and then `scripts/postexport.js`, which
   copies `+not-found.html` to `404.html` (Vercel serves it, with a 404 status, for unknown paths).
3. Routing on Vercel (`vercel.json`): `cleanUrls` serves `/about` from `about.html`; dynamic
   routes are rewritten to their exported shells — `/listings/:id` → `listings/[id].html`,
   `/rfq/:listingId` → `rfq/[listingId].html` — so a refresh or deep link works. The
   `/api/v1/*` backend rewrite stays first. Expo Router's dev `/_sitemap` route is disabled in
   `app.json` (`"sitemap": false`).
4. Optional env vars (Vercel → Project → Settings → Environment Variables, see
   `.env.production.example`): `EXPO_PUBLIC_API_URL` (web defaults to `/api/v1` already) and
   `EXPO_PUBLIC_SITE_URL` (canonical/og:url origin; defaults to the browser's origin).
5. Attach the FarmsClub domain in Vercel → Project → Settings → Domains once it's ready.

## What's built, what isn't (as of 2026-10-06)

Done: home, catalogue browse (category/search filtering), listing detail with the full
tiered-price table, RFQ form with the complete field set from `B2B_Admin_Spec_v1.2` §3 (shared
between a per-listing enquiry and a general one at `/contact`), a persistent nav header + footer
on every page, an about/trust page, and placeholder Terms/Privacy pages (structurally complete,
clearly flagged where real legal/company details are still needed — see those files). Verified
with a full `expo export --platform web` — builds clean, 10 static routes, zero TS errors.

**Known limitation — per-page SEO meta tags**: each route sets its own `<title>`/`<meta
name="description">` via `expo-router/head`, and this correctly updates the browser tab/title for
an actual visitor navigating the app. It does **not** currently make it into the pre-rendered
static HTML Vercel serves — a confirmed Expo Router limitation with `web.output: "static"`
(open since SDK 49: only `app/+html.tsx`'s tags survive into the static file). Every route today
serves the same site-wide title/description from `+html.tsx` to a crawler or link-preview
scraper that doesn't execute JS. Fixing this properly means moving to `web.output: "server"`
(real SSR, a different — more complex — Vercel deployment shape than a static site), which
wasn't worth the added deployment complexity for a first version. Revisit once per-listing SEO
actually matters.

Not yet: branded app icon/splash (placeholder Expo defaults still in `assets/`), native
(iOS/Android) build config via EAS, any seller-identity-bearing screens (deliberately out of
scope for this public surface — see the admin/seller B2B console in the dashboard repo instead),
server-side search (currently filters client-side against the full listing set — fine at today's
catalogue size, revisit if it grows), real company contact details (phone/email/registered
address) on the Terms/Privacy/Contact pages.
