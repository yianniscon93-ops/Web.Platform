"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HeroArea } from "@/lib/landing/areaContext";
import { MIN_LISTINGS, SEASON, estimate, reading, revenueByMonth, seriesFacts } from "@/lib/landing/areaLines";
import { euro, pct, tooThin, weeklySeries } from "@/lib/landing/sectionLines";
import { ReportsIcon } from "./ProductIcons";
import { Card, Covers, NO_FIGURES, READING, Standin, UNREACHABLE, carryRequest, inside, stillPreferred, useArrival } from "./SectionParts";
import { BarChart, LineChart } from "./SeriesChart";

/** The sample blocks a section of the report can carry. Each is built from figures for the visitor's area or not at all. */
type Sample = "rates" | "year" | "comparables" | "costs";

/**
 * A section of a report, as the sheet shows it. A section the page has
 * figures for carries its sentence and a `sample` block built from them; one
 * it has none for carries the list of what it `contains`, and no figure or
 * chart is ever drawn to stand in for the real one.
 */
interface ReportSection {
  title: string;
  /** What the section shows, in one sentence. */
  about?: string;
  sample?: Sample;
  /** What the section contains, where the page has no figures for it. */
  contains?: string[];
  /** One of the property report's analysis sections: each ends in one key finding. */
  analysis?: boolean;
  /**
   * True where the sample shows fewer figures than the real page has: `about` then describes the page as the
   * team writes it, and the sample says which of its figures the visitor's area has today.
   */
  partial?: boolean;
}

/** A title as it is set: its hyphens do not break, so "minimum-nights" stays on one line in the narrow rail. */
const unbroken = (title: string) => title.replace(/-/g, "\u2011");

// The two kinds of report the team writes. The section titles are the reports' own, verbatim.
const REPORTS = {
  property: {
    label: "For a property",
    title: "Revenue feasibility of a property",
    subject: "your property",
    sections: [
      { title: "Executive summary", contains: ["The answer in a paragraph", "Its caveats"] },
      {
        title: "Key figures at a glance",
        about:
          "As the team writes it for your property: yearly gross, occupancy, average nightly rate and what is left after costs, on one line.",
        sample: "rates",
        partial: true,
      },
      {
        title: "Revenue potential across the year",
        about: "Revenue month by month, with occupancy and nightly rate beside it.",
        sample: "year",
        analysis: true,
      },
      {
        title: "Price & minimum-nights levers",
        contains: ["A demand curve against nightly price", "The effect of the minimum stay"],
        analysis: true,
      },
      { title: "What each amenity is worth", contains: ["The premium each amenity carries"], analysis: true },
      { title: "The review flywheel", contains: ["The cold start", "How the first reviews change bookings"], analysis: true },
      { title: "From gross to net", contains: ["A cost waterfall from gross revenue to net"], analysis: true },
      {
        title: "The comparable set",
        about: "The listings the figures rest on, ranked by how alike they are.",
        sample: "comparables",
      },
      { title: "Conclusions & revenue impact", contains: ["The scenarios side by side"] },
    ],
  },
  area: {
    label: "For an area",
    title: "An area, end to end",
    subject: "your area",
    sections: [
      { title: "What it costs", about: "Asking prices and rents in the area.", sample: "costs" },
      { title: "What it earns", about: "Occupancy and nightly rates across the area.", sample: "rates" },
      { title: "Features that pay", contains: ["Which features carry a premium"] },
      { title: "Investment case", contains: ["Buying set against letting"] },
    ],
  },
} satisfies Record<string, { label: string; title: string; subject: string; sections: ReportSection[] }>;
type Kind = keyof typeof REPORTS;
const KINDS: Kind[] = ["property", "area"];

/**
 * The sample block for a section, from today's figures for the visitor's
 * area. Where there is no real figure to show it says so in words (still
 * loading, unreachable, too few listings, nothing to draw).
 */
function SampleBlock({ sample, area, partial }: { sample: Sample; area: HeroArea; partial?: boolean }) {
  const { stats = null, rentals = null, invest = null } = area.figures ?? {};
  const weekly = useMemo(() => (stats ? weeklySeries(stats.weekly, "effOcc") : []), [stats]);
  const revenue = useMemo(() => (stats ? revenueByMonth(stats.weekly) : null), [stats]);
  const count = area.count ?? stats?.listingCount ?? null;
  const thin = count == null ? null : tooThin(count);
  const late = area.pending ? "" : undefined;
  const none = (
    <div className="ps-sample">
      <Standin busy={area.status === "loading"}>
        {area.status === "loading" ? READING : area.status === "error" ? UNREACHABLE : NO_FIGURES}
      </Standin>
    </div>
  );

  if (sample === "costs") {
    const price = invest?.priceQuartiles?.[1] ?? null;
    const rent = rentals?.rentQuartiles?.[1] ?? null;
    if (price == null && rent == null) return none;
    const cover = (r: { source: "live" | "demo" } | null) => (inside(r) ? "inside the line" : "all of Cyprus");
    return (
      <div className="ps-sample" aria-busy={(area.pending && (inside(invest) || inside(rentals))) || undefined}>
        <dl className="ps-facts">
          {price != null && (
            <div data-pending={area.pending && inside(invest) ? "" : undefined}>
              <dt>
                Median asking price <small>{cover(invest)}</small>
              </dt>
              <dd>{euro(price)}</dd>
            </div>
          )}
          {rent != null && (
            <div data-pending={area.pending && inside(rentals) ? "" : undefined}>
              <dt>
                Median rent <small>{cover(rentals)}</small>
              </dt>
              <dd>
                {euro(rent)} <span>a month</span>
              </dd>
            </div>
          )}
        </dl>
        <Covers demo={[invest, rentals].some((r) => r?.source === "demo")} />
      </div>
    );
  }

  // Everything else is short-let figures from /stats, which is for the drawn area in live and in demo mode.
  if (!stats) return none;
  if (thin) return <p className="ps-sample ps-sample-words">{thin}</p>;

  if (sample === "rates") {
    if (stats.effOccTodate == null && stats.medianRate == null) return none;
    // Which of the real page's figures this area has today, named, so the two rows are not read as the whole page.
    const have = [stats.effOccTodate != null && "occupancy", stats.medianRate != null && "nightly rate"].filter(Boolean).join(" and ");
    return (
      <div className="ps-sample" aria-busy={area.pending || undefined}>
        <p className="ps-sample-cap">{partial ? `From this area today: ${have}.` : <>Short&#8209;lets in {area.name}</>}</p>
        <dl className="ps-facts" data-pending={late}>
          {stats.effOccTodate != null && (
            <div>
              <dt>
                Nights occupied <small>{SEASON}</small>
              </dt>
              <dd>{pct(stats.effOccTodate)}</dd>
            </div>
          )}
          {stats.medianRate != null && (
            <div>
              <dt>Median nightly rate</dt>
              <dd>{euro(stats.medianRate)}</dd>
            </div>
          )}
        </dl>
        <Covers demo={stats.source === "demo"} scope="inside the line" />
      </div>
    );
  }

  if (sample === "year") {
    if (revenue) {
      return (
        <div className="ps-sample" aria-busy={area.pending || undefined}>
          <div data-pending={late}>
            <BarChart
              bars={revenue.months}
              format={estimate}
              subject={`estimated revenue per listing by month for short-lets in ${area.name}`}
              title={`Revenue per listing by month, ${revenue.range}`}
              sub="Estimated from weekly occupancy and nightly rate"
            />
          </div>
          <Covers demo={stats.source === "demo"} scope="inside the line" />
        </div>
      );
    }
    // No nightly rate in the weekly figures: occupancy by week instead, and the block says so.
    if (weekly.length < 3) return none;
    return (
      <div className="ps-sample" aria-busy={area.pending || undefined}>
        <p className="ps-sample-cap">Nights occupied by week, short&#8209;lets in {area.name}</p>
        <div data-pending={late}>
          <LineChart
            points={weekly}
            format={pct}
            unit=" occupied"
            subject={`the share of nights occupied by week for short-lets in ${area.name}`}
            per="Week of"
          />
        </div>
        <Covers demo={stats.source === "demo"} scope="inside the line">
          <span>The weekly figures carry no nightly rate, so this is occupancy, not revenue.</span>
        </Covers>
      </div>
    );
  }

  const rows = stats.topListings.filter((l) => l.name).slice(0, 3);
  if (!rows.length) return none;
  return (
    <div className="ps-sample" aria-busy={area.pending || undefined}>
      <table className="ps-table ps-comps" data-pending={late}>
        <caption>
          {rows.length === 1 ? "The fullest short\u2011let" : `The ${rows.length} fullest short\u2011lets`} in {area.name}
        </caption>
        <thead>
          <tr>
            <th scope="col">Listing</th>
            <th scope="col">A night</th>
            <th scope="col">Occupied {SEASON}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <th scope="row">{l.name}</th>
              <td>{l.nightlyRate == null ? "–" : <b>{euro(l.nightlyRate)}</b>}</td>
              <td>{l.effOccTodate == null ? "–" : <b>{pct(l.effOccTodate)}</b>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Covers demo={stats.source === "demo"} scope="inside the line" />
    </div>
  );
}

/**
 * The key finding an analysis section ends in. The page writes one only where
 * its figures support it (the year's revenue); every other slot is drawn
 * empty and says who fills it.
 */
function keyFinding(sample: Sample | undefined, area: HeroArea): string | null {
  const stats = area.figures?.stats ?? null;
  const count = area.count ?? stats?.listingCount ?? null;
  if (sample !== "year" || !stats || count == null || count < MIN_LISTINGS) return null;
  if (!revenueByMonth(stats.weekly) && !seriesFacts(stats.weekly)) return null;
  // The hero's reading of the same chart, so the page words it one way.
  return reading(count, stats);
}

// How long a page takes to leave the sheet, and the next one to come in.
const LEAF_MS = 250;

/**
 * The Reports card: a report to leaf through. A switch picks the kind of
 * report, a contents rail lists its real section titles, and the sheet turns
 * to the one chosen: a sample block wherever the visitor's area has real
 * figures for it, a list of what the section contains where it has none, and
 * on the analysis sections the key finding each ends in. On arrival the sheet
 * is dealt onto the card, once; leafing turns the page (out to one side, the
 * next in from the other).
 */
export default function ReportsSection({ area, index }: { area: HeroArea; index: number }) {
  const [kind, setKind] = useState<Kind>("property");
  // Each kind of report keeps its own place. Both open on a section the visitor's area has figures for.
  const [at, setAt] = useState<Record<Kind, number>>({ property: 1, area: 0 });
  // The page on the sheet. It follows `kind` and `at`, a page-turn behind them when motion is allowed.
  const [shown, setShown] = useState<{ kind: Kind; i: number }>({ kind: "property", i: 1 });
  // A page-turn under way: the old page leaving, or the new one coming in, and which way.
  const [leaf, setLeaf] = useState<{ stage: "out" | "in"; dir: 1 | -1 } | null>(null);
  const ids = useId();
  const card = useRef<HTMLElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const timers = useRef<number[]>([]);
  const { arrived, arriving } = useArrival(card);
  const sections: ReportSection[] = REPORTS[kind].sections;
  const i = at[kind];
  const first = i === 0;
  const last = i === sections.length - 1;
  // What the sheet shows now.
  const report = REPORTS[shown.kind];
  const page: ReportSection = report.sections[shown.i];
  const found = page.analysis ? keyFinding(page.sample, area) : null;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Puts page `to` of report `k` on the sheet: at once, or as a page-turn. `dir` is 1 forwards, -1 back. */
  function show(k: Kind, to: number, dir: 1 | -1) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (stillPreferred()) {
      setLeaf(null);
      setShown({ kind: k, i: to });
      return;
    }
    setLeaf({ stage: "out", dir });
    timers.current.push(
      window.setTimeout(() => {
        setShown({ kind: k, i: to });
        setLeaf({ stage: "in", dir });
      }, LEAF_MS),
      window.setTimeout(() => setLeaf(null), LEAF_MS * 2)
    );
  }

  const turn = (to: number, focus = false) => {
    if (to < 0 || to >= sections.length) return;
    if (focus) rail.current?.querySelectorAll<HTMLButtonElement>("button")[to]?.focus();
    if (to === i) return;
    setAt((a) => ({ ...a, [kind]: to }));
    show(kind, to, to > i ? 1 : -1);
  };

  const pick = (k: Kind) => {
    if (k === kind) return;
    setKind(k);
    show(k, at[k], k === "area" ? 1 : -1);
  };

  function onKey(e: React.KeyboardEvent) {
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? i + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? sections.length - 1
              : null;
    if (to == null) return;
    e.preventDefault();
    turn(to, true);
  }

  return (
    <Card
      cardRef={card}
      id="reports"
      index={index}
      name="Reports"
      icon={<ReportsIcon size={32} />}
      sentence="When you need more than a map, we write it up: a report on one property or one area, built from the same listings."
      arrived={arrived}
      arriving={arriving}
      aside={`Sample. The figures are today\u2019s for ${area.changed ? "the area you drew" : "the area on the map"}; a real report is written by the team.`}
      notes={[
        "Written by the team for your property or your area.",
        "Each analysis section ends in one key finding.",
        "It arrives as a single web page you can open, share, or print to PDF.",
      ]}
      action={
        <a href="#access" className="ps-solid" onClick={() => carryRequest(`A report on ${area.name}`)}>
          Ask for a report
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>
      }
      lead={
        <div className="ps-report-nav">
          <div className="ps-switch" role="group" aria-label="Kind of report">
            {KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => pick(k)}>
                {REPORTS[k].label}
              </button>
            ))}
          </div>

          {/* Narrow screens: the contents as one control above the sheet. */}
          <label className="ps-contents-select">
            <span>Section</span>
            <select value={i} onChange={(e) => turn(Number(e.target.value))}>
              {sections.map((s, n) => (
                <option key={s.title} value={n}>
                  {unbroken(s.title)}
                </option>
              ))}
            </select>
          </label>

          <nav className="ps-contents" aria-label={`Contents of the report: ${REPORTS[kind].title}`}>
            <ol ref={rail} onKeyDown={onKey}>
              {sections.map((s, n) => (
                <li key={s.title} style={{ "--n": n } as React.CSSProperties}>
                  <button type="button" aria-current={n === i ? "true" : undefined} onClick={() => turn(n)}>
                    {/* The title's bold setting is always there, unseen, under the one on show: the row has the
                        height of whichever wraps to more lines, so choosing a section never moves the others. */}
                    <span className="ps-contents-label" data-bold={unbroken(s.title)}>
                      <span>{unbroken(s.title)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      }
      object={
        <div className="ps-sheet-col">
          <article className="ps-sheet" aria-labelledby={`${ids}-page`}>
            {/* The running head of every page: which report, and which page of it. */}
            <p className="ps-sheet-head">
              <span>{report.title}</span>
              <span>
                <span className="sr-only">Section </span>
                {shown.i + 1} of {report.sections.length}
              </span>
            </p>
            <div
              className="ps-sheet-body"
              data-leaf={leaf?.stage}
              style={leaf ? ({ "--dir": leaf.dir } as React.CSSProperties) : undefined}
            >
              <div className="ps-sheet-page" aria-live="polite" aria-atomic="true">
                <h3 id={`${ids}-page`}>{unbroken(page.title)}</h3>
                {page.about && <p>{page.about}</p>}
              </div>
              {page.sample && <SampleBlock key={`${shown.kind}-${shown.i}`} sample={page.sample} area={area} partial={page.partial} />}
              {page.contains && (
                <div className="ps-sample">
                  <p id={`${ids}-contains`} className="ps-sample-cap">
                    In this section
                  </p>
                  <ul className="ps-contains" aria-labelledby={`${ids}-contains`}>
                    {page.contains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {page.analysis && (
                <p className="ps-finding" data-empty={found ? undefined : ""} data-pending={found && area.pending ? "" : undefined}>
                  <b>Key finding:</b> {found ?? `written by the team for ${report.subject}`}
                </p>
              )}
            </div>
            <div className="ps-sheet-foot">
              {/* At either end the button stays focusable and says it is unavailable; it is not removed from under the keyboard. */}
              <div className="ps-pager">
                <button type="button" onClick={() => turn(i - 1)} aria-disabled={first || undefined} aria-label="Previous section">
                  <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => turn(i + 1)}
                  aria-disabled={last || undefined}
                  aria-label={last ? undefined : `Next section: ${sections[i + 1].title}`}
                >
                  {last ? (
                    "Last section"
                  ) : (
                    <>
                      {/* A narrow sheet has room for "Next" only; the title is in the button's name either way. */}
                      <span className="ps-pager-next">Next</span>
                      <span className="ps-pager-title">{unbroken(sections[i + 1].title)}</span>
                      <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              {/* How a real report is delivered, in the place a page's footer goes. */}
              <p className="ps-sheet-line">Opens as a web page. Prints to PDF.</p>
            </div>
          </article>
        </div>
      }
    />
  );
}
