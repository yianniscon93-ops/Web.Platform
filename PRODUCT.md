# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, weighted equally (docs/design-brief.md, Sept 2026):

- **Property investors and buyers** deciding where and what to buy in Cyprus,
  and whether a property earns more as a short-let, a long-let, or neither.
- **Short-term-rental hosts** benchmarking their occupancy and nightly rates
  against the listings around them, and pricing ahead of demand.
- **Real estate agents and property managers** advising clients with data
  rather than anecdote.

## Product Purpose

A property-intelligence platform for Cyprus. It tracks short-term rentals
(Airbnb) plus long-term rental and for-sale listings (Bazaraki), and turns them
into area-level numbers people explore on a map: occupancy, nightly rates,
booking pace, forward prices, rents, asking prices and yield.

It exists so that buying, pricing or advising rests on what an area actually
earns, not on hearsay or a district average. Success means users act on these
numbers, and free users convert to paid.

## Positioning

What a neighbouring product such as AirROI (the brief's reference competitor)
cannot truthfully claim:

- **Street-level Cyprus depth.** Every listing, no sampling. 552 named areas,
  plus any boundary the user draws; the numbers rebuild for just the listings
  inside it.
- **Short-let, long-let and sale in one place.** Investors compare yield across
  all three strategies for the same area.
- **Honest occupancy.** Effective occupancy counts only real guest bookings;
  owner blocks, minimum-stay gaps and stale listings are stripped out
  (docs/DATA_ENGINEERING.md, "Occupancy model").
- **Answers inside Claude.** The Noesis connector answers property questions in
  Claude and links straight to that area on the dashboard map
  (docs/MAP_LINKS.md).

## Operating Context

- **Dashboard (`/dashboard`).** A map of listings plus five tabs: Market
  overview, Pricing, Booking pace, Buy & Rent, Revenue calculator. Users search
  the area hierarchy or draw a boundary, set filters and a date range, compare
  areas side by side, and open metric explanations. The map switches between
  season-to-date and the next 60 days.
- **Landing page (`/`).** Demos the dashboard live and sends visitors to it or
  to sign-up.
- **From Claude.** A signed link (`/m/<token>`) opens the dashboard on the area
  the answer was about, under an "Opened from Claude · read-only view" banner.
- **Data rhythm.** Availability refreshes every 48 hours, forward pricing
  weekly. Realized ("to-date") occupancy counts from 2026-04-01; booking pace
  looks 60 days ahead. Money is in EUR. The interface is in English; the
  audience is in Cyprus and the EU.

## Capabilities and Constraints

- **Market scope:** the web app covers Cyprus only. The connector and the
  serving layer also carry Athens; Athens in the web app is undecided.
- **Outside this web app:** occupancy and revenue predictions and property
  reports exist on the data side, outside this repo (confirmed by the owner).
  The web app shows neither. Check before restating the landing page's
  specifics about them (model type, weekly cadence).
- **Business model:** freemium, a free account plus a paid Pro tier (the
  brief; the Aug 2026 rework puts drawing and compare behind a free account).
  Tier contents and prices are not final. The brief's split is the current
  intent: Free gets the map, district summaries and 3 months of history; Pro
  adds full history, comparison, exports and pricing data. The live landing
  copy ("Five products. One subscription.", "we'll set you up within a few
  days") disagrees with it.
- **Data:** read-only in this repo; the schema belongs to the data-engineering
  repos (docs/DASHBOARD_CONTRACT.md, docs/POSTGRES.md). Without `DATABASE_URL`
  the app serves deterministic demo data, and that fallback must keep working.
  Compare areas within one hierarchy level; never sum across levels.
- **Launch state:** pre-launch. No public URL yet (Vercel deploy pending, and
  Claude map links go live with it), the sign-up form does not submit
  anywhere, and the Privacy and Terms links are placeholders
  (docs/ROADMAP.md). GDPR applies.
- **Terminology:** STR = short-term rental (Airbnb short-let); LTR = long-term
  rental (Bazaraki); sale = Bazaraki for-sale listing. Occupancy is
  *effective* (real guest bookings, the headline number) or *raw* (every
  unavailable night). Areas nest district, municipality, community, quarter
  (neighbourhood); tourist areas overlap them. "Noesis" names the data
  platform and the Claude connector. The shipped app says "Dashboard"; the
  Aug 2026 rework mockups rename it "Playground" (not built).

## Brand Commitments

- **Name: undecided.** The code, page titles, roadmap and the domain idea
  (propsights.com or .io) say PropSights; the Sept 2026 brief says RealSights.
  The code keeps PropSights until it is settled: `BRAND` in
  `apps/web/src/lib/brand.ts`, repeated in the page metadata in
  `apps/web/app/layout.tsx`.
- **Tagline in code:** "Cyprus STR Market Intelligence". It names short-lets
  only, while the product also covers long-lets and sales.
- **Assets:** no logo, favicon or OG image exists yet; the footer uses a
  letter tile.

## Evidence on Hand

- **Live data:** the Postgres serving layer; counts are served at
  `/api/dashboard/summary`. Last recorded snapshot (2026-08-30): about 14.5k
  short-let, 10.1k long-let and 29.5k for-sale listings.
- **Coverage:** 552 named Cyprus areas (since 2026-09-24); the landing hero
  cycles 12 headline areas (`apps/web/src/lib/areaData.ts`).
- **Freshness:** 48-hour availability refresh, weekly pricing refresh,
  booking-pace snapshots since March 2026.
- **Design inputs:** docs/design-brief.md (Sept 2026 landing brief);
  docs/design/landing-rework-2026-08/ (landing and Playground mockups built on
  real map data and stats).
- **Absent, never fabricate:** testimonials, customer names, case studies,
  press, partner logos.
- **Live landing claims the repo does not support:** "12 Cyprus districts"
  (Cyprus has six; the 12 are headline areas); "2+ yrs historical data" (the
  docs here show realized occupancy from 2026-04-01 and pace snapshots from
  March 2026); the "3,412+" fallback count (live counts are far higher); "The
  product is live … we'll set you up" (the form does not submit). Verify or
  replace before reuse.

## Product Principles

1. **Show the data, don't describe it.** The product is the data: let people
   touch real numbers on the map before asking anything of them.
2. **Precision earns trust.** Exact, real numbers with their as-of date; never
   round up or inflate ("8,700", not "10,000+").
3. **Honest metrics first.** Lead with effective occupancy and other measures
   that survive scrutiny, and keep every metric explainable.
4. **Street-level, not district averages.** Scope every answer to the exact
   area the user cares about, named or drawn.
5. **One decision, three strategies.** Short-let, long-let and sale are views
   of the same investment question; make them easy to compare.

## Accessibility & Inclusion

Comparison colours are validated for colour-vision deficiency and always carry
a non-colour cue (`apps/web/src/components/dashboard/compare.tsx`); keep that
standard.
