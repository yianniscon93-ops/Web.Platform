"use client";

import { motion } from "framer-motion";
import type { MarketResponse, PricingData, SlotView } from "@/lib/dashboard/types";
import { CY_EVENTS } from "@/lib/dashboard/events";
import { fmtEuro, fmtPct } from "@/lib/dashboard/format";
import { UI } from "./tokens";
import { BarsChart, GroupedBars, TrendChart } from "./charts";
import { CompareTable, SlotDot } from "./compare";
import Explain, { StatLabel } from "./Explain";

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const PREMIUM_LABEL: Record<string, string> = {
  has_pool: "Pool",
  has_sea_view: "Sea view",
  has_hot_tub: "Hot tub",
};
const MIN_SPLIT = 20; // suppress premiums when either side is thinner (contract 6.2)

/** Median of the (sampled) forward curve's next-30-day points. */
function next30Median(pricing: PricingData | null): number | null {
  const now = Date.now();
  const vals =
    pricing?.forwardCurve
      .filter((p) => new Date(p.date).getTime() < now + 30 * 86400000)
      .map((p) => p.medianPrice)
      .filter((v): v is number => v != null) ?? [];
  return vals.length ? [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)] : null;
}

export default function PricingTab({ slots }: { slots: SlotView[] }) {
  if (slots.length > 1) return <ComparePricing slots={slots} />;
  return <SinglePricing pricing={slots[0]?.pricing ?? null} market={slots[0]?.market ?? null} />;
}

function SinglePricing({
  pricing,
  market,
}: {
  pricing: PricingData | null;
  market: MarketResponse | null;
}) {
  const snap = market?.snapshot ?? null;

  // Next-30-days median from the (sampled) forward curve.
  const now = Date.now();
  const next30 =
    pricing?.forwardCurve
      .filter((p) => new Date(p.date).getTime() < now + 30 * 86400000)
      .map((p) => p.medianPrice)
      .filter((v): v is number => v != null) ?? [];
  const next30Med = next30.length
    ? [...next30].sort((a, b) => a - b)[Math.floor(next30.length / 2)]
    : null;

  const peakMonth = (pricing?.byMonth ?? [])
    .filter((m): m is { month: string; medianPrice: number } => m.medianPrice != null)
    .reduce<{ month: string; medianPrice: number } | null>(
      (a, b) => (a == null || b.medianPrice > a.medianPrice ? b : a),
      null
    );

  const premiums = (pricing?.premiums ?? []).filter(
    (p) => p.withCount >= MIN_SPLIT && p.withoutCount >= MIN_SPLIT
  );

  const cards = [
    {
      id: "median_adr" as const,
      label: "Median rate · today",
      value: snap?.adrQuartiles ? fmtEuro(snap.adrQuartiles[1]) : "—",
      accent: true,
    },
    { id: "forward_rates" as const, label: "Median rate · next 30 days", value: fmtEuro(next30Med) },
    {
      id: "forward_rates" as const,
      label: "Peak forward month",
      value: peakMonth
        ? new Date(`${peakMonth.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long" })
        : "—",
      hint: peakMonth ? `median ${fmtEuro(peakMonth.medianPrice)}` : undefined,
    },
    {
      id: "quartiles" as const,
      label: "Middle-half range · today",
      value: snap?.adrQuartiles
        ? `${fmtEuro(snap.adrQuartiles[0])}–${fmtEuro(snap.adrQuartiles[2])}`
        : "—",
    },
  ];

  return (
    <div>
      <motion.div
        key={pricing ? "loaded" : "loading"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-2.5"
      >
        {cards.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl px-4 py-3.5">
            <p className="font-display font-bold text-2xl leading-none" style={{ color: c.accent ? UI.green : UI.text }}>
              {c.value}
            </p>
            <p className="text-[13px] mt-2 uppercase tracking-wider font-medium flex items-center gap-1.5" style={{ color: UI.muted }}>
              {c.label}
              <Explain id={c.id} align="left" />
            </p>
            {"hint" in c && c.hint && (
              <p className="text-[13px]" style={{ color: UI.faint }}>
                {c.hint}
              </p>
            )}
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        {/* Forward curve */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="forward_rates" align="left">
              Forward rates · next 6 months
            </StatLabel>
            <p className="text-[13px] flex items-center gap-1.5" style={{ color: UI.faint }}>
              Tue/Fri check-in samples
              <Explain id="tue_fri_sample" align="right" />
            </p>
          </div>
          <TrendChart
            main={{
              label: "Median",
              color: UI.green,
              data: (pricing?.forwardCurve ?? []).map((p) => ({ x: p.date, y: p.medianPrice })),
            }}
            benchmarks={[
              {
                label: "Top quarter (p75)",
                color: "#C9B891",
                dashed: true,
                data: (pricing?.forwardCurve ?? []).map((p) => ({ x: p.date, y: p.p75 ?? null })),
              },
              {
                label: "Bottom quarter (p25)",
                color: UI.oliveLight,
                dashed: true,
                data: (pricing?.forwardCurve ?? []).map((p) => ({ x: p.date, y: p.p25 ?? null })),
              },
            ]}
            splitX="9999-12-31"
            yFmt={(v) => fmtEuro(v)}
            xFmt={fmtDay}
            height={120}
            events={CY_EVENTS}
            emptyLabel="No forward pricing for this selection yet"
          />
        </div>

        {/* Price distribution */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="quartiles" align="left">
              Price distribution
            </StatLabel>
            <p className="text-[13px]" style={{ color: UI.faint }}>
              listings per €25 rate band · today
            </p>
          </div>
          <BarsChart
            data={(pricing?.distribution ?? []).map((d) => ({
              label: d.binStart >= 500 ? "€500+" : `€${d.binStart}`,
              value: d.count,
            }))}
            yFmt={(v) => `${v} listings`}
            height={110}
            labelEvery={4}
            emptyLabel="No rate data for this selection"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        {/* Rate by bedrooms */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="price_by_bedrooms" align="left">
              Median rate by bedrooms
            </StatLabel>
            <p className="text-[13px]" style={{ color: UI.faint }}>
              count per size in brackets · today
            </p>
          </div>
          <BarsChart
            data={(pricing?.byBedrooms ?? [])
              .filter((b) => b.count >= 5)
              .map((b) => ({ label: `${b.label} (${b.count})`, value: b.medianRate }))}
            yFmt={(v) => fmtEuro(v)}
            height={110}
            highlightMax
            showValues
            emptyLabel="No rate data for this selection"
          />
        </div>

        {/* Revenue by price band — the sweet spot is where rate × occupancy
            peaks, not where occupancy peaks (cheap listings always fill). */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="sweet_spot" align="left">
              Revenue by price band
            </StatLabel>
            <p className="text-[13px]" style={{ color: UI.faint }}>
              € per available night per €50 band · tallest = sweet spot
            </p>
          </div>
          <BarsChart
            data={(pricing?.occByPrice ?? []).map((b) => ({
              label: b.binStart >= 400 ? "€400+" : `€${b.binStart}–${b.binStart + 50}`,
              value: b.medianRevpar ?? null,
            }))}
            line={{
              label: "occupancy",
              barsLabel: "€ / available night",
              values: (pricing?.occByPrice ?? []).map((b) => b.medianOcc),
              fmt: (v) => `${v.toFixed(0)}% booked`,
            }}
            yFmt={(v) => fmtEuro(Math.round(v))}
            height={110}
            highlightMax
            showValues
            labelEvery={2}
            emptyLabel="Not enough listings for a price-band split"
          />
        </div>
      </div>

      {/* Amenity premiums */}
      <div className="glass-card rounded-2xl p-5 mt-2.5">
        <div className="flex items-center justify-between mb-4">
          <StatLabel id="amenity_premium" align="left">
            What amenities are worth here
          </StatLabel>
          <span className="text-[13px]" style={{ color: UI.faint }}>
            inside your current selection · today
          </span>
        </div>
        {premiums.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {premiums.map((p) => {
              const rateD =
                p.withMedianRate != null && p.withoutMedianRate != null && p.withoutMedianRate !== 0
                  ? (100 * (p.withMedianRate - p.withoutMedianRate)) / p.withoutMedianRate
                  : null;
              const occD =
                p.withMedianOcc != null && p.withoutMedianOcc != null
                  ? p.withMedianOcc - p.withoutMedianOcc
                  : null;
              return (
                <div key={p.key} className="rounded-xl p-4" style={{ border: `1px solid ${UI.border}` }}>
                  <p className="text-sm font-bold mb-2" style={{ color: UI.text }}>
                    {PREMIUM_LABEL[p.key] ?? p.key}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-xl" style={{ color: rateD != null && rateD >= 0 ? UI.green : "#D98B6A" }}>
                      {rateD != null ? `${rateD >= 0 ? "+" : ""}${rateD.toFixed(0)}%` : "—"}
                    </span>
                    <span className="text-[14px]" style={{ color: UI.muted }}>
                      on the nightly rate
                    </span>
                  </div>
                  <p className="text-[14px] mt-1" style={{ color: UI.muted }}>
                    {fmtEuro(p.withMedianRate)} with · {fmtEuro(p.withoutMedianRate)} without
                  </p>
                  {occD != null && (
                    <p className="text-[14px] mt-1.5" style={{ color: UI.muted }}>
                      Occupancy{" "}
                      <b style={{ color: occD >= 0 ? UI.green : "#D98B6A" }}>
                        {occD >= 0 ? "+" : ""}
                        {occD.toFixed(1)}pp
                      </b>{" "}
                      ({fmtPct(p.withMedianOcc)} vs {fmtPct(p.withoutMedianOcc)})
                    </p>
                  )}
                  <p className="text-[13px] mt-1.5" style={{ color: UI.faint }}>
                    {p.withCount.toLocaleString("en-GB")} with · {p.withoutCount.toLocaleString("en-GB")} without
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: UI.faint }}>
            Not enough listings on both sides of an amenity split in this selection — widen the area
            to compare pool, sea-view and hot-tub premiums.
          </p>
        )}
        <p className="text-[13px] mt-3.5" style={{ color: UI.faint }}>
          Coming soon: weekend &amp; holiday premiums (needs day-of-week price rotation).
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison mode — pricing split by slot.
// ---------------------------------------------------------------------------

function ComparePricing({ slots }: { slots: SlotView[] }) {
  const snaps = slots.map((v) => v.market?.snapshot ?? null);
  const next30s = slots.map((v) => next30Median(v.pricing));
  const peaks = slots.map((v) =>
    (v.pricing?.byMonth ?? [])
      .filter((m): m is { month: string; medianPrice: number } => m.medianPrice != null)
      .reduce<{ month: string; medianPrice: number } | null>(
        (a, b) => (a == null || b.medianPrice > a.medianPrice ? b : a),
        null
      )
  );

  // Bedrooms union keeps every slot's sizes on one axis.
  const bedroomUnion = [
    ...new Set(slots.flatMap((v) => (v.pricing?.byBedrooms ?? []).filter((b) => b.count >= 5).map((b) => b.label))),
  ];

  const series = slots.map((v) => ({ label: v.label, color: v.color }));

  return (
    <div>
      {/* Headline matrix */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <StatLabel id="compare" align="left">
            Pricing head to head
          </StatLabel>
          <span className="text-[13px]" style={{ color: UI.faint }}>
            current asking rates · today
          </span>
        </div>
        <CompareTable
          slots={slots}
          rows={[
            {
              label: "Median rate · today",
              explain: "median_adr",
              values: snaps.map((s) => (s?.adrQuartiles ? fmtEuro(s.adrQuartiles[1]) : null)),
              best: null,
            },
            {
              label: "Median rate · next 30 days",
              explain: "forward_rates",
              values: next30s.map((v) => fmtEuro(v)),
              best: null,
            },
            {
              label: "Peak forward month",
              explain: "forward_rates",
              values: peaks.map((p) =>
                p
                  ? new Date(`${p.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long" })
                  : null
              ),
              hints: peaks.map((p) => (p ? `median ${fmtEuro(p.medianPrice)}` : null)),
              best: null,
            },
            {
              label: "Middle-half range · today",
              explain: "quartiles",
              values: snaps.map((s) =>
                s?.adrQuartiles ? `${fmtEuro(s.adrQuartiles[0])}–${fmtEuro(s.adrQuartiles[2])}` : null
              ),
              best: null,
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        {/* Forward curve — one line per area */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="forward_rates" align="left">
              Forward rates · next 6 months
            </StatLabel>
            <p className="text-[13px] flex items-center gap-1.5" style={{ color: UI.faint }}>
              medians · Tue/Fri check-in samples
              <Explain id="tue_fri_sample" align="right" />
            </p>
          </div>
          <TrendChart
            main={{
              label: slots[0].label,
              color: slots[0].color,
              data: (slots[0].pricing?.forwardCurve ?? []).map((p) => ({ x: p.date, y: p.medianPrice })),
            }}
            benchmarks={slots.slice(1).map((v) => ({
              label: v.label,
              color: v.color,
              dashed: v.dash,
              data: (v.pricing?.forwardCurve ?? []).map((p) => ({ x: p.date, y: p.medianPrice })),
            }))}
            equalWeight
            splitX="9999-12-31"
            yFmt={(v) => fmtEuro(v)}
            xFmt={fmtDay}
            height={120}
            events={CY_EVENTS}
            emptyLabel="No forward pricing for these selections yet"
          />
        </div>

        {/* Rate by bedrooms — grouped */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <StatLabel id="price_by_bedrooms" align="left">
              Median rate by bedrooms
            </StatLabel>
            <p className="text-[13px]" style={{ color: UI.faint }}>
              sizes with ≥5 listings · today
            </p>
          </div>
          <GroupedBars
            data={bedroomUnion.map((label) => ({
              label,
              values: slots.map((v) => {
                const b = v.pricing?.byBedrooms?.find((x) => x.label === label);
                return b && b.count >= 5 ? b.medianRate : null;
              }),
            }))}
            series={series}
            yFmt={(v) => fmtEuro(v)}
            height={110}
            emptyLabel="No rate data for these selections"
          />
        </div>
      </div>

      {/* Price distribution — small multiples (overlaid histograms smear) */}
      <div className="glass-card rounded-2xl p-5 mt-2.5">
        <div className="flex items-center justify-between mb-3">
          <StatLabel id="quartiles" align="left">
            Price distribution
          </StatLabel>
          <p className="text-[13px]" style={{ color: UI.faint }}>
            listings per €25 rate band · today
          </p>
        </div>
        <div className={`grid grid-cols-1 ${slots.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-5`}>
          {slots.map((v) => (
            <div key={v.id}>
              <p className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: UI.muted }}>
                <SlotDot color={v.color} dash={v.dash} />
                {v.label}
              </p>
              <BarsChart
                data={(v.pricing?.distribution ?? []).map((d) => ({
                  label: d.binStart >= 500 ? "€500+" : `€${d.binStart}`,
                  value: d.count,
                }))}
                yFmt={(x) => `${x} listings`}
                height={90}
                labelEvery={4}
                color={v.color}
                emptyLabel="No rate data"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by price band — small multiples */}
      <div className="glass-card rounded-2xl p-5 mt-2.5">
        <div className="flex items-center justify-between mb-3">
          <StatLabel id="sweet_spot" align="left">
            Revenue by price band
          </StatLabel>
          <p className="text-[13px]" style={{ color: UI.faint }}>
            € per available night per €50 band · tallest = sweet spot
          </p>
        </div>
        <div className={`grid grid-cols-1 ${slots.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-5`}>
          {slots.map((v) => (
            <div key={v.id}>
              <p className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: UI.muted }}>
                <SlotDot color={v.color} dash={v.dash} />
                {v.label}
              </p>
              <BarsChart
                data={(v.pricing?.occByPrice ?? []).map((b) => ({
                  label: b.binStart >= 400 ? "€400+" : `€${b.binStart}`,
                  value: b.medianRevpar ?? null,
                }))}
                line={{
                  label: "occupancy",
                  values: (v.pricing?.occByPrice ?? []).map((b) => b.medianOcc),
                  fmt: (x) => `${x.toFixed(0)}% booked`,
                }}
                yFmt={(x) => fmtEuro(Math.round(x))}
                height={90}
                highlightMax
                labelEvery={2}
                color={v.color}
                emptyLabel="Not enough listings"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Amenity premiums — matrix */}
      <div className="glass-card rounded-2xl p-5 mt-2.5">
        <div className="flex items-center justify-between mb-3">
          <StatLabel id="amenity_premium" align="left">
            What amenities are worth
          </StatLabel>
          <span className="text-[13px]" style={{ color: UI.faint }}>
            rate premium with vs without · today
          </span>
        </div>
        <CompareTable
          slots={slots}
          rows={Object.keys(PREMIUM_LABEL).map((key) => {
            const cells = slots.map((v) => {
              const p = (v.pricing?.premiums ?? []).find((x) => x.key === key);
              if (!p || p.withCount < MIN_SPLIT || p.withoutCount < MIN_SPLIT) return null;
              const rateD =
                p.withMedianRate != null && p.withoutMedianRate != null && p.withoutMedianRate !== 0
                  ? (100 * (p.withMedianRate - p.withoutMedianRate)) / p.withoutMedianRate
                  : null;
              const occD =
                p.withMedianOcc != null && p.withoutMedianOcc != null
                  ? p.withMedianOcc - p.withoutMedianOcc
                  : null;
              return { rateD, occD };
            });
            return {
              label: PREMIUM_LABEL[key],
              values: cells.map((c) =>
                c?.rateD != null ? `${c.rateD >= 0 ? "+" : ""}${c.rateD.toFixed(0)}% rate` : null
              ),
              hints: cells.map((c) =>
                c?.occD != null ? `${c.occD >= 0 ? "+" : ""}${c.occD.toFixed(1)}pp occupancy` : null
              ),
              best: null,
            };
          })}
        />
        <p className="text-[13px] mt-3" style={{ color: UI.faint }}>
          — means too few listings on one side of the split in that area (needs {MIN_SPLIT}+ with
          and without).
        </p>
      </div>
    </div>
  );
}
