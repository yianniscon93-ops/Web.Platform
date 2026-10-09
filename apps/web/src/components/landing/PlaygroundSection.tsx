"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { PaceData, PricingData, SelectionStats } from "@/lib/dashboard/types";
import type { HeroArea } from "@/lib/landing/areaContext";
import { MIN_LISTINGS, SEASON } from "@/lib/landing/areaLines";
import { HERO_AREAS, type DrawnArea } from "@/lib/landing/compare";
import {
  euro,
  forwardSeries,
  int,
  monthLabel,
  monthName,
  pct,
  seriesRange,
  tooThin,
  weeklySeries,
} from "@/lib/landing/sectionLines";
import { useAreaAnswer, useNear, type AreaAnswer } from "@/lib/landing/useAreaAnswer";
import { PlaygroundIcon } from "./ProductIcons";
import { Card, Covers, NO_FIGURES, READING, Standin, UNREACHABLE, inside, useArrival } from "./SectionParts";
import { BarChart, LineChart } from "./SeriesChart";

// The Playground's own tab names, verbatim (components/dashboard/DashboardClient.tsx).
const VIEWS = [
  { id: "market", label: "Market overview" },
  { id: "pricing", label: "Pricing" },
  { id: "pace", label: "Booking pace" },
  { id: "buyrent", label: "Buy & Rent" },
  { id: "calculator", label: "Revenue calculator" },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

/** The lowest nightly rate the calculator's slider goes to. */
const RATE_MIN = 10;

const days = (v: number) => int(v);
const dayAxis = (v: number) => (v === 0 ? "0" : `${int(v)} days`);

/** One area in the head to head: its name, the page's count for it, and its /stats answer. */
interface Slot {
  key: string;
  name: string;
  /** Under the name, for the visitor's own area: "near Protaras". */
  near?: string;
  count: number | null;
  stats: SelectionStats | null;
  /** The visitor's own area: its header carries the area's filled corner. */
  mine: boolean;
  /** Its figures are for the area's previous shape; the new ones are on their way. */
  pending: boolean;
  loading: boolean;
  failed: boolean;
}

/**
 * "Head to head": the Playground's comparison, working. It sets the page's
 * two places side by side and, once the visitor has redrawn the area on the
 * map, that area as the third (three is the most the Playground compares).
 * The title and the row names are the Playground's own for this matrix
 * (CompareMarket in components/dashboard/MarketTab.tsx).
 *
 * A place's occupancy and rate are its /stats answer for its area as first
 * drawn. For the place on the hero's map that is the answer the hero already
 * has; only a place the hero has not shown is asked for here, once
 * (useAreaAnswer keeps it), so a drag asks nothing. Its count is the page's
 * own for that place (`area.own`), never the API's, unless the listings could
 * not be fetched at all.
 */
function HeadToHead({ area, near }: { area: HeroArea; near: boolean }) {
  // The /stats answer the hero has published for each place's area as first drawn: kept, so it is still here after a drag.
  const [own, setOwn] = useState<Partial<Record<DrawnArea["key"], SelectionStats>>>({});
  const stats = area.figures?.stats ?? null;
  const here = area.place.key;
  const count = area.count;
  // The area on the map is a place's own, with its figures in.
  const fresh = !area.changed && !area.pending && stats != null;
  useEffect(() => {
    if (fresh) setOwn((o) => (o[here] === stats ? o : { ...o, [here]: stats }));
  }, [fresh, here, stats]);
  const had = (key: DrawnArea["key"]) => (key === here && fresh ? stats : (own[key] ?? null));
  // Asked for here only when the hero neither has the answer nor is fetching it at this moment.
  const ask = (key: DrawnArea["key"]) => near && !had(key) && !(key === here && !area.changed && area.status === "loading");

  const [a, b] = HERO_AREAS;
  const askA = useAreaAnswer<SelectionStats>({
    path: "/api/dashboard/stats",
    polygon: a.polygon,
    place: a.key,
    enabled: ask(a.key),
    demoScoped: true,
  });
  const askB = useAreaAnswer<SelectionStats>({
    path: "/api/dashboard/stats",
    polygon: b.polygon,
    place: b.key,
    enabled: ask(b.key),
    demoScoped: true,
  });

  const slots: Slot[] = [
    [a, askA] as const,
    [b, askB] as const,
  ].map(([place, asked]) => {
    const got = had(place.key) ?? asked.data;
    return {
      key: place.key,
      name: place.name,
      // The page's own count for the place. The API's stands in only when the page could not count at all.
      count: area.own[place.key] ?? (area.countsFailed ? (got?.listingCount ?? null) : null),
      stats: got,
      mine: false,
      pending: false,
      loading: !got && !asked.failed,
      failed: !got && asked.failed,
    };
  });
  // The area on the map joins the two as the third: once the visitor has changed it, or from the start when the
  // map is the island's, whose own area is neither of them.
  const third = area.changed || (here !== a.key && here !== b.key);
  if (third) {
    slots.push({
      key: "mine",
      name: area.changed ? "Your area" : area.place.name,
      near: area.changed && !area.place.frame ? `near ${area.place.name}` : undefined,
      count,
      stats,
      mine: area.changed,
      pending: area.pending,
      loading: !stats && area.status === "loading",
      failed: !stats && area.status === "error",
    });
  }

  // An area too thin to quote has a count and no medians, as everywhere on the page.
  const quoted = (s: Slot) => (s.count != null && s.count >= MIN_LISTINGS ? s.stats : null);
  const rows: Array<{ label: string; period?: string; values: Array<number | null>; format: (v: number) => string }> = [
    { label: "Listings tracked", values: slots.map((s) => s.count), format: int },
    { label: "Occupancy", period: SEASON, values: slots.map((s) => quoted(s)?.effOccTodate ?? null), format: pct },
    { label: "Median nightly rate", values: slots.map((s) => quoted(s)?.medianRate ?? null), format: euro },
  ];
  const demo = slots.some((s) => s.stats?.source === "demo");
  return (
    <div className="ps-versus" aria-busy={slots.some((s) => s.loading || s.pending) || undefined}>
      <table className="ps-table">
        <thead>
          <tr>
            <th scope="col">
              <h3>Head to head</h3>
            </th>
            {slots.map((s, i) => (
              // The second place is the one that joins the first on the card's arrival (its column slides in).
              <th key={s.key} scope="col" data-mine={s.mine ? "" : undefined} data-join={i === 1 ? "" : undefined}>
                {s.name}
                {s.near && <small>{s.near}</small>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const known = row.values.filter((v): v is number => v != null);
            // The leading figure of the row, where there is one: at least two to compare, and not all the same.
            const top = known.length >= 2 && new Set(known.map(row.format)).size > 1 ? Math.max(...known) : null;
            return (
              <tr key={row.label}>
                <th scope="row">
                  {row.label}
                  {row.period && <small> {row.period}</small>}
                </th>
                {slots.map((s, i) => {
                  const v = row.values[i];
                  return (
                    <td key={s.key} data-pending={s.pending ? "" : undefined} data-join={i === 1 ? "" : undefined}>
                      {v == null ? (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">{s.loading ? "loading" : s.failed ? "not available" : "no figure"}</span>
                        </>
                      ) : v === top ? (
                        <b>{row.format(v)}</b>
                      ) : (
                        row.format(v)
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Covers demo={demo}>
        <span>
          {third
            ? "Three areas side by side, the most the Playground compares."
            : "Move a corner on the map and your area joins as the third."}
        </span>
      </Covers>
    </div>
  );
}

/** "Weekly occupancy" and "Weekly median rate", from the weekly series the hero already has. */
function MarketView({ area }: { area: HeroArea }) {
  const stats = area.figures?.stats ?? null;
  const occ = useMemo(() => (stats ? weeklySeries(stats.weekly, "effOcc") : []), [stats]);
  const rate = useMemo(() => (stats ? weeklySeries(stats.weekly, "medianAdr") : []), [stats]);
  if (!stats) return <Standin busy={area.status === "loading"}>{area.status === "error" ? UNREACHABLE : READING}</Standin>;
  const thin = tooThin(area.count ?? stats.listingCount);
  if (thin) return <Standin>{thin}</Standin>;
  const blocks = [
    {
      title: "Weekly occupancy",
      pts: occ,
      format: pct,
      unit: " occupied",
      subject: "the share of nights occupied by week",
    },
    { title: "Weekly median rate", pts: rate, format: euro, unit: " a night", subject: "the median nightly rate by week" },
  ];
  return (
    <>
      <div className="ps-pair" data-pending={area.pending ? "" : undefined}>
        {blocks.map((b) => {
          const last = b.pts[b.pts.length - 1];
          return (
            <section key={b.title} className="ps-fig">
              <div className="ps-fig-head">
                <h3>{b.title}</h3>
                {b.pts.length >= 3 && (
                  <p className="ps-fig-now">
                    <b>{b.format(last.v)}</b>{" "}
                    week of {last.label}
                  </p>
                )}
              </div>
              {b.pts.length >= 3 ? (
                <LineChart points={b.pts} format={b.format} unit={b.unit} subject={b.subject} per="Week of" />
              ) : (
                <Standin>{NO_FIGURES}</Standin>
              )}
            </section>
          );
        })}
      </div>
      <Covers demo={stats.source === "demo"} scope="inside the line" />
    </>
  );
}

/** "Forward rates · next 6 months": the forward price curve from /pricing. */
function PricingView({ answer }: { answer: AreaAnswer<PricingData> }) {
  const pts = useMemo(() => (answer.data ? forwardSeries(answer.data.forwardCurve) : []), [answer.data]);
  return (
    <section className="ps-fig">
      <div className="ps-fig-head">
        <h3>Forward rates · next 6 months</h3>
      </div>
      {!answer.data ? (
        <Standin busy={answer.loading}>{answer.failed ? UNREACHABLE : READING}</Standin>
      ) : pts.length < 3 ? (
        <Standin>{NO_FIGURES}</Standin>
      ) : (
        <div data-pending={answer.pending ? "" : undefined}>
          <LineChart
            points={pts}
            format={euro}
            unit=" a night"
            subject="the median nightly price by date of stay"
            per="On"
            caption={`Median nightly price by date of stay, ${seriesRange(pts)}`}
          />
        </div>
      )}
      {/* The demo fallback for /pricing is filtered by the polygon too (demo.pricing), so it is always "inside the line". */}
      {answer.data && <Covers demo={answer.data.source === "demo"} scope="inside the line" />}
    </section>
  );
}

/** "How far ahead guests book": median lead time by stay month from /pace. */
function PaceView({ answer }: { answer: AreaAnswer<PaceData> }) {
  const pace = answer.data;
  const bars = useMemo(() => {
    const rows = (pace?.leadTimeByMonth ?? []).filter((r): r is typeof r & { medianLead: number } => r.medianLead != null);
    // Six months of stays can run into the next year: then the first month of each year carries it.
    const years = new Set(rows.map((r) => r.month.slice(0, 4)));
    return rows.map((r, i) => ({
      label: monthLabel(r.month, years.size > 1 && (i === 0 || r.month.endsWith("-01"))),
      name: monthName(r.month),
      v: r.medianLead,
    }));
  }, [pace]);
  return (
    <section className="ps-fig">
      <div className="ps-fig-head">
        <h3>How far ahead guests book</h3>
      </div>
      {!pace ? (
        <Standin busy={answer.loading}>{answer.failed ? UNREACHABLE : READING}</Standin>
      ) : !bars.length ? (
        <Standin>{NO_FIGURES}</Standin>
      ) : (
        <div data-pending={answer.pending ? "" : undefined}>
          {/* The API's own words for what the bookings cover: "Drawn area" from the live query, "Cyprus" from the demo fallback. */}
          <p className="ps-fig-sub">
            Median days between booking and arrival, by month of stay. Covers: <b>{pace.scope}</b>
          </p>
          <BarChart
            bars={bars}
            format={days}
            axis={dayAxis}
            subject={`the median number of days between booking and arrival by month of stay, covering ${pace.scope}`}
          />
        </div>
      )}
      {/* demoPace takes no polygon: a demo answer is the whole island's. */}
      {pace && <Covers demo={pace.source === "demo"} scope={inside(pace) ? undefined : "all of Cyprus"} />}
    </section>
  );
}

/** "What buying costs" beside "What renting pays", by bedrooms, from the figures the hero already has. */
function BuyRentView({ area }: { area: HeroArea }) {
  const { rentals = null, invest = null } = area.figures ?? {};
  if (!area.figures) return <Standin busy={area.status === "loading"}>{area.status === "error" ? UNREACHABLE : READING}</Standin>;
  const labels: string[] = [];
  for (const r of [...(invest?.byBedrooms ?? []), ...(rentals?.byBedrooms ?? [])]) if (!labels.includes(r.label)) labels.push(r.label);
  const price = new Map((invest?.byBedrooms ?? []).map((r) => [r.label, r.medianPrice]));
  const rent = new Map((rentals?.byBedrooms ?? []).map((r) => [r.label, r.medianRent]));
  const rows = labels.filter((l) => price.get(l) != null || rent.get(l) != null);
  if (!rows.length) return <Standin>{NO_FIGURES}</Standin>;
  const cover = (r: { source: "live" | "demo" } | null) => (!r ? "\u00a0" : inside(r) ? "inside the line" : "all of Cyprus");
  // A figure that is not for the drawn area does not change when the area does, so it is never pending.
  const late = [area.pending && inside(invest), area.pending && inside(rentals)];
  const cell = (v: number | null | undefined, unit: string | null, pending: boolean) =>
    v == null ? (
      <td>
        <b className="ps-none" aria-hidden="true">
          –
        </b>
        <span className="sr-only">no figure</span>
      </td>
    ) : (
      <td data-pending={pending ? "" : undefined}>
        <b>{euro(v)}</b>
        {unit && <> {unit}</>}
      </td>
    );
  return (
    <>
      <table className="ps-table" aria-busy={late.some(Boolean) || undefined}>
        <caption className="sr-only">Median asking price and median monthly rent by number of bedrooms, for {area.name}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Bedrooms</span>
            </th>
            <th scope="col">
              What buying costs
              <small>median asking price, {cover(invest)}</small>
            </th>
            <th scope="col">
              What renting pays
              <small>median rent, {cover(rentals)}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((label) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {cell(price.get(label), null, late[0])}
              {cell(rent.get(label), "a month", late[1])}
            </tr>
          ))}
        </tbody>
      </table>
      <Covers demo={[invest, rentals].some((r) => r?.source === "demo")} />
    </>
  );
}

/** "Your scenario" and "What you'd make": nightly rate × 365 × occupancy, starting from the area's own figures. */
function CalculatorView({ area }: { area: HeroArea }) {
  const stats = area.figures?.stats ?? null;
  const thin = stats ? tooThin(area.count ?? stats.listingCount) != null : true;
  const areaRate = !thin && stats?.medianRate != null ? Math.round(stats.medianRate) : null;
  const areaOcc = !thin && stats?.effOccTodate != null ? Math.round(stats.effOccTodate) : null;
  // The visitor's own figures once a slider has moved; until then the scenario follows the area.
  const [mine, setMine] = useState<{ rate?: number; occ?: number }>({});
  const rateMax = Math.max(300, Math.ceil(((areaRate ?? 100) * 2) / 50) * 50);
  // The visitor's rate is kept to what this area's slider can show, so the slider and the sum never disagree
  // (the scale follows the area, and a rate set on one place can be past the end of the next one's).
  const rate = Math.min(Math.max(mine.rate ?? areaRate ?? 100, RATE_MIN), rateMax);
  const occ = mine.occ ?? areaOcc ?? 50;
  const yearly = Math.round((rate * 365 * (occ / 100)) / 100) * 100;
  const ids = useId();
  const touched = mine.rate != null || mine.occ != null;
  const loading = !stats && area.status === "loading";
  // Why a slider is not starting from the area's own figure, when it is not.
  const without = (what: string) =>
    loading ? READING : !stats ? `${UNREACHABLE} This starts from a round number.` : `No ${what} for this area yet, so this starts from a round number.`;
  const fill = (v: number, min: number, max: number) => ({ "--ps-fill": `${((v - min) / (max - min)) * 100}%` }) as React.CSSProperties;
  return (
    <div className="ps-calc">
      <section className="ps-fig">
        <div className="ps-fig-head">
          <h3>Your scenario</h3>
        </div>
        <div className="ps-field">
          <label htmlFor={`${ids}-rate`}>Nightly rate</label>
          <output htmlFor={`${ids}-rate`}>{euro(rate)}</output>
          <input
            id={`${ids}-rate`}
            type="range"
            min={RATE_MIN}
            max={rateMax}
            step={1}
            value={rate}
            style={fill(rate, RATE_MIN, rateMax)}
            aria-valuetext={`${euro(rate)} a night`}
            aria-describedby={`${ids}-rate-note`}
            onChange={(e) => setMine((m) => ({ ...m, rate: Number(e.target.value) }))}
          />
          <p id={`${ids}-rate-note`} className="ps-field-note" data-pending={area.pending ? "" : undefined}>
            {areaRate != null ? `The median in ${area.name} is ${euro(areaRate)} a night.` : without("median rate")}
          </p>
        </div>
        <div className="ps-field">
          <label htmlFor={`${ids}-occ`}>Occupancy</label>
          <output htmlFor={`${ids}-occ`}>{pct(occ)}</output>
          <input
            id={`${ids}-occ`}
            type="range"
            min={0}
            max={100}
            step={1}
            value={occ}
            style={fill(occ, 0, 100)}
            aria-valuetext={`${pct(occ)} of nights occupied`}
            aria-describedby={`${ids}-occ-note`}
            onChange={(e) => setMine((m) => ({ ...m, occ: Number(e.target.value) }))}
          />
          <p id={`${ids}-occ-note`} className="ps-field-note" data-pending={area.pending ? "" : undefined}>
            {areaOcc != null ? `Short\u2011lets in ${area.name} fill ${pct(areaOcc)} of nights ${SEASON}.` : without("occupancy figure")}
          </p>
        </div>
      </section>
      <section className="ps-fig ps-calc-out">
        <div className="ps-fig-head">
          <h3>What you&apos;d make</h3>
        </div>
        <output className="ps-calc-sum" htmlFor={`${ids}-rate ${ids}-occ`}>
          About <b>{euro(yearly)}</b> a year before costs
        </output>
        <p className="ps-fig-sub">
          {euro(rate)} a night × 365 nights × {pct(occ)} occupied
        </p>
        <p className="ps-fig-sub">The Playground&apos;s calculator also counts what it costs to buy.</p>
        {touched && (areaRate != null || areaOcc != null) && (
          <button type="button" className="ps-textbtn" onClick={() => setMine({})}>
            Back to the area&apos;s figures
          </button>
        )}
        {/* Marked only when the scenario started from the area's figures. */}
        {stats && (areaRate != null || areaOcc != null) && <Covers demo={stats.source === "demo"} />}
      </section>
    </div>
  );
}

/**
 * The Playground's card: the page's filled action in its header; then what
 * the Playground is, a head to head of up to three areas, the Playground's
 * five views as a tablist (each a live preview for the area on the hero's
 * map) and three plain statements. On arrival, once, the two chart lines
 * draw, their end nodes pop, the tab's underline slides in and the head to
 * head's second place joins from the right (all in the stylesheet, keyed on
 * the card's `data-arriving`). Every figure shows its true value throughout:
 * nothing counts up.
 */
export default function PlaygroundSection({ area, index }: { area: HeroArea; index: number }) {
  const [view, setView] = useState<ViewId>("market");
  const ids = useId();
  const card = useRef<HTMLElement>(null);
  const { arrived, arriving } = useArrival(card);
  const objectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<Partial<Record<ViewId, HTMLButtonElement | null>>>({});
  const near = useNear(objectRef);
  // Whether the tab row has more to show on either side, for the cue at its edge.
  const [more, setMore] = useState({ start: false, end: false });

  const pricing = useAreaAnswer<PricingData>({
    path: "/api/dashboard/pricing",
    polygon: area.polygon,
    place: area.place.key,
    enabled: near && view === "pricing",
    demoScoped: true,
  });
  const pace = useAreaAnswer<PaceData>({
    path: "/api/dashboard/pace",
    polygon: area.polygon,
    place: area.place.key,
    enabled: near && view === "pace",
    demoScoped: false,
  });

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const start = el.scrollLeft > 4;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const choose = useCallback((id: ViewId, focus: boolean) => {
    setView(id);
    const tab = tabs.current[id];
    if (!tab) return;
    if (focus) tab.focus({ preventScroll: true });
    // Bring a half-hidden tab into the row without moving the page.
    const list = listRef.current;
    if (list) {
      const left = tab.offsetLeft - 24;
      const right = tab.offsetLeft + tab.offsetWidth + 24;
      if (left < list.scrollLeft) list.scrollTo({ left });
      else if (right > list.scrollLeft + list.clientWidth) list.scrollTo({ left: right - list.clientWidth });
    }
  }, []);

  function onKey(e: React.KeyboardEvent) {
    const i = VIEWS.findIndex((v) => v.id === view);
    const to =
      e.key === "ArrowRight"
        ? (i + 1) % VIEWS.length
        : e.key === "ArrowLeft"
          ? (i + VIEWS.length - 1) % VIEWS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? VIEWS.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(VIEWS[to].id, true);
  }

  const busy =
    view === "pricing"
      ? pricing.pending || pricing.loading
      : view === "pace"
        ? pace.pending || pace.loading
        : area.pending || area.status === "loading";

  return (
    <Card
      cardRef={card}
      id="playground"
      index={index}
      name="Playground"
      icon={<PlaygroundIcon size={32} />}
      sentence="The Playground is the free map of every listing in Cyprus. Search a place or draw your own area, compare up to three, and read the market in five views."
      arrived={arrived}
      arriving={arriving}
      aside="A preview of each view. The Playground has the full thing."
      notes={[
        "Search any town, resort or district, or draw the area yourself.",
        "Compare up to three areas side by side.",
        "Filter by property type, bedrooms and nightly rate.",
      ]}
      action={
        // With the hero's button, the only accent fills on the page.
        <a href={area.playgroundHref} className="th-go">
          Open the Playground, it&apos;s free
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>
      }
      object={
        <div ref={objectRef}>
          <div className="ps-views">
            {/* Above the views, as the Playground's compared areas sit above its tabs. */}
            <HeadToHead area={area} near={near} />
            <div className="ps-tabs" data-more-start={more.start ? "" : undefined} data-more-end={more.end ? "" : undefined}>
              <div
                ref={listRef}
                className="ps-tablist"
                role="tablist"
                aria-label={`The Playground's five views, for ${area.name}`}
                onKeyDown={onKey}
                onScroll={measure}
              >
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    ref={(el) => {
                      tabs.current[v.id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${ids}-tab-${v.id}`}
                    aria-selected={view === v.id}
                    aria-controls={`${ids}-panel`}
                    tabIndex={view === v.id ? 0 : -1}
                    onClick={() => choose(v.id, false)}
                  >
                    {/* The label keeps the width of its bold form, so choosing a tab does not nudge the others. */}
                    <span data-label={v.label}>{v.label}</span>
                  </button>
                ))}
              </div>
              {/* More tabs lie to the right of a narrow row. */}
              <span className="ps-tabs-cue" aria-hidden="true">
                <ChevronRight size={18} strokeWidth={2.2} />
              </span>
            </div>
            <div
              className="ps-view"
              role="tabpanel"
              id={`${ids}-panel`}
              aria-labelledby={`${ids}-tab-${view}`}
              aria-busy={busy || undefined}
              tabIndex={0}
            >
              {view === "market" && <MarketView area={area} />}
              {view === "pricing" && <PricingView answer={pricing} />}
              {view === "pace" && <PaceView answer={pace} />}
              {view === "buyrent" && <BuyRentView area={area} />}
              {view === "calculator" && <CalculatorView area={area} />}
            </div>
          </div>
        </div>
      }
    />
  );
}
