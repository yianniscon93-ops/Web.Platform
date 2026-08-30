# PostgreSQL Serving Layer — Data Audit & Dashboard Analytics Plan

**Lead-analyst review, 2026-07-05.** Based on the full DuckDB backup snapshot of
2026-06-28 (`~/Desktop/backups/*.parquet` — live DB was locked by the pipeline).
Re-verify counts against the server before acting, but the structural findings
hold regardless.

This doc answers two questions:

1. **What does DuckDB hold that Postgres is missing (or getting wrong)?**
2. **What analytics should the PropSights dashboard actually serve?**

Architecture recap: the data pipelines (Core.Noesis + Data.* repos) scrape → DuckDB gold → `noesis.storage.postgres` sync → Postgres.py`
publishes pre-aggregated tables to Postgres. The product repo reads those
tables; the database is the contract. This repo owns the schema
([schema.sql](schema.sql)).

---

## 1. What DuckDB holds today (Jun 28 snapshot)

| DuckDB table | Rows | Synced to Postgres? |
|---|---:|---|
| `availability_log` (bronze) | 214.5M | No — raw, correctly excluded |
| `availability_latest` (silver) | 6.11M | Indirectly (via gold aggregates) |
| `gold` (59 cols) | 6.09M | **Partially** — occupancy + 22/25 amenities; booking dynamics, calendar context, season/holiday all dropped |
| `bookings` | 1.44M nights | Counts only (`bookings_30d`, `total_bookings`) |
| `pricing_silver` | 461k (155k past / 306k fwd) | Future dates only → `pricing_calendar` |
| `pricing_bronze` | 2.59M | No — price-change history unused (`pricing_gold` never built) |
| `listings` | 14,498 | Subset of columns → `str_listings` |
| `listings_v2` (+10 area cols) | 13,151 | **No — the entire geo hierarchy is missing** |
| `reviews_bronze` | 51k snapshots | Latest snapshot only |
| `bazaraki_sale_latest` (27 cols) | 34,478 | 15 of 27 columns → `sale_listings` (condition, energy_efficiency, construction_year + derived min/max added 2026-07-14) |
| `bazaraki_rental_latest` (25 cols) | 11,431 | 10 of 25 columns → `ltr_listings` |
| `bazaraki_sale_log` / `rental_log` | 108k / 16k | No — price history & days-on-market unused |

Coverage windows: gold spans 2026-03-21 → 2027-05-31; realized occupancy is
measured from the fixed inception 2026-04-01. STR side was fresh at snapshot
time (last availability run Jun 27). Bazaraki side was **not** — see P0 below.

---

## 2. Gap analysis

### P0 — correctness bugs feeding Postgres wrong data

**2.1 Bazaraki prices are 1000× too small for most rows.**
`_parse_price()` in [scraper/bazaraki_client.py](../scraper/bazaraki_client.py#L55)
handles `€405K` and comma-thousands (`€185,000`) but not dot-thousands.
Around Apr 19 Bazaraki switched to `€179.000`-style formatting →
`float("179.000")` = 179. Verified: listing 6381706 went €179,000 (Apr 15 run)
→ €179 (every run since).

- `bazaraki_sale_latest`: **28,746 of 34,478 rows (83%) have price < €1,000** (median "€360").
- `bazaraki_rental_latest`: **6,627 of 11,431 rows (58%) have rent < €100**.
- These flow straight into Postgres `sale_listings.price` / `ltr_listings.monthly_rent`.

Every price, €/m², yield, and rent figure on the buy-side of the dashboard is
garbage until this is fixed. Fix the parser (detect `\.\d{3}\b` as thousands),
re-scrape, and backfill `*_latest` from the Apr 15 run (the last fully sane one)
for listings not re-scraped. Then re-sync `ltr,sale`.

**2.2 Bazaraki runners stalled since May 15.**
Scheduled for the 1st & 15th, but the logs contain no June runs (sale: 5 runs
ending 2026-05-15; rental: 3 runs). At snapshot time the Postgres Bazaraki
tables were 6+ weeks stale. Check the server cron/timers.

**2.3 Sale-side expiry detection never fires.**
`expired_at` is set on 3,465 rental rows but on **zero** of 34,478 sale rows.
The sync filter `WHERE expired_at IS NULL` therefore publishes every sale
listing ever seen — sold/withdrawn stock inflates supply counts and skews price
distributions, and days-on-market can't be computed. Wire the same expiry pass
the rental flow gets (or mark `expired_at` when a listing misses N consecutive
runs).

**2.4 Delisted STRs leak into `str_listings` with no active flag.**
580 listings not seen by discovery since before Jun 1 (168 never re-seen at
all) still sync because they have gold rows in the occupancy window. Their
`fwd60` numbers are meaningless (frozen calendars read as 100% blocked or 100%
open). Add `is_active BOOLEAN` (e.g. `last_seen_at` within 45 days) so the
dashboard can default-filter dead supply instead of every consumer reinventing
the cutoff.

### P1 — high-value data that exists in DuckDB but is not published

**2.5 Geographic hierarchy (`listings_v2.area_*`) — the biggest product gap.**
`str_listings.area` carries internal scrape-bbox codenames
(`paphos_coast_other`, `larnaca_other`, `kokkinochoria_other`) — meaningless to
a paying user. Meanwhile `listings_v2` has `area_district` (100% coverage,
5 districts), `area_municipality` (90%), `area_community`, `area_tourist_area`
(4,407 rows), plus assignment confidence — none synced. Publish
`district / municipality / community / tourist_area` on `str_listings` and use
them as the grouping keys for area aggregates. Same assigner should populate
the currently-NULL `area` on `sale_listings` / `ltr_listings` (coordinates
exist; `postal_code` is also available on ~9k sale rows). Until this ships, no
two datasets (STR / sale / LTR) can be compared by named area — only by polygon.

**2.6 Booking dynamics — 921k booked-night rows with `booking_id`,
`booking_lead_time_days`, `stay_length_nights`, `stay_position` — all dropped.**
This is the data competitors (AirDNA etc.) can't fake and it's already
computed. Median lead time by stay month: Jun 10d → Jul 43d → Aug 76d → Sep
107d → Oct 137d. That's a booking-pace curve begging to be charted. Publish a
`booking_stays` table (one row per stay) or pre-aggregated pace tables (§4).

**2.7 Calendar context — `season`, `is_holiday`, `holiday_name` (17 Cyprus
holidays incl. movable feasts), `day_of_week`, `is_weekend`.** Deterministic,
tiny, and required for seasonality/weekend/holiday analytics. Publish as a
`dim_calendar` table (~800 rows) instead of denormalizing.

**2.8 Bazaraki enrichment attributes — 15 of 25 columns dropped.**
Available and well-covered on the sale side: `bathrooms` (33k), `condition`
(34k), `energy_efficiency` (34k), `furnishing` (19k), `construction_year` (8k),
`postal_code` (9k), `floor`, `parking`, `air_conditioning`. €/m² segmented by
condition and construction year is core buy-side analytics; energy efficiency
is an EU-mandated label buyers actively filter on. Add to `sale_listings` /
`ltr_listings`.

**2.9 Price history & days-on-market (Bazaraki logs).**
`first_seen` / `last_seen` / `price_changed` already track listing lifecycle;
the logs hold per-run price trajectories. After the P0 parser fix this gives
price-cut counts, % discounts, and DOM — the strongest "motivated seller"
signals a buy-side user can get. Publish `sale_price_history` + derived
`days_on_market`, `price_drop_pct` columns. (Pre-fix, the only clean baseline
is the Apr 15 run.)

**2.10 Revenue estimates are stubbed, but computable today.**
`str_area_weekly.revenue_estimate` is synced as literal NULL, and the four ROI
columns on `sale_listings` are NULL. Yet gold already supports:
`revenue_est = Σ(booking_confidence × price_per_night)` per listing/week, and
`RevPAR = eff_occ × ADR`. Listing-level annual revenue estimates then unlock
the `sale_listings` ROI columns via PostGIS comp-matching (`ST_DWithin` +
bedroom match → median ADR & eff-occ → `str_gross_yield`). Blocked only by the
P0 price fix on the denominator side.

### P2 — smaller omissions, cheap to add

- **Rating history**: `reviews_bronze` has up to 18 snapshots/listing; 2,352
  listings show rating movement. Only the latest is synced. A reputation-trend
  spark line is a differentiator for host users.
- **`min_nights`**: not synced at all. It's both a user filter and market
  structure (mode is 3 nights; 8k future dates require 14+).
- **3 of 25 amenity flags** silently missing from the sync list:
  `has_pack_n_play`, `has_kids_toys`, `has_exercise_equipment`.
- **`city`, `proximity_airport_min`, `host_type`, `guest_profile`** on
  `listings` — not synced (the last two only ~20–30% covered, still useful).
- **Historical pricing**: `pricing_calendar` only receives future dates; rows
  for past dates persist only because the sync never deletes — i.e. history
  accretes from the late-June go-live, with nothing before. `pricing_bronze`
  (2.6M rows) would additionally give price-vs-lead-time dynamics — that's the
  planned `pricing_gold`, still unbuilt.

---

## 3. Dashboard analytics — what stakeholders should see

Recommendation, ranked by value per persona. Product vision is Yiannis's call —
treat this as the analyst's menu of what the data can credibly serve, not a
frontend spec. ✅ = servable from current Postgres tables today; 🔶 = needs a
§2/§4 item first.

### Personas

- **A. STR investor / property buyer** (primary paying persona)
- **B. Host / operator** (owns listings, wants to benchmark & price)
- **C. LTR investor / relocator** (rent-side)
- **D. Market analyst / agency** (macro view, reports)

### 3.1 Market Pulse (landing, all personas) — mostly ✅

- Headline KPIs with WoW deltas: active supply, effective occupancy (to-date),
  forward-60 occupancy, ADR, **RevPAR = eff_occ × ADR**, bookings last 30d.
  From `str_listings` + `str_area_weekly`; RevPAR is a trivial derived column.
- Trend strip: weekly eff-occ / ADR / bookings per district, from
  `str_area_weekly`. 🔶 needs district labels (§2.5) to be user-readable.
- Freshness badge from `sync_meta` — always show "data as of"; trust is the
  product.

### 3.2 Polygon / Map Explorer (A, C, D) — ✅ core, 🔶 polish

The existing free-tier flow (`ST_Within` over `str_listings.geog`) plus:
occupancy/ADR/RevPAR distribution (median + p25/p75, not just mean — Cyprus
prices are heavy-tailed), amenity mix, supply by bedrooms. 🔶 `is_active`
filter (§2.4) or dead listings pollute every polygon result.

### 3.3 Area League Table & Drill-down (A, D) — ✅ / 🔶

- Quadrant scatter: eff-occ vs ADR per area, bubble = supply → instantly shows
  underpriced/overheated areas. From `str_area_weekly` latest week.
- Area drill-down: weekly occ/ADR/bookings trend, supply growth, seasonality
  curve (🔶 `dim_calendar` §2.7 to label peak/shoulder/off).

### 3.4 Booking Pace & Demand Timing (A, B — the differentiator) — 🔶 §2.6

- **Lead-time curve**: median days-booked-in-advance by stay month (10d for
  June → 137d for October). Tells hosts *when* demand for their season
  materializes — no Cyprus competitor shows this.
- **Pickup / pace**: occupancy-on-the-books at 30/60/90 days before arrival vs
  same point for earlier months — early-warning for a weak season.
- **Stay-length mix**: 1–3 night city breaks vs 7-night resort stays by area —
  drives min-stay strategy (pairs with `min_nights` §2).

### 3.5 Pricing Intelligence (B) — ✅ / 🔶

- Forward ADR curve by area & bedrooms from `pricing_calendar` (✅ data is
  there today).
- Weekend premium and holiday uplift (🔶 `dim_calendar`).
- "Your rate vs comps": listing ADR percentile within polygon/area comp set —
  computable from `pricing_calendar` + `str_listings`.
- Amenity premiums: eff-occ / ADR delta for pool, sea view, hot tub within an
  area (✅ computable from `str_listings` flags; consider pre-aggregating).

### 3.6 Listing Benchmark Card (B, paid) — ✅

One listing vs its comp set: eff-occ percentile, ADR percentile, rating,
review count, amenities it lacks that comps have, weekly history from
`str_listings_weekly`. 🔶 rating trend needs §2 rating history.

### 3.7 Buy-Side / Investment Screener (A — the money screen) — 🔶 blocked on P0

- Sale supply, €/m² by district & condition & construction year
  (needs §2.1 fix + §2.8 attributes).
- **Price cuts & days-on-market** (§2.9) — "motivated seller" list.
- **Yield map**: STR gross yield (comp-matched revenue estimate ÷ price) and
  LTR gross yield (comp-matched rent ×12 ÷ price) per polygon (§2.10). The
  `sale_listings` ROI columns were reserved for exactly this.
- Rent vs STR arbitrage: same property, `ltr_monthly_rent_est` vs
  `str_annual_revenue_est / 12` — which strategy wins where.

### 3.8 LTR Market (C) — 🔶 blocked on P0

Median rent by bedrooms & district, rent trend per run, supply. (Verified
sane subset today: 1br €780 / 2br €1,200 / 3br €1,800 medians — but 58% of
rows are corrupted, so fix first.)

**Deliberately excluded** (data can't support them honestly): host revenue
actuals (we estimate, we don't observe payouts), review text/sentiment (not
scraped), and anything from `raw_occ` presented as "occupancy" — raw is a
pipeline-health metric, effective is the product metric (raw−eff gap was
28pp at Easter; see §5).

---

## 4. Phase B — proposed schema additions

In priority order. All follow the existing pattern: DuckDB aggregates at sync
time, Postgres stores query-ready rows, upsert never truncates.

| # | Change | Unblocks |
|---|---|---|
| B0 | **Fix Bazaraki parser + backfill + restart runners + sale expiry** (P0, §2.1–2.3) | every € figure on buy-side |
| B1 | `str_listings` += `district`, `municipality`, `community`, `tourist_area`, `is_active`, `city`, `min_nights_mode`, 3 missing amenity flags, `proximity_airport_min`; same geo columns on `sale_listings`/`ltr_listings` via assigner | §3.1–3.3, honest polygons |
| B2 | `str_area_weekly.revenue_estimate` = Σ(confidence × price); add `revpar`; keyed by district not bbox codename | §3.1, §3.3 |
| B3 | `dim_calendar` (date, dow, is_weekend, season, is_holiday, holiday_name) — ~800 rows | §3.4, §3.5 |
| B4 | `booking_stays` (booking_id PK, listing_id, area, first_night, stay_length_nights, lead_time_days, detected_at, confidence, est_value) — one row per stay from gold | §3.4 |
| B5 | `sale_listings`/`ltr_listings` += `bathrooms`, `condition` ✅, `furnishing`, `construction_year` ✅ (+ derived `construction_year_min/_max` ✅, sale only, 2026-07-14), `energy_efficiency` ✅, `postal_code`, `days_on_market` ✅, `price_drop_pct` ✅, `last_price_change_at` ✅; new `sale_price_history` (listing_id, observed_at, price) | §3.7, §3.8 |
| B6 | ROI comp-matching job → populate `sale_listings.str_annual_revenue_est`, `str_gross_yield`, `ltr_monthly_rent_est`, `ltr_gross_yield` (PostGIS `ST_DWithin` + bedrooms) | §3.7 yield map |
| B7 | `listing_rating_history` (listing_id, snapshot_date, avg_rating, review_count) from `reviews_bronze` | §3.6 |
| B8 | `pricing_gold` in DuckDB (price-change dynamics from `pricing_bronze`), then a pace/pricing dynamics table | §3.5 depth |

---

## 5. Occupancy model (unchanged — product team must read)

Two flavours, both 0–100, one decimal:

- **raw** = unavailable ÷ total dates. Includes owner blocks, min-stay gaps,
  stale listings. Pipeline-health metric only.
- **effective** = Σ booking_confidence ÷ (covered − dead_inventory). Real guest
  demand — **the product metric**. Always ≤ raw; Easter-week gap was 28pp.

Two windows: `*_todate` (realized, fixed start 2026-04-01 → yesterday,
per-listing `coverage_days` as denominator) and `*_fwd60` (today → +59,
booking pace). Definitions match the legacy `_ADJ_OCC_SQL` so numbers
reconcile across views.

---

## 6. Operations reference

**Current Postgres tables (Phase A Jun 2026 + landing-page additions Jul 11):**
`dim_areas` (157-row Cyprus hierarchy — search bar / named-area filtering,
active `listing_count` per area), `str_listings` (1 row/listing, PostGIS
`geog`, GiST-indexed; now carries `district/municipality/community/
tourist_area/area_label` + `is_active` — §2.4 delisted-leak fixed),
`str_listings_weekly` (~880k rows — the workhorse for polygon + filters +
week-range queries), `str_area_weekly` (rekeyed by `dim_areas.area_id` at
every hierarchy level + `CY` island row; adds `booked_nights`, `revpar`,
`revenue_est` — §2.5/B1/B2 shipped), `pricing_calendar` (~300k rows, weekly
cadence), `ltr_listings`, `sale_listings`, `sync_meta` (freshness, single
row). Full DDL in [schema.sql](schema.sql); migrations in
[migrations/](migrations/). Tier gating lives in the product API (live
`SELECT tier FROM users`, not JWT claims), never in the DB.

**Landing-page product decisions (Jul 2026):** map-centric landing merges
Market Pulse + Map Explorer; date picker is week-resolution; selection
(area/polygon + dates + filters) is global context followed by all pages.
Named-area selection filters by assigned area columns (consistent with the
radius-based assigner), not boundary polygons (we have none — centroids +
radii only).

**Connect:**

```bash
ssh root@204.168.209.175                      # Hetzner CX22, Helsinki
sudo -u postgres psql -d bnb                  # admin / DDL
psql postgresql://bnb:bnb@localhost/bnb       # application user
```

`DATABASE_URL=postgresql://bnb:bnb@localhost/bnb` in `/opt/data-str/.env`.
Postgres listens on `localhost` only — the product API either runs on this
server or the network question gets decided first (open item).

**Sync:** runs automatically at the end of each pipeline job (gated on
`DATABASE_URL`). Manual:

```bash
cd /opt/data-str
/opt/noesis-venv/bin/python -m noesis.storage.postgres --all       # everything (~37s)
/opt/noesis-venv/bin/python -m noesis.storage.postgres --domains str,weekly  # subset
```

Domains: `str, weekly, area, meta, pricing, ltr, sale` — one transaction each;
a failing domain rolls back alone. Cadences: availability domains every 48h,
`pricing` weekly, `ltr`/`sale` on the 1st & 15th (**currently stalled — §2.2**).

**Standing item:** rotate the Gmail app password (committed to git history);
env it in `run_discovery.py` / `run_enrichment.py` as `SMTP_PASSWORD`.
