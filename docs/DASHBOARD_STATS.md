# Dashboard Statistics — Serving Guide

**For the dashboard repo.** Every statistic below is servable **today** from
Postgres (`postgresql://bnb:bnb@localhost/bnb`) unless marked ⏳. Data
enriched and verified 2026-07-12; sample values are real. Full DDL in
[schema.sql](schema.sql), applied migration in
[migrations/2026-07-12_roi_pace_pricing.sql](migrations/2026-07-12_roi_pace_pricing.sql).

**Occupancy rule (unchanged):** `eff_occ` is the product metric; `raw_occ` /
`otb_raw_pct` are pipeline-health / pace-delta metrics — never present raw as
"occupancy" (Easter-week gap was 28pp).

**Operational note:** `booking_stays`, `dim_calendar`, `pricing_behavior`,
`area_pace`, and the new `sale_listings` columns (ROI + DOM) are one-off
backfills as of 2026-07-12. Wiring them into `sync_to_postgres.py` for
automatic refresh is a pending Data.Noesis task — check
`sync_meta`/`detected_at` maxima for freshness until then.

---

## A. ROI / Buy-side — `sale_listings` (28,857 active rows; 14,142 expired removed)

| Statistic | Display | Serve from | Notes |
|---|---|---|---|
| STR gross yield | number + map color | `str_gross_yield` | Comp-matched (26,272 rows filled). Median 8.4%, avg 8.8% — matches published Cyprus 8–12% |
| STR annual revenue estimate | number | `str_annual_revenue_est` | median comp ADR × median comp eff-occ × 365; comps shown via `str_comp_count/_tier/_adr/_eff_occ` |
| LTR gross yield + rent estimate | number | `ltr_gross_yield`, `ltr_monthly_rent_est` | 27,753 rows filled. Median 5.3% — matches published 4.5–6.5% |
| Cash-on-cash return | interactive sliders | frontend math | `(str_annual_revenue_est × 0.75 − debt_service) / cash_in`; all inputs in the row |
| Break-even occupancy | gauge vs area eff-occ | `break_even_occ_pct` | Assumes €3,600/yr fixed + 25% variable — state assumptions in UI, let sliders override |
| STR-vs-LTR parity occupancy | number | `str_ltr_parity_occ_pct` | "Above X% occupancy, STR beats long-term renting." Median 52.9% |
| Days on market | number + sort | `days_on_market`, `dom_left_censored` | Avg 55d. Show "≥" when censored flag set (scrape started Apr 2026) |
| Price cuts / motivated sellers | sortable list | `price_change_pct`, `n_price_drops`, `last_price_change_at` | 1,087 active listings with observed cuts; trajectory data thin until more post-fix runs accrue |
| €/m² by condition & build year | table / boxplot | `size_m2` + `condition`, `energy_efficiency`, `construction_year`, `construction_year_min/_max` | ✅ synced 2026-07-14. Stated year is ~20% filled — use the min/max range (87% of enriched actives): stated → description-extracted → condition-derived (`Under construction`→[Y−1,Y+1], `Brand new`→[Y−3,Y], Y=year(last_seen)). Resale without a year stays NULL |
| Reverse deal screener | ranked list | query over all of the above | e.g. `WHERE price < budget ORDER BY str_gross_yield DESC` with `str_comp_count ≥ 5` |

## B. Area health / supply — `str_listings`, `dim_areas`, `str_area_weekly`

| Statistic | Display | Serve from | Notes |
|---|---|---|---|
| Composite Area Score (0–100) | map color + league table | derived: `str_area_weekly` (occ, RevPAR trend, supply) + `sale_listings` yields | Weights are a product decision; all inputs served |
| New-listing ramp-up curve | line (occ by listing age) | `str_listings.first_seen` × `str_listings_weekly` | Weeks-to-first-booking via `booking_stays` join |
| Absorption rate | number per area | `str_listings.first_seen` × `booking_stays` | % of listings first seen ≤90d ago with ≥1 confident booking |
| Supply churn / net growth | numbers + trend | `str_listings.is_active`, `first_seen`, `last_seen` | Delistings = active→inactive transitions between syncs |

## C. Booking pace / lead time — `booking_stays` (198,948 stays) + `area_pace` (20,404 rows)

Filter `confidence ≥ 0.8 AND NOT stale_listing` for all demand analytics.

| Statistic | Display | Serve from | Notes |
|---|---|---|---|
| Lead-time ladder by stay month | bars | `booking_stays`: median `lead_time_days` by month(`first_night`) | Booked-night medians: May 6d → Jul 25d → Aug 65d → Sep 95d → Nov 151d. Forward months are right-censored — frame as "booked so far" |
| Lead time by district | map / table | same, group by `district` | Jul–Sep stays: Paphos 60d, Famagusta 62d, Larnaca 52d, Limassol 41d, Nicosia 26d |
| Booking-window planner | cumulative curve | `booking_stays`: CDF of `lead_time_days` per district × month | "X% of bookings on the books by N days out." `lead_time_days` is a lower bound (2-day scrape cadence) |
| Stay-length mix | stacked bars | `booking_stays.stay_length_nights` buckets 1–3 / 4–14 / 15–27 / 28+ | Median 10 nights resorts, 7 Nicosia |
| Mid-term / nomad demand share | number + trend | same, share of 15+ night stays | |
| OTB pickup curves | pace chart | `area_pace`: `otb_raw_pct` by `as_of_date` for a `stay_week` | 68 snapshots since March; e.g. CY wk of Aug 3: 11.4% → 56.2%. Compare stay-weeks at equal days-out; plot deltas, not levels |
| Booking velocity | number + WoW | `str_listings.bookings_30d`, `str_area_weekly.bookings` | already served pre-enrichment |

## D. Pricing intelligence — `pricing_behavior`, `pricing_calendar`, `booking_stays`

| Statistic | Display | Serve from | Notes |
|---|---|---|---|
| Area Discounting Index | number + monthly trend | `pricing_behavior.pct_cut10/pct_cut20/med_cut_depth_pct` | Jul CY: 32.9% of open dates cut ≥10%, median depth −20.9% |
| Hold-vs-cut conversion | paired bars | `pricing_behavior.conv_cut_pct` vs `conv_hold_pct` | Cutters convert better: Jul 51.1% vs 39.0%. Caveat (also in DDL): universe = dates still open at T-14 |
| Static-pricer share | number per district | `pricing_behavior.static_pricer_share` | ~3–4% never touch any price among the observed universe |
| Early-bird economics | scatter / number | `booking_stays.price_at_booking` vs `lead_time_days` | 87,927 stays with price-at-booking (Mar 26 onward) |
| Forward ADR curve | line by area/bedrooms | `pricing_calendar` × `str_listings` | Label honestly: prices are Tue/Fri check-in samples |
| Price dispersion (p25–p75) | band chart | `pricing_calendar` percentiles per area-week | Compression = commoditization signal |
| Revenue estimates / RevPAR | numbers + trend | `str_area_weekly.revenue_est`, `revpar` | shipped Jul 11 |
| Weekend premium | number | ⏳ blocked | Requires `run_pricing.py` check-in DOW rotation — no Sat/Sun price samples exist yet. `dim_calendar.is_weekend` is ready |
| Holiday uplift | annotations | ⏳ same blocker | `dim_calendar.is_holiday/holiday_name` (17 CY holidays) ready to join the moment prices cover those dates |

## E. Demand validation / trust

| Statistic | Display | Serve from | Notes |
|---|---|---|---|
| Seasonality / weekend / holiday context | chart annotations | `dim_calendar` (467 days) | join anything by `calendar_date` |
| Cancellation rate | number + trend | ⏳ DuckDB signal verified (150k booked-future-date reversals) — needs a `cancelled_at` pass + artifact filtering before publishing | high value, medium effort |
| Review velocity / rating trend | sparkline | ⏳ `reviews_bronze` in DuckDB (9,163 listings, median 6 snapshots) — needs B7 `listing_rating_history` sync | trivial sync addition |
| Data freshness badge | badge | `sync_meta` + `MAX(booking_stays.detected_at)` | trust is the product — always show "data as of" |

---

## Caveats the UI must carry

1. **Lead times are lower bounds** — detection lags real bookings by ≤2 days (scrape cadence).
2. **Forward-month lead-time stats are right-censored** — late bookers haven't booked yet.
3. **`area_pace` is raw unavailability** — owner blocks included; use deltas between `as_of_date`s.
4. **ROI figures are estimates from comps** (`str_comp_count`, `_tier` say how good); break-even assumptions (€3,600 fixed, 25% variable) must be user-adjustable or at least disclosed.
5. **DOM is left-censored** before 2026-04-15 (`dom_left_censored`).
6. **Pricing samples are Tue/Fri check-ins** until the scraper DOW rotation ships.
