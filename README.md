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

`lib/api.ts` reads the base URL from `EXPO_PUBLIC_API_URL`. Two ways to point it at the backend:

1. **Direct** (local dev default, no env var needed) — falls back to the Cloud Run backend
   directly. Works out of the box with `npm run web`.
2. **Vercel rewrite** (production) — `vercel.json` proxies `/api/v1/*` to the same Cloud Run
   backend, so set `EXPO_PUBLIC_API_URL=/api/v1` (relative) in Vercel's env vars. Requests then
   stay same-origin and the backend never needs a CORS entry for this app — the exact pattern
   `paudhewale-dashboard-frontend` already uses.

## Running locally

```bash
npm install
npm run web      # http://localhost:8081
```

## Deploying to Vercel

1. Push this repo to GitHub, import it into a new Vercel project.
2. Vercel auto-detects the Expo web build; **Build Command**: `npm run build:web`,
   **Output Directory**: `dist`.
3. Set `EXPO_PUBLIC_API_URL=/api/v1` in Vercel → Project → Settings → Environment Variables
   (see `.env.production.example`).
4. Attach the FarmsClub domain in Vercel → Project → Settings → Domains once it's ready.

## What's built, what isn't (as of 2026-10-06)

Done: home, catalogue browse with category/search filtering, listing detail with the full
tiered-price table, RFQ form with the complete field set from `B2B_Admin_Spec_v1.2` §3, an
about/trust page. Verified with a full `expo export --platform web` — builds clean, 7 static
routes.

Not yet: branded app icon/splash (placeholder Expo defaults still in `assets/`), native
(iOS/Android) build config via EAS, any seller-identity-bearing screens (deliberately out of
scope for this public surface — see the admin/seller B2B console in the dashboard repo instead),
server-side search (currently filters client-side against the full listing set — fine at today's
catalogue size, revisit if it grows).
