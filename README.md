# Galaxia 2026 - Where Music Meets the Cosmos

Official concert booking website for **Western College of Business Management**.

Premium cosmic visuals, a public booking flow with Razorpay, a QR ticket page, and an
admin CMS for events and performers.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4, Framer Motion, Radix Dialog |
| Auth + data | Supabase (`@supabase/ssr`), with local JSON fallback for development |
| Payments | Razorpay (test mode), HMAC signature verification |
| Forms | react-hook-form + zod |
| Fonts | Self-hosted latin subsets in `src/fonts` via `next/font/local` |

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

The site runs without any env vars for browsing, but admin login, checkout and the
Supabase-backed stores need them.

## Environment variables

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Admin auth, events/performers stores, middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client and middleware session checks |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes (admin API routes). Never expose this |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | `POST /api/checkout` |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs in metadata |

Reserved but not wired yet: `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY` / `EMAIL_FROM`,
`SMTP_*`. `.env.example` lists them for when ticket email and the Razorpay webhook are
added; no code reads them today.

## Scripts

```bash
npm run dev      # dev server with hot reload
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
npx tsc --noEmit # type check
```

`next dev` and `next build` must not share `.next`: a build swaps the manifests a
running dev server is using, which shows up as React hydration mismatches. Use a
separate dist dir when you need both at once:

```bash
NEXT_DIST_DIR=.next-prod npm run build
NEXT_DIST_DIR=.next-prod npm start
```

`npm run dev` keeps using `.next`, so the two never collide. `/.next-prod/` is
git-ignored.

## Project structure

```
src/
  app/
    page.tsx                 public homepage
    events/                  schedule page
    booking/success/         ticket + QR confirmation
    admin/                   login, dashboard, events, performers, bookings
    api/                     checkout, verify, events, admin CRUD
  components/
    home-page.tsx            homepage sections
    site-nav.tsx             navbar + mobile sheet (scroll lock, focus trap)
    events/, admin/, ui/     feature components
  lib/
    events/                  event store, seed, types, formatting
    performers/              performer store, uploads, seed
    supabase/                browser + server clients
    payment/razorpay.ts      provider wrapper
  fonts/                     Bricolage Grotesque + Outfit latin woff2 (OFL)
  middleware.ts              Supabase session refresh + /admin guard
supabase/migrations/         SQL for admin_profiles, events, performers, bookings
scripts/                     responsive / performance audit helpers
```

## Data model

- **Production:** Supabase. `src/lib/events/store.ts` and the performers store use
  `SUPABASE_SERVICE_ROLE_KEY` server-side and fall back to JSON only when the env vars
  are absent. Vercel's filesystem is read-only, so Supabase is required in production.
- **Local development:** `.data/events.json` and `.data/performers.json` (git-ignored),
  seeded from `src/lib/events/seed.ts` and `src/lib/performers/seed.ts`.
- **Uploads:** `public/uploads/performers` locally; on Vercel an upload would need
  object storage (Supabase Storage is the natural choice) because the bundle is immutable.

## Admin

`/admin/login` signs in through Supabase Auth. Access is gated by
`admin_profiles.role` (checked in `src/middleware.ts`), so create the profile row for
every admin user. Any admin screen you add is protected by the same middleware rule.

## Responsive notes

- Mobile-first Tailwind: base styles target phones, `sm:` 640, `md:` 768, `lg:` 1024,
  `xl:` 1280. Desktop layout at 1280 / 1440 is the reference and is unchanged.
- Body text 16px, nothing below 13px, inputs at least 16px on phones to stop iOS zoom.
- Touch targets are 44x44 minimum; hover styles are gated behind `@media (hover: hover)`
  via `future.hoverOnlyWhenSupported` in `next.config.ts`.
- Full-height sections use `100svh` / `100dvh` (never `100vh`), and fixed bars respect
  `env(safe-area-inset-*)`.
- The mobile menu is a Radix dialog rendered as an 88vw sheet, with a manual page
  scroll lock in `site-nav.tsx` (body pinned at `-scrollY`) because
  `html { overflow-x: clip }` defeats the library lock.

## Deploying to Vercel

1. Import the repo; framework preset Next.js, root directory is the repo root.
2. Add the env vars from the table above (Production + Preview).
3. Deploy. `npm run build` is all Vercel needs.
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain so metadata and QR links match.

Builds need the dev dependencies (`typescript` loads `next.config.ts`, Tailwind and
PostCSS compile the CSS). If the project's install command is customised to
`npm install --production` or `npm ci --omit=dev`, the build fails immediately.

## Assets

Fonts: Bricolage Grotesque and Outfit (SIL Open Font License), self-hosted subsets.
Icons: `lucide-react`. Audio: `/audio/galaxia-prime.mp3`. All copy comes from the
project data, no placeholders.
