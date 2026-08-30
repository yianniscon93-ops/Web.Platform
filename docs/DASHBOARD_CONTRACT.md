# PropSights Dashboard — Data Contract & Query Guide

**Audience: the PropSights repo (frontend + API).** Written 2026-07-11 by
Data.Noesis, which owns the PostgreSQL schema and the DuckDB→Postgres sync.
The database is the contract: PropSights reads these tables and never
aggregates raw calendar data at request time — every widget below resolves to
a single indexed SELECT (verified: area trend queries run in ~0.05 ms).

Connection: PostgreSQL + PostGIS on the Hetzner box, `localhost` only —
`postgresql://bnb:bnb@localhost/bnb` (the FastAPI service runs on the same
server). Full DDL: [schema.sql](schema.sql).

---

## 1. The landing page in one paragraph

Map top-middle, filter panel left, search-or-draw areas, week-resolution date
range picker, analytics below that react to the selection. The selection
(area or polygon + date range + filters) is **global context** — every
subsequent page renders against it. Deltas between areas (and vs the island)
are first-class.

---

## 2. Golden rules

1. **Always filter `WHERE is_active IS TRUE`** on `str_listings`. Inactive
   rows are delisted/stale supply kept for history; `IS TRUE` also excludes
   the small number of NULLs (unknown freshness). Never show them unless the
   user explicitly asks for historical supply.
2. **"Occupancy" on screen = `eff_occ` (effective), never `raw_occ`.**
   Raw counts every blocked calendar day (owner blocks, min-stay gaps, stale
   listings) and overstates demand by ~20–28pp. Raw is a pipeline-health
   metric; if shown at all, label it explicitly.
3. **Show data freshness on every page** — `SELECT * FROM sync_meta` (single
   row): `last_run_at` is the last scrape, `todate_end`/`fwd_end` bound the
   realized/forward windows. Trust is the product.
4. **Dates are ISO weeks (Monday `week_start`).** The date picker snaps to
   whole weeks. Realized weeks are `week_start < date_trunc('week', now())`;
   the current and future weeks are forward-looking (occupancy there =
   on-the-books booking pace, not final).
5. **Prefer medians for money.** Cyprus prices are heavy-tailed; show
   `median_adr` (or percentiles across listings) with the mean as secondary.
6. **Never sum across hierarchy levels.** `tourist_area` overlays overlap
   municipalities; a listing appears once per level it belongs to. Compare
   areas *within* one level, or vs the `CY` island row.

---

## 3. Tables you render from

| Table | Grain | Use |
|---|---|---|
| `dim_areas` | 1 row per named area (157) | search bar, hierarchy, fly-to coords |
| `str_listings` | 1 row per STR listing (~14.9k) | map pins, polygon/filter path, listing attributes, current-state occupancy |
| `str_listings_weekly` | listing × week (~880k) | **the workhorse**: any polygon/filtered selection × any week range |
| `str_area_weekly` | named area × week (~9.7k) | **the fast path**: unfiltered named-area KPIs, trends, deltas |
| `pricing_calendar` | listing × future date (~300k) | forward nightly rates (pricing page) |
| `ltr_listings`, `sale_listings` | 1 row per Bazaraki listing | rent/buy-side pages (later phases) |
| `sync_meta` | 1 row | freshness badge |

### Column notes

- `dim_areas`: `area_id` ('CY', 'D5', 'M5030', 'T6000A'…), `name_en`,
  `name_el`, `area_type` (country/district/municipality/community/quarter/
  parish/tourist_area), `parent_id` (hierarchy), `latitude/longitude` +
  `search_radius_km` (fly-to + zoom), `listing_count` (active STRs — rank
  search results by it, hide zeros).
- `str_listings`: geo (`geog` GiST-indexed, `latitude/longitude`), named
  areas (`district`, `municipality`, `community`, `tourist_area`,
  `area_label` — use `area_label` for tooltips), `is_active`, attributes
  (`property_type`, `bedrooms`, `beds`, `avg_rating`, `review_count`,
  `is_superhost`, 22 `has_*` amenity flags), current-state metrics
  (`eff_occ_todate`, `eff_occ_fwd60`, `avg_nightly_rate`, `bookings_30d`).
  The legacy `area` column is an internal scrape codename — never display it.
- `str_listings_weekly`: `raw_occ`, `eff_occ`, `avg_price`, `booked_nights`,
  `covered_nights` (denominator ≤ 7), `bookings`. PK `(listing_id, week_start)`.
- `str_area_weekly`: `listing_count`, `raw_occ`, `eff_occ`, `avg_adr`,
  `median_adr`, `booked_nights`, `bookings`, `revpar` (= eff_occ × avg_adr),
  `revenue_est` (= Σ booking_confidence × nightly price — an *estimate*,
  label it as such). PK `(area_id, week_start)`.

---

## 4. The two query paths

Which path serves a widget depends only on the selection:

| Selection | Path |
|---|---|
| Named area, **no** attribute filters | **A — pre-aggregated**: `str_area_weekly` by `area_id` |
| Polygon drawn, **or any** attribute filter active | **B — listing grain**: `str_listings` → `str_listings_weekly` |

### A. Named-area fast path

KPIs + trend for a selected area and week range (also the delta engine —
run it for 2+ `area_id`s and diff client-side):

```sql
SELECT week_start, listing_count, eff_occ, avg_adr, median_adr,
       revpar, bookings, revenue_est
FROM str_area_weekly
WHERE area_id = $1                     -- from dim_areas selection
  AND week_start BETWEEN $2 AND $3     -- picker range (Mondays)
ORDER BY week_start;
```

Island benchmark: same query with `area_id = 'CY'`. Week-over-week deltas:
compare the two latest *realized* weeks.

### B. Polygon / filtered path

Step 1 resolves the listing set; step 2 aggregates its weekly rows. One
statement:

```sql
WITH sel AS (
    SELECT listing_id, avg_nightly_rate, eff_occ_todate, bedrooms
    FROM str_listings
    WHERE is_active IS TRUE
      AND ST_Within(geog::geometry, ST_GeomFromGeoJSON($1))  -- drawn polygon
      -- OR named area + filters:  AND municipality = $1
      AND ($2::int  IS NULL OR bedrooms = $2)                -- optional filters
      AND ($3::bool IS NULL OR has_pool = $3)
)
SELECT w.week_start,
       COUNT(DISTINCT w.listing_id)                            AS listings,
       ROUND(100.0 * SUM(w.eff_occ/100.0 * w.covered_nights)
                   / NULLIF(SUM(w.covered_nights), 0), 1)      AS eff_occ,
       ROUND(AVG(w.avg_price), 2)                              AS avg_adr,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY w.avg_price) AS median_adr,
       SUM(w.bookings)                                         AS bookings
FROM sel JOIN str_listings_weekly w USING (listing_id)
WHERE w.week_start BETWEEN $4 AND $5
GROUP BY w.week_start ORDER BY w.week_start;
```

Occupancy is re-weighted by `covered_nights` — never average listing
percentages unweighted. A 3k-listing polygon over 6 months touches ~80k
indexed rows; expect tens of milliseconds.

Distribution card (median/p25/p75 — rule 5) over the same `sel` set:

```sql
SELECT PERCENTILE_CONT(ARRAY[0.25, 0.5, 0.75])
         WITHIN GROUP (ORDER BY avg_nightly_rate)  AS adr_quartiles,
       PERCENTILE_CONT(ARRAY[0.25, 0.5, 0.75])
         WITHIN GROUP (ORDER BY eff_occ_todate)    AS occ_quartiles,
       COUNT(*) AS supply
FROM sel;
```

### Search bar

```sql
SELECT area_id, name_en, name_el, area_type, district,
       latitude, longitude, search_radius_km, listing_count
FROM dim_areas
WHERE listing_count > 0
  AND (name_en ILIKE $1 || '%' OR name_el ILIKE $1 || '%')
ORDER BY listing_count DESC
LIMIT 10;
```

On selection: fly the map to `(latitude, longitude)` zoomed to
`search_radius_km`, filter path A (or B if attribute filters are on) by the
area. Group suggestions by `area_type`; `parent_id` gives the breadcrumb
(e.g. Kato Paphos → Pafos → Paphos District).

### Map pins

```sql
SELECT listing_id, latitude, longitude, area_label, property_type, bedrooms,
       avg_nightly_rate, eff_occ_todate, avg_rating
FROM str_listings
WHERE is_active IS TRUE
  AND geog && ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography;  -- viewport
```

---

## 5. Semantics that will bite you if ignored

- **Forward weeks are pace, not results.** `eff_occ` for future weeks is
  occupancy-on-the-books; it *will* rise as the week approaches. Label
  forward sections "on the books" and visually split at the current week.
- **Coverage starts 2026-04-01.** No realized data before that; don't offer
  earlier ranges.
- **`revenue_est` is modeled** (booking-confidence-weighted), not observed
  payouts. Label "est." everywhere.
- **`listing_count` varies by week** in `str_area_weekly` (supply changes,
  scrape coverage). Show it next to trends so occupancy moves aren't
  misread when supply shifts.
- **No boundary polygons exist** for named areas — assignment is
  nearest-centroid-within-radius. Don't attempt to draw an outline for a
  selected named area; fit bounds to matched pins instead.
- **`bookings` = detected calendar flips** at a 2-day scrape cadence — a
  demand velocity signal, not a reservation count from Airbnb.

---

## 6. Tab-by-tab build guide

Status legend: ✅ build now against current tables · 🔶 partial — build the
listed subset, stub the rest · ⛔ stub only, data lands later. The global
selection (area/polygon + weeks + filters, §4) applies to every tab.

### 6.1 Market Overview (landing) — ✅ build now

The page described in §1. Everything resolves to §4 queries:

| Widget | Source |
|---|---|
| Search bar + fly-to | `dim_areas` (§4 search query) |
| Map pins + tooltips (`area_label`) | `str_listings` viewport query |
| KPI cards: supply, eff-occ, ADR (median), RevPAR, bookings — with WoW delta | path A (named area) or path B (polygon/filtered); WoW = two latest realized weeks |
| Trend strip (weekly eff-occ / ADR / bookings over picker range) | same query, all weeks |
| Delta chips: selection vs district vs `CY` | path A × 2–3 `area_id`s, diff client-side |
| Distribution card (ADR + occ quartiles) | path B percentile query |
| Supply mix (bedrooms, property type, amenity penetration) | `SELECT bedrooms, COUNT(*) … FROM sel GROUP BY 1` over the §4 `sel` set |
| Freshness badge | `sync_meta` |

Split every time-series visually at the current week: left = realized,
right = "on the books" (rule §5).

### 6.2 Pricing — 🔶 partial

Build now:

- **Forward nightly-rate curve** for the selection: resolve the listing set
  (§4 `sel`), then

  ```sql
  SELECT pc.calendar_date,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pc.price_per_night) AS median_rate,
         PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY pc.price_per_night) AS p25,
         PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pc.price_per_night) AS p75
  FROM sel JOIN pricing_calendar pc USING (listing_id)
  GROUP BY 1 ORDER BY 1;
  ```

  `pricing_calendar` holds future dates only, refreshed weekly (Tuesdays) —
  say so in the UI. Segment by bedrooms via the `sel` filter.
- **Amenity premiums**: median `avg_nightly_rate` / `eff_occ_todate` split by
  `has_pool` / `has_sea_view` / `has_hot_tub` within the selection — straight
  off `str_listings`. Suppress when either side has < 20 listings.
- **Rate positioning**: a listing's `avg_nightly_rate` percentile within the
  selection's distribution (path B percentile query + one listing lookup).

Stub: weekend premium and holiday uplift (needs `dim_calendar`), price-vs-
lead-time dynamics (needs `pricing_gold` upstream).

### 6.3 Booking Pace — ⛔ stub

The differentiator page: lead-time curve by stay month (June books ~10 days
out, October ~137), pickup curves (on-the-books at 30/60/90 days before
arrival), stay-length mix. The data exists in DuckDB gold but is not
published yet — waiting on `booking_stays` (one row per stay: `listing_id`,
`district`, `first_night`, `stay_length_nights`, `lead_time_days`,
`confidence`, `est_value`) + `dim_calendar`. Both are next in this repo's
queue; the shapes above are stable enough to design against.

Meanwhile the landing `bookings` series (weekly detected bookings) is the
only demand-velocity signal — don't try to derive lead times from it.

### 6.4 Investments (buy-side) — 🔶 partial, with a data caveat

Build now against `sale_listings` (`price`, `geog`, `bedrooms`,
`property_type`, `size_m2`, `url`, `first_seen`/`last_seen`):

- Supply + price distribution + €/m² (`price / NULLIF(size_m2,0)`) by
  polygon and bedrooms — medians and quartiles, same shapes as §4.
- **Caveat to display**: sale-side expiry detection doesn't fire yet, so the
  table includes some sold/withdrawn stock — counts skew high. Fix is queued
  in this repo; until then label supply "listings observed", not "on the
  market".

Stub: days-on-market and price-cut lists (blocked on the expiry fix +
`sale_price_history`), condition / energy-efficiency / construction-year
segmentation (columns not yet synced), and the four ROI columns
(`str_annual_revenue_est`, `str_gross_yield`, `ltr_monthly_rent_est`,
`ltr_gross_yield` — present in the schema, currently NULL; render "—" until
populated, they'll fill in without a schema change).

Note: `sale_listings.area` is NULL today (named-area assignment not yet run
for Bazaraki) — geographic filtering is polygon-only on this tab for now.

### 6.5 Rentals (LTR) — 🔶 partial

Build now against `ltr_listings` (`monthly_rent` is clean post the July 6
price-repair): median rent by bedrooms within a polygon, rent distribution,
supply. Same NULL-`area` limitation as 6.4 — polygon-only until the assigner
runs for Bazaraki. Stub: rent trends over time (needs the log-history table)
and rent-vs-STR arbitrage (needs 6.4's ROI columns).

### 6.6 Listing Benchmark (drill-down card, not a tab) — ✅ build now

Click a map pin → one listing vs its selection comp set:

- Attributes + rating: the `str_listings` row.
- Percentiles: its `eff_occ_todate` / `avg_nightly_rate` rank within the
  §4 `sel` set (`PERCENT_RANK()` over the selection).
- History: its `str_listings_weekly` rows vs the selection's weekly medians.
- Amenity gaps: flags false on this listing but >50% true across `sel`.

Stub: rating trend sparkline (needs `listing_rating_history`).

---

## 7. Sequencing & source of truth

Upstream work order in this repo (per `db/POSTGRES.md` §4): `booking_stays` +
`dim_calendar` → 6.3 unblocks; sale expiry fix + Bazaraki named areas +
enrichment columns → 6.4/6.5 complete; `area_fwd_daily` if the 6.2 forward
curve needs pre-aggregation at scale. Schema changes land here first — this
file and `schema.sql` are the source of truth; if a query in the PropSights
repo disagrees with this contract, this repo wins.
