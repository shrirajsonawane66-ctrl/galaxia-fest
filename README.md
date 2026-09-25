# Galaxia 2025 — Where Music Meets the Cosmos
**Western College of Business Management** • Official concert booking website

A pixel-perfect rebuild of **Cosmic Beat** (`cosmic-beat.preview.emergentagent.com`) as a production **Galaxia** festival site — premium cosmic visuals + full booking + admin CMS.

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Framer Motion, Supabase (Postgres + Auth + Storage), Razorpay test-mode, Vercel.

## Features (public)
- Hero with `GalaxyBackground` canvas (320 stars, nebula parallax, shooting stars), shimmer text, glass nav
- About / Stats (animated counters) / Artists vinyl orbit (`SolarSystem` 6 records, spin + orbit)
- Passes: Regular ₹499 / Silver ₹999 / Gold Premium ₹1999 — distinct gradients, Sold Out state, capacity bar
- Schedule + FAQ (DB-driven, collapsible)
- Booking flow: tier + qty → details (validated) → order summary → Razorpay test → QR ticket `GAL-XXXXXX` + `/booking/success?ref=`
- Responsive, GPU transforms, optimized images via `next.config` remotePatterns

## Features (admin) `/admin`
Auth: demo `admin / galaxia123` (localStorage) — prod uses Supabase Auth + RLS.
- `/admin/dashboard` — bookings, tickets, revenue, inventory by tier, recent bookings, charts
- `/admin/bookings` — search/filter by tier, view attendee, export CSV
- `/admin/passes` — edit price/description/benefits/capacity/sold/active — price history via `booking_items.unit_price`
- `/admin/artists` — CRUD + image URL / Supabase Storage `artist-images` bucket
- `/admin/schedule` + `/admin/faqs` — CRUD reorder
- `/admin/settings` — event title/subtitle/venue/college/contact/socials/SEO
- All writes check `supabaseService` (server) or fallback to localStorage for demo — RLS blocks anon mutates.

## Setup
```bash
npm install
cp .env.example .env.local   # fill Supabase + Razorpay test keys
npm run dev                  # http://localhost:3000
```
### Supabase
1. Create project at supabase.com → copy URL + anon + service_role
2. `supabase/migrations/001_initial.sql` + `002_seed.sql` via SQL Editor
3. Storage bucket `artist-images` public (created by migration)
4. Auth: create user, then `insert into admin_profiles (id, role) values ('<uuid>','admin')`
5. Set `.env.local` and deploy to Vercel (add same env vars)

### Razorpay
Test keys from dashboard.razorpay.com → Settings → API Keys (test mode). Code is provider-abstracted (`src/lib/payment/razorpay.ts`) so you can swap.

### Email
Plug Resend/SMTP in `src/app/api/verify/route.ts` after `booking` insert — send `ref + pass + QR`.

## Booking integrity
- Client never trusts price — `POST /api/checkout` reads `passes.price/capacity/sold_count` server-side
- `POST /api/verify` verifies `razorpay_signature` HMAC, then RPC `increment_pass_sold` atomically — prevents oversell
- `booking_items.unit_price` freezes price at purchase

## Galaxia Core hold-to-play tuning
The interactive core in `src/components/SolarSystem.tsx` is driven by one `requestAnimationFrame` loop. Its feel is tuned with `IDLE=6`, `MAX_SPEED=900`, `RAMP_PER_SEC=180`, `EASE=2.4`, `SYS_IDLE=4`, and `SYS_FOLLOW=0.6`. Held target speed grows as `IDLE + heldSeconds² * RAMP_PER_SEC`; normalized `speedFactor` drives ripple spacing (`0.62 - speedFactor * 0.5` seconds), ripple duration/scale, system speed, and audio playback rate. Reduced-motion users get no ripples and a `120` deg/sec cap. The looping track is served as the cacheable static asset `/audio/galaxia-prime.mp3`.

## Design fidelity
Matches Cosmic Beat: `#050816`, glass `rgba(255,255,255,0.04) blur14`, `text-gradient-galaxy`, `shimmer-text 6s`, `grid-lines 60px`, `radial-nebula`, `noise overlay`, Orbitron + Space Grotesk + Inter, vinyl CSS + Framer Motion entrance `y40 0.8s ease [0.2,0.8,0.2,1]`.

## Deploy to Vercel
Add env vars, set `NEXT_PUBLIC_SITE_URL`, `vercel --prod`.

## Assets reused
Fonts via `next/font/google`, `lucide-react`, Unsplash 600w DPs (seed), framer-motion. No lorem — all copy from reference or DB seed.
