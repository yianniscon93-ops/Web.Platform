"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { MarketResponse, SlotView, WeeklyRow } from "@/lib/dashboard/types";
import { fmtEuro, fmtInt, fmtPct } from "@/lib/dashboard/format";
import { AMENITIES } from "@/lib/dashboard/filters";
import { CY_EVENTS } from "@/lib/dashboard/events";
import { currentWeekMonday } from "@/lib/dashboard/weeks";
import type { ExplainerId } from "@/lib/dashboard/explain";
import { UI } from "./tokens";
import { TrendChart, ImpactQuadrant, type TrendSeries, type QuadPoint } from "./charts";
import { CompareTable, bestIndex, type CompareRow } from "./compare";
import Explain, { StatLabel } from "./Explain";

const fmtWeek = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const AMENITY_LABEL = new Map(AMENITIES.map((a) => [a.key, a.label]));
const NEG = "#D98B6A"; // warm terracotta for declines — no cool tones

const THIN_SAMPLE = 80; // fewer "with" listings than this → dim + flag as low-confidence
const signColor = (v: number | null) => (v == null ? UI.muted : v >= 0 ? UI.green : NEG);
const fmtSignedPp = (v: number | null) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}pp`);
const fmtSignedEuro = (v: number | null) =>
  v == null ? "—" : `${v >= 0 ? "+" : "−"}${fmtEuro(Math.abs(v))}`;

type MetricKey = "effOcc" | "medianAdr" | "revpar" | "bookings" | "listings";

function metricOf(w: WeeklyRow | undefined, m: MetricKey): number | null {
  return w ? (w[m] as number | null) : null;
}

/** Range aggregates: averages for rates/occupancy/volumes-per-listing, totals for raw volumes.
 * Occupancy is weighted by weekly listing counts so big weeks count more. */
function aggregate(rows: WeeklyRow[]) {
  const nums = (k: keyof WeeklyRow) =>
    rows.map((r) => r[k] as number | null).filter((v): v is number => v != null);
  const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const sum = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) : null);
  const occRows = rows.filter((r) => r.effOcc != null);
  const occW = occRows.reduce((s, r) => s + (r.listings ?? 1), 0);
  const avgListings = mean(nums("listings"));
  const totalBookings = sum(nums("bookings"));
  const hasRevEst = rows.some((r) => r.revenueEst != null);
  const totalRevEst = hasRevEst ? sum(nums("revenueEst")) : null;
  return {
    listings: avgListings,
    effOcc: occW ? occRows.reduce((s, r) => s + r.effOcc! * (r.listings ?? 1), 0) / occW : null,
    medianAdr: mean(nums("medianAdr")),
    revpar: mean(nums("revpar")),
    bookings: totalBookings,
    bookingsPerListing:
      totalBookings != null && avgListings ? totalBookings / avgListings : null,
    revenueEst: totalRevEst,
    revenuePerListing:
      totalRevEst != null && avgListings ? totalRevEst / avgListings : null,
  };
}

function DeltaBadge({ delta, fmt, suffix }: { delta: number | null; fmt: (v: number) => string; suffix?: string }) {
  if (delta == null)
    return (
      <span className="text-[13px]" style={{ color: UI.faint }}>
        —
      </span>
    );
  const up = delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[13px] font-bold px-1.5 py-0.5 rounded-md"
      style={{
        color: up ? UI.green : NEG,
        background: up ? "rgba(143,204,128,0.1)" : "rgba(217,139,106,0.1)",
      }}
    >
      {up ? "▲" : "▼"} {fmt(Math.abs(delta))}
      {suffix}
    </span>
  );
}

export default function MarketTab({ slots }: { slots: SlotView[] }) {
  if (slots.length > 1) return <CompareMarket slots={slots} />;
  return <SingleMarket market={slots[0]?.market ?? null} />;
}

function SingleMarket({ market }: { market: MarketResponse | null }) {
  const [impactExpanded, setImpactExpanded] = useState(false);
  const cur = currentWeekMonday();
  const weekly = market?.weekly ?? [];
  const realized = weekly.filter((w) => w.weekStart < cur);
  // KPIs aggregate over the completed weeks inside the picked range so
  // they respond to the calendar. All-forward ranges show booking pace.
  const scope = realized.length ? realized : weekly;
  const kpiIsForward = realized.length === 0 && weekly.length > 0;
  const agg = aggregate(scope);
  // WoW badge: the two most recent completed weeks inside the scope. In
  // forward mode there is no "change" — later weeks simply have less on the
  // books yet — so the badge is suppressed entirely.
  const kpiWeek = scope.at(-1);
  const prevWeek = !kpiIsForward && scope.length >= 2 ? scope.at(-2) : undefined;

  const kpis: Array<{
    id: ExplainerId;
    label: string;
    value: string;
    delta: number | null;
    deltaFmt: (v: number) => string;
    deltaSuffix?: string;
    accent?: boolean;
    explainAlign?: "left" | "center" | "right";
  }> = [
    {
      id: "listings",
      label: "Listings tracked",
      value: fmtInt(agg.listings),
      delta: null,
      deltaFmt: fmtInt,
    },
    {
      id: kpiIsForward ? "on_the_books" : "eff_occ",
      label: kpiIsForward ? "Occupancy · on the books" : "Occupancy",
      value: fmtPct(agg.effOcc),
      delta:
        prevWeek && metricOf(kpiWeek, "effOcc") != null && metricOf(prevWeek, "effOcc") != null
          ? metricOf(kpiWeek, "effOcc")! - metricOf(prevWeek, "effOcc")!
          : null,
      deltaFmt: (v) => v.toFixed(1),
      deltaSuffix: "pp",
      accent: true,
    },
    {
      id: "median_adr",
      label: "Median nightly rate",
      value: fmtEuro(agg.medianAdr != null ? Math.round(agg.medianAdr) : null),
      delta:
        prevWeek && metricOf(kpiWeek, "medianAdr") != null && metricOf(prevWeek, "medianAdr") != null
          ? metricOf(kpiWeek, "medianAdr")! - metricOf(prevWeek, "medianAdr")!
          : null,
      deltaFmt: (v) => fmtEuro(Math.round(v)),
    },
    {
      id: "revpar",
      label: "RevPAR",
      value: fmtEuro(agg.revpar != null ? Math.round(agg.revpar) : null),
      delta:
        prevWeek && metricOf(kpiWeek, "revpar") != null && metricOf(prevWeek, "revpar") != null
          ? metricOf(kpiWeek, "revpar")! - metricOf(prevWeek, "revpar")!
          : null,
      deltaFmt: (v) => fmtEuro(Math.round(v)),
    },
    {
      id: "bookings",
      label: "Avg bookings / listing",
      value: agg.bookingsPerListing != null ? agg.bookingsPerListing.toFixed(1) : "—",
      delta:
        prevWeek && metricOf(kpiWeek, "bookings") != null && metricOf(prevWeek, "bookings") != null &&
        kpiWeek?.listings && prevWeek?.listings
          ? metricOf(kpiWeek, "bookings")! / kpiWeek.listings - metricOf(prevWeek, "bookings")! / prevWeek.listings
          : null,
      deltaFmt: (v) => v.toFixed(2),
    },
  ];
  if (agg.revenuePerListing != null) {
    kpis.push({
      id: "revenue_est",
      label: "Avg est. revenue / listing",
      value: fmtEuro(Math.round(agg.revenuePerListing)),
      delta:
        prevWeek?.revenueEst != null && kpiWeek?.revenueEst != null &&
        kpiWeek?.listings && prevWeek?.listings
          ? kpiWeek.revenueEst / kpiWeek.listings - prevWeek.revenueEst / prevWeek.listings
          : null,
      deltaFmt: (v) => fmtEuro(Math.round(v)),
      explainAlign: "right",
    });
  }

  const benchSeries = (metric: MetricKey): TrendSeries[] =>
    (market?.benchmarks ?? []).slice(0, 2).map((b, i) => ({
      label: b.label,
      color: i === 0 ? UI.oliveLight : "#C9B891",
      dashed: i !== 0,
      data: b.weekly.map((w) => ({ x: w.weekStart, y: w[metric] as number | null })),
    }));

  const mainSeries = (metric: MetricKey, label: string): TrendSeries => ({
    label,
    color: UI.green,
    data: weekly.map((w) => ({ x: w.weekStart, y: w[metric] as number | null })),
  });

  const snap = market?.snapshot ?? null;
  const impact = snap?.amenityImpact ?? [];
  // Curated default = biggest reliable gainers + any genuine losers; the rest
  // appear only on "view all". Thin-sample amenities never make the default.
  const solid = impact.filter((a) => a.nWith >= THIN_SAMPLE);
  const standoutKeys = new Set(
    [
      ...solid.filter((a) => (a.revLift ?? 0) > 0).slice(0, 5),
      ...solid.filter((a) => (a.revLift ?? 0) < 0).slice(-2),
    ].map((a) => a.key)
  );
  if (standoutKeys.size === 0) impact.slice(0, 5).forEach((a) => standoutKeys.add(a.key));
  const toQuad = (a: (typeof impact)[number]): QuadPoint => ({
    key: a.key,
    label: AMENITY_LABEL.get(a.key) ?? a.key,
    x: a.occLift ?? 0,
    y: a.ratePct ?? 0,
    size: a.revLift ?? 0,
    tone: (a.revLift ?? 0) < 0 ? "neg" : "pos",
    thin: a.nWith < THIN_SAMPLE,
    labeled: standoutKeys.has(a.key),
    tip: [
      { label: "Revenue / night", value: fmtSignedEuro(a.revLift), color: signColor(a.revLift) },
      { label: "Occupancy", value: fmtSignedPp(a.occLift), color: signColor(a.occLift) },
      {
        label: "Price",
        value:
          a.rateLift != null
            ? `${fmtSignedEuro(a.rateLift)}${a.ratePct != null ? ` (${a.ratePct >= 0 ? "+" : "−"}${Math.abs(a.ratePct)}%)` : ""}`
            : "—",
      },
      { label: "Listings (with/without)", value: `${a.nWith} / ${a.nWithout}` },
    ],
  });
  const quadPoints = (impactExpanded ? impact : impact.filter((a) => standoutKeys.has(a.key))).map(toQuad);
  const beds = snap?.bedrooms ?? [];
  const bedTotal = beds.reduce((s, b) => s + b.count, 0);
  const maxBedRev = Math.max(1, ...beds.map((b) => b.revpar ?? 0));

  return (
    <div>
      {market?.filtersIgnored && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-2.5 text-[15px]"
          style={{ background: "rgba(217,139,106,0.08)", border: "1px solid rgba(217,139,106,0.25)", color: UI.text }}
        >
          <Info size={15} style={{ color: NEG }} className="shrink-0" />
          Attribute filters aren&apos;t available yet for this small area type — showing all its
          listings instead. Pick a town, resort or district to filter.
        </div>
      )}

      {/* KPI cards — latest completed week in the picked range, with WoW */}
      <motion.div
        key={kpiWeek?.weekStart ?? "loading"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5"
      >
        {kpis.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl px-4 py-3.5">
            <div className="flex items-center justify-between gap-1">
              <p className="font-display font-bold text-2xl leading-none" style={{ color: c.accent ? UI.green : UI.text }}>
                {c.value}
              </p>
              <DeltaBadge delta={c.delta} fmt={c.deltaFmt} suffix={c.deltaSuffix} />
            </div>
            <p className="text-[13px] mt-2 uppercase tracking-wider font-medium flex items-center gap-1.5" style={{ color: UI.muted }}>
              {c.label}
              <Explain id={c.id} align={c.explainAlign ?? "left"} />
            </p>
          </div>
        ))}
      </motion.div>
      {scope.length > 0 && (
        <p className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: UI.faint }}>
          {kpiIsForward
            ? `On the books across ${scope.length} upcoming ${scope.length === 1 ? "week" : "weeks"}`
            : `Across ${scope.length} completed ${scope.length === 1 ? "week" : "weeks"} (${fmtWeek(scope[0].weekStart)} – ${fmtWeek(scope[scope.length - 1].weekStart)})`}
          {" "}· averages for rates, occupancy & per-listing volumes
          <Explain id="range_agg" align="left" />
          {prevWeek && (
            <>
              · badge = change in the latest week
              <Explain id="wow" align="left" />
            </>
          )}
        </p>
      )}

      {/* Trends — split at the current week (realized | on the books) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="eff_occ" align="left">
              Weekly occupancy
            </StatLabel>
            <span className="text-[13px] flex items-center gap-1.5" style={{ color: UI.faint }}>
              % · dots &amp; shading mark events
              <Explain id="event_overlay" align="right" />
            </span>
          </div>
          <TrendChart
            main={mainSeries("effOcc", "Selection")}
            benchmarks={benchSeries("effOcc")}
            splitX={cur}
            yFmt={(v) => `${v.toFixed(1)}%`}
            xFmt={fmtWeek}
            events={CY_EVENTS}
            emptyLabel="No weekly data in this range"
          />
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="median_adr" align="left">
              Weekly median rate
            </StatLabel>
            <span className="text-[13px]" style={{ color: UI.faint }}>
              € / night
            </span>
          </div>
          <TrendChart
            main={mainSeries("medianAdr", "Selection")}
            benchmarks={benchSeries("medianAdr")}
            splitX={cur}
            yFmt={(v) => fmtEuro(v)}
            xFmt={fmtWeek}
            events={CY_EVENTS}
            emptyLabel="No weekly data in this range"
          />
        </div>
      </div>

      {/* What each amenity is worth — impact quadrant (occupancy × price,
          bubble = revenue), like-for-like by bedroom×type. Default = the
          standouts; "view all" reveals the rest. Association, not causation. */}
      {snap && impact.length > 0 && (
        <div className="glass-card rounded-2xl p-5 mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <StatLabel id="amenity_impact" align="left">
              What each amenity is worth here
            </StatLabel>
            <span className="text-[14px]" style={{ color: UI.faint }}>
              vs similar-size, same-type places
            </span>
          </div>
          <p className="text-[14px] mb-3" style={{ color: UI.faint }}>
            Right = higher occupancy · up = higher price · bigger bubble = more
            revenue a night. An association, not a guarantee.
          </p>
          <ImpactQuadrant
            points={quadPoints}
            xLabel="Occupancy increase  →"
            yLabel="Price increase  ↑"
            xFmt={(v) => `${v > 0 ? "+" : ""}${v}`}
            yFmt={(v) => `${v > 0 ? "+" : ""}${v}%`}
            corners={{ tl: "PREMIUM DRAW", tr: "TOP ALL-ROUNDER", br: "CROWD-PLEASER" }}
          />
          <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: UI.green }} /> earns more
              </span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: NEG }} /> earns less
              </span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.faint }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block border" style={{ borderColor: UI.faint, borderStyle: "dashed" }} /> thin sample
              </span>
            </div>
            {impact.length > quadPoints.length || impactExpanded ? (
              <button
                onClick={() => setImpactExpanded((v) => !v)}
                className="text-[14px] font-semibold transition-colors hover:opacity-80"
                style={{ color: UI.green }}
              >
                {impactExpanded ? "Show fewer" : `View all ${impact.length} amenities`}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Supply vs return by size — how many of each size, and what they earn. */}
      {snap && beds.length > 0 && bedTotal > 0 && (
        <div className="glass-card rounded-2xl p-5 mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <StatLabel id="supply_return" align="left">
              Supply vs return, by size
            </StatLabel>
            <span className="text-[14px]" style={{ color: UI.faint }}>
              today
            </span>
          </div>
          <p className="text-[14px] mb-4" style={{ color: UI.faint }}>
            How common each size is here, next to what it actually earns a night — where the
            competition is vs where the money is.
          </p>
          <div className="grid gap-2" style={{ gridTemplateColumns: "64px 1fr 1fr", alignItems: "center" }}>
            <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: UI.faint }}>Size</span>
            <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: UI.faint }}>Share of listings</span>
            <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: UI.faint }}>Median €/night</span>
            {beds.map((b) => {
              const share = bedTotal ? (100 * b.count) / bedTotal : 0;
              const isTop = b.revpar != null && b.revpar === maxBedRev && maxBedRev > 1;
              return (
                <Fragment key={b.label}>
                  <span className="text-[14px] font-semibold" style={{ color: UI.text }}>{b.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="relative block h-2 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${share}%`, background: "linear-gradient(90deg,#4A5E3A,#6B7B4F)" }} />
                    </span>
                    <span className="text-[13px] tabular-nums w-9 text-right" style={{ color: UI.muted }}>{share.toFixed(0)}%</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="relative block h-2 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${b.revpar != null ? (b.revpar / maxBedRev) * 100 : 0}%`, background: isTop ? UI.green : "linear-gradient(90deg,rgba(143,204,128,0.7),#8FCC80)" }} />
                    </span>
                    <span className="text-[14px] font-bold tabular-nums w-12 text-right" style={{ color: isTop ? UI.green : UI.text }}>
                      {b.revpar != null ? fmtEuro(b.revpar) : "—"}
                    </span>
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison mode — every metric split by slot, like for like.
// ---------------------------------------------------------------------------

function CompareMarket({ slots }: { slots: SlotView[] }) {
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const cur = currentWeekMonday();

  const per = slots.map((v) => {
    const weekly = v.market?.weekly ?? [];
    const realized = weekly.filter((w) => w.weekStart < cur);
    const scope = realized.length ? realized : weekly;
    return { v, weekly, scope, agg: aggregate(scope), isForward: realized.length === 0 && weekly.length > 0 };
  });
  const allForward = per.every((p) => p.isForward) && per.some((p) => p.weekly.length > 0);
  const scopeLens = per.map((p) => p.scope.length).filter((n) => n > 0);

  const occs = per.map((p) => p.agg.effOcc);
  const revpars = per.map((p) => p.agg.revpar);
  const bookingsPer = per.map((p) => p.agg.bookingsPerListing);
  const revenuePer = per.map((p) => p.agg.revenuePerListing);

  const rows: CompareRow[] = [
    {
      label: "Listings tracked",
      explain: "listings",
      values: per.map((p) => fmtInt(p.agg.listings)),
      best: null,
    },
    {
      label: allForward ? "Occupancy · on the books" : "Occupancy",
      explain: allForward ? "on_the_books" : "eff_occ",
      values: occs.map((v) => fmtPct(v)),
      best: bestIndex(occs),
    },
    {
      label: "Median nightly rate",
      explain: "median_adr",
      values: per.map((p) => fmtEuro(p.agg.medianAdr != null ? Math.round(p.agg.medianAdr) : null)),
      best: null,
    },
    {
      label: "RevPAR",
      explain: "revpar",
      values: revpars.map((v) => fmtEuro(v != null ? Math.round(v) : null)),
      best: bestIndex(revpars),
    },
    {
      label: "Avg bookings / listing",
      explain: "bookings",
      values: bookingsPer.map((v) => (v != null ? v.toFixed(1) : null)),
      best: bestIndex(bookingsPer),
    },
  ];
  if (revenuePer.some((v) => v != null)) {
    rows.push({
      label: "Avg est. revenue / listing",
      explain: "revenue_est",
      values: revenuePer.map((v) => fmtEuro(v != null ? Math.round(v) : null)),
      best: bestIndex(revenuePer),
    });
  }

  const slotSeries = (metric: MetricKey): TrendSeries[] =>
    slots.map((v) => ({
      label: v.label,
      color: v.color,
      dashed: v.dash,
      data: (v.market?.weekly ?? []).map((w) => ({ x: w.weekStart, y: w[metric] as number | null })),
    }));

  const ignored = slots.filter((v) => v.market?.filtersIgnored);

  // Snapshot comparisons (current-state, ignores the week picker).
  const snaps = slots.map((v) => v.market?.snapshot ?? null);
  const amenityKeysAll = [...new Set(snaps.flatMap((s) => s?.amenities.map((a) => a.key) ?? []))]
    .map((key) => ({
      key,
      maxShare: Math.max(...snaps.map((s) => s?.amenities.find((a) => a.key === key)?.share ?? 0)),
    }))
    .sort((a, b) => b.maxShare - a.maxShare)
    .map((e) => e.key);
  const amenityKeys = amenitiesExpanded ? amenityKeysAll : amenityKeysAll.slice(0, 8);

  return (
    <div>
      {ignored.length > 0 && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-2.5 text-[15px]"
          style={{ background: "rgba(217,139,106,0.08)", border: "1px solid rgba(217,139,106,0.25)", color: UI.text }}
        >
          <Info size={15} style={{ color: NEG }} className="shrink-0" />
          Attribute filters aren&apos;t available for{" "}
          <b>{ignored.map((v) => v.label).join(", ")}</b> (small area type) — those columns show
          all listings instead.
        </div>
      )}

      {/* KPI matrix — replaces the KPI cards in comparison mode */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <StatLabel id="compare" align="left">
            Head to head
          </StatLabel>
          <span className="text-[13px]" style={{ color: UI.faint }}>
            {allForward
              ? "on the books · upcoming weeks in your range"
              : `over ${Math.max(...scopeLens, 0)} completed ${Math.max(...scopeLens, 0) === 1 ? "week" : "weeks"} in your range`}
          </span>
        </div>
        <CompareTable slots={slots} rows={rows} />
      </div>

      {/* Trends — one line per area, split at the current week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="eff_occ" align="left">
              Weekly occupancy
            </StatLabel>
            <span className="text-[13px] flex items-center gap-1.5" style={{ color: UI.faint }}>
              % · dots &amp; shading mark events
              <Explain id="event_overlay" align="right" />
            </span>
          </div>
          <TrendChart
            main={slotSeries("effOcc")[0]}
            benchmarks={slotSeries("effOcc").slice(1)}
            equalWeight
            splitX={cur}
            yFmt={(v) => `${v.toFixed(1)}%`}
            xFmt={fmtWeek}
            events={CY_EVENTS}
            emptyLabel="No weekly data in this range"
          />
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="median_adr" align="left">
              Weekly median rate
            </StatLabel>
            <span className="text-[13px]" style={{ color: UI.faint }}>
              € / night
            </span>
          </div>
          <TrendChart
            main={slotSeries("medianAdr")[0]}
            benchmarks={slotSeries("medianAdr").slice(1)}
            equalWeight
            splitX={cur}
            yFmt={(v) => fmtEuro(v)}
            xFmt={fmtWeek}
            events={CY_EVENTS}
            emptyLabel="No weekly data in this range"
          />
        </div>
      </div>

      {/* Current-state snapshot: amenities */}
      <div className="glass-card rounded-2xl p-5 mt-2.5">
        <div className="flex items-center justify-between mb-3">
          <StatLabel id="supply_mix" align="left">
            Amenities
          </StatLabel>
          <span className="text-[13px]" style={{ color: UI.faint }}>
            % of listings that have it · today
          </span>
        </div>
        {amenityKeys.length ? (
          <CompareTable
            slots={slots}
            rows={amenityKeys.map((key) => ({
              label: AMENITY_LABEL.get(key) ?? key,
              values: snaps.map((s) => {
                const a = s?.amenities.find((x) => x.key === key);
                return a ? `${a.share.toFixed(0)}%` : null;
              }),
              best: null,
            }))}
          />
        ) : (
          <p className="text-sm" style={{ color: UI.faint }}>
            No amenity data for these selections.
          </p>
        )}
        {amenityKeysAll.length > 8 && (
          <button
            onClick={() => setAmenitiesExpanded((v) => !v)}
            className="mt-3 text-[14px] font-semibold transition-colors hover:opacity-80"
            style={{ color: UI.green }}
          >
            {amenitiesExpanded ? "Show less" : `Show all ${amenityKeysAll.length}`}
          </button>
        )}
      </div>

      <p className="text-[13px] mt-2.5" style={{ color: UI.faint }}>
        Absolute counts (listings, bookings) favour bigger areas — lean on the per-listing and
        percentage rows when the areas differ in size.
      </p>
    </div>
  );
}
