Baha Tracker
============

Baha Tracker is a mobile-first flood depth and vehicle passability application for Philippine communities. Reports identify both ends of a flooded street stretch, display its length, and adapt safety guidance to the selected vehicle.

Core features
-------------

- Point-to-point flood reporting with start and end markers
- OSRM road-aligned preview with straight-line fallback
- Single-point fallback for unsafe or inaccessible stretches
- Vehicle-aware passability for walking, bicycles, motorcycles, tricycles, jeepneys, sedans, and SUVs
- Live Supabase updates with a polling fallback
- Offline report queue backed by IndexedDB
- Client-side image resizing before Supabase Storage upload
- Community voting, automatic confidence states, and three-hour report expiry
- GPS proximity checks in the browser and server route
- SOS flow with emergency types, location accuracy, a three-second cancellation window, and responder status
- Light and dark themes, responsive navigation, keyboard focus styles, and reduced-motion support
- Installable PWA with static shell and recently viewed OpenStreetMap tile caching
- Vercel Analytics and Speed Insights

Technology
----------

- Next.js 16 App Router and strict TypeScript
- Tailwind CSS with reusable component primitives
- MapLibre GL JS and OpenStreetMap raster tiles
- Supabase Auth, Postgres, PostGIS, Realtime, and Storage
- Upstash Redis rate limiting
- Zod validation in every write endpoint
- Vercel serverless route handlers in the Singapore region

Local setup
-----------

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the Supabase and Upstash values.
5. Run the SQL files in `supabase/migrations` in numeric order using the Supabase SQL editor.
6. Start the app with `npm run dev`.
7. Open the local address printed by Next.js.

Production access is authentication-first. Protected app routes redirect to `/login` when no valid Supabase session is present. Cloud writes, account actions, photo storage, Realtime, and distributed rate limiting require their corresponding services.

Environment variables
---------------------

`NEXT_PUBLIC_SUPABASE_URL` is the project API URL and may be exposed to the browser.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the Supabase anonymous key and may be exposed to the browser because Row-Level Security remains authoritative.

`SUPABASE_SERVICE_ROLE_KEY` stays server-only. It enables the server-side report projection and scheduled expiry after the request has passed authentication and validation.

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` stay server-only and enable serverless-safe limits of five reports or three SOS requests per ten-minute window.

`NEXT_PUBLIC_OSRM_URL` selects the routing service. It defaults to the public OSRM demo server. A dedicated compatible endpoint is recommended for sustained production traffic.

`CRON_SECRET` protects the manual report-expiry endpoint. Vercel automatically sends it as a bearer token when configured for cron jobs.

Supabase configuration
----------------------

Enable email and password authentication in Supabase Auth. Add local and deployed callback addresses ending in `/auth/callback` to the allowed redirect list. The migration enables PostGIS, creates all application tables and constraints, applies a GIST index to both spatial columns, enables Row-Level Security on every table, creates role-aware policies, adds vote aggregation and SOS audit triggers, creates the flood photo bucket, and publishes report updates through Supabase Realtime.

All application routes and application APIs are intended for authenticated Baha Tracker users, except the login/auth callback and the CRON endpoint protected by `CRON_SECRET`. Authenticated browser operations remain governed by Row-Level Security. The service role key is never sent to the client.

Deploy to Vercel with GitHub
----------------------------

1. Push this directory to a GitHub repository.
2. In Vercel, choose Add New Project and import the repository.
3. Keep the detected Next.js framework settings and default build command.
4. Add every required environment variable under Production, Preview, and Development.
5. Add `CRON_SECRET` before enabling scheduled expiry.
6. Deploy.
7. Add the final `/auth/callback` address to the Supabase Auth redirect allowlist.
8. Verify the map, one authenticated vote, one test report, and Realtime delivery.

Environment variable changes apply only after a new deployment. Redeploy after changing any value.

Vercel CLI deployment
---------------------

Run `vercel` to link the project and configure values, then run `vercel --prod`. The checked-in `vercel.json` selects `sin1`, applies security headers, prevents service-worker and manifest caching, and invokes the expiry cleanup route daily so it deploys on the Vercel Hobby plan. Active-report queries and the client map enforce the three-hour timestamp immediately, so stale reports disappear without waiting for cleanup. Pro plans may safely increase the cron frequency.

Security model
--------------

Vercel provides HTTPS. The deployment configuration adds HSTS, a restrictive Content Security Policy, clickjacking protection, MIME sniffing protection, a strict referrer policy, and a permissions policy that allows geolocation only from the same origin. Supabase Auth manages password hashing and session refresh through secure, SameSite cookies; the browser must be able to manage the auth cookies for client-side Supabase Realtime/session behavior. Inputs are validated before every write. Report coordinates must remain within the Philippines bounds. A submitted PostGIS line always contains exactly two endpoints. Road-aligned OSRM coordinates are a visual preview; the authoritative geometry preserves the validated start and end boundary. Segment lengths outside five meters to two kilometers are rejected. Single-point mode stores a zero-length two-endpoint line and is explicitly marked as a pin report.

Public map responses round coordinates to five decimal places. This keeps useful street-level placement while reducing unnecessary precision. Precise SOS locations are visible only to the alert owner and responder or administrator roles. SOS status changes and moderation-capable actions are represented in the audit log.

The public OSRM endpoint is optional and may impose usage limits. Routing failure never blocks reporting because the app falls back to a direct point-to-point preview.

Crowd confidence and expiry
---------------------------

Each signed-in user has one vote per report through a unique database constraint. Three positive votes mark a report verified. Three negative votes and a negative majority mark it unverified. Eight negative votes with a two-to-one negative ratio hide it. A positive confirmation extends the expiry by three hours. Vercel Cron marks stale reports expired, while the map also removes stale data during load as a client-side safeguard.

Offline behavior
----------------

The service worker caches the application shell and recently requested map tiles. Reports created without a connection enter an IndexedDB queue and are retried when the browser returns online. Cached information always shows an offline and last-updated indicator. Tile caching is best effort and is bounded by the browser storage policy.

Responsive verification
-----------------------

Verify the following widths in browser developer tools after each release:

- 375 px: full-screen map, scrollable vehicle selector, touch-sized floating actions, bottom navigation, and bottom-sheet details
- 768 px: full map controls, readable dialogs, and two-column form fields
- 1440 px: fixed left navigation, map workspace, right live feed, and unobstructed segment details

Operational checks
------------------

Run `npm run typecheck` and `npm run build` before deployment. Validate Supabase Row-Level Security with separate regular-user and responder accounts. Confirm that the `flood-photos` bucket accepts the supported image formats only. Watch Upstash usage and OSRM availability during severe weather events. Use a dedicated routing service if public endpoint capacity is insufficient.

Code policy
-----------

Source and configuration files intentionally contain no explanatory comments. Names and small functions carry implementation meaning. Required compiler reference directives are the only directive-style exception. Architecture, security decisions, platform behavior, and operations are documented in this file.
#
