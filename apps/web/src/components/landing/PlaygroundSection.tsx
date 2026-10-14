"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { HeroArea } from "@/lib/landing/areaContext";
import { euro, pct, tippingBasis } from "@/lib/landing/sectionLines";
import OccupancyCurve from "./OccupancyCurve";
import { PlaygroundIcon } from "./ProductIcons";
import { Card, Covers, NO_FIGURES, READING, Standin, UNREACHABLE, useArrival } from "./SectionParts";

/**
 * The running costs the Playground's "Airbnb it or rent it out?" starts from (SingleBuyRent in
 * components/dashboard/BuyRentTab.tsx): a short-let's cleaning, management, platform fees and bills against a
 * tenant's upkeep, as shares of what each takes in. The landing quotes them; the Playground lets you change them.
 */
const STR_COSTS = 40;
const LTR_COSTS = 15;

/**
 * "Airbnb or a tenant?": the Playground's own verdict for a typical home for sale in Cyprus, worked. Its tipping
 * point is the Buy & Rent tab's: the median occupancy at which a short-let's takings equal a tenant's rent
 * (parityMedian), scaled by the two running costs, so it compares what each leaves after costs. It is rounded to
 * the whole per cent the panel prints, and the slider is compared with that same figure, so the headline and the
 * verdict can never disagree. The scale marks it and where the median Cyprus short-let is this season (the Market
 * tab's snapshot, the figure the Playground compares it with); the slider asks how booked the visitor's own place
 * would be and says which earns more there. The Playground's yearly sums are not quoted: they are independent
 * medians and could read as the verdict's proof while disagreeing with it (review, 2026-10-14).
 */
function TippingPoint({ area }: { area: HeroArea }) {
  const { stats = null, invest = null, occMedian = null } = area.figures ?? {};
  const ids = useId();
  const [mine, setMine] = useState<number | null>(null);

  if (!area.figures) return <Standin busy={area.status === "loading"}>{area.status === "error" ? UNREACHABLE : READING}</Standin>;

  const parity = invest?.parityMedian ?? null;
  const price = invest?.priceQuartiles?.[1] ?? null;
  // Today's occupancy as the Playground's verdict reads it (the median listing's), else the island's own figure.
  const today = occMedian ?? stats?.effOccTodate ?? null;
  if (!invest || parity == null) return <Standin>{NO_FIGURES}</Standin>;

  // The tipping point as printed: a whole per cent, and the one figure the slider is compared with.
  const tip = Math.round(parity * ((1 - LTR_COSTS / 100) / (1 - STR_COSTS / 100)));
  const reachable = tip <= 100;
  const start = today != null ? Math.round(today) : Math.min(100, tip);
  const at = mine ?? start;
  const shortWins = reachable && at >= tip;
  const verdict = shortWins ? "a short-\u2060let out-earns a tenant" : "a tenant out-earns a short-\u2060let";
  const basis = tippingBasis(invest);
  const fill = { "--ps-fill": `${at}%` } as React.CSSProperties;
  // Where the two marks sit on the scale, as shares of it; a label near an end hangs inwards from its mark.
  const tipAt = Math.min(100, tip) / 100;
  const todayAt = (today ?? 0) / 100;
  const marks = { "--pt-tip": tipAt, "--pt-today": todayAt } as React.CSSProperties;
  const end = (v: number) => (v < 0.12 ? "start" : v > 0.82 ? "end" : undefined);

  return (
    <div className="pt">
      <h3 className="pt-h">Airbnb or a tenant?</h3>
      {reachable ? (
        <p className="pt-tip">
          <span className="pt-big">{pct(tip)}</span>
          <span>of nights booked is where a short-&#8288;let starts to out-earn a tenant in Cyprus, after running costs.</span>
        </p>
      ) : (
        <p className="pt-tip">
          <span className="pt-big">{pct(tip)}</span>
          <span>of nights is what a short-&#8288;let would need to beat a tenant in Cyprus, so a tenant out-earns it whatever the calendar does.</span>
        </p>
      )}

      <div className="ps-field pt-field">
        <label htmlFor={`${ids}-occ`}>How booked would yours be?</label>
        <output htmlFor={`${ids}-occ`}>{pct(at)} of nights</output>
        <div className="pt-scale" style={marks} data-tip-at={end(tipAt)} data-today-at={todayAt > 0.5 ? "end" : undefined}>
          {reachable && (
            <span className="pt-mark-tip" aria-hidden="true">
              <span>Tipping point</span>
            </span>
          )}
          <input
            id={`${ids}-occ`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={at}
            style={fill}
            aria-valuetext={`${pct(at)} of nights booked: ${verdict.replace(/\u2060/g, "")}`}
            aria-describedby={`${ids}-verdict`}
            onChange={(e) => setMine(Number(e.target.value))}
          />
          {today != null && (
            <span className="pt-mark-today" aria-hidden="true">
              <i />
              <span>Cyprus today, {pct(today)}</span>
            </span>
          )}
        </div>
        <p id={`${ids}-verdict`} className="pt-verdict" data-win={shortWins ? "short" : "long"}>
          <i aria-hidden="true" />
          <span>
            {mine == null && today != null ? `At today’s ${pct(at)}` : `At ${pct(at)}`}, {verdict}.
          </span>
        </p>
        {mine != null && today != null && (
          <button type="button" className="ps-textbtn pt-back" onClick={() => setMine(null)}>
            Back to today&apos;s {pct(today)}
          </button>
        )}
      </div>

      {/* Where that figure sits among every short-let on the island: the slider's own value, on the listings' curve,
          which a press or a drag along it also sets (OccupancyCurve). */}
      <OccupancyCurve at={at} tip={tip} onPick={setMine} demo={invest.source === "demo"} />

      <p className="pt-firm">
        {basis.startsWith("Thin:") ? (
          <>
            <b>Thin:</b>
            {basis.slice(5)}
          </>
        ) : (
          basis
        )}{" "}
        {price != null && <>Homes for sale in Cyprus ask a median {euro(price)}. </>}
        Running costs are taken as {STR_COSTS}% of a short-&#8288;let&apos;s takings and {LTR_COSTS}% of rent, where the
        Playground starts them. The Playground shows the year&apos;s sums for any place, and lets you change the costs.
      </p>
      <Covers demo={invest.source === "demo"} />
    </div>
  );
}

/**
 * The Playground's panel: what it does for the visitor in one claim, the five views named in a sentence, its one
 * action, and one working thing: the Buy & Rent verdict for Cyprus, which sets the three markets against each
 * other (what a home costs, what it rents for, what it earns a night) and lets the visitor move the one number
 * that decides it. On arrival the scale's handle and marks settle in once (landing-sections.css).
 */
export default function PlaygroundSection({ area }: { area: HeroArea }) {
  const card = useRef<HTMLElement>(null);
  const { arrived, arriving } = useArrival(card);
  return (
    <Card
      cardRef={card}
      id="playground"
      layout="split"
      name="Playground"
      icon={<PlaygroundIcon size={36} />}
      claim="What any street earns, rents for and sells for."
      body={
        <>
          <p>Search a town or draw a few streets, and the Playground answers for just the listings inside.</p>
          <p>
            Five views: the market, pricing, booking pace, buy and rent, and a revenue calculator. Free to explore.
          </p>
        </>
      }
      arrived={arrived}
      arriving={arriving}
      action={
        <a href={area.playgroundHref} className="th-go">
          Open the Playground
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>
      }
      object={<TippingPoint area={area} />}
    />
  );
}
