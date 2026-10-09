"use client";

import { ArrowDown, ArrowRight, ChevronDown } from "lucide-react";
import type { InvestStats, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { fmtEuro, fmtInt } from "@/lib/dashboard/format";
import { BRAND } from "@/lib/brand";
import {
  COUNTING,
  READING,
  SEASON,
  UNREACHABLE,
  answer,
  areaName,
  estimate,
  pct,
  playgroundLine,
  question,
  reading,
  reportsLine,
  revenueByMonth,
  seriesFacts,
} from "@/lib/landing/areaLines";
import OccupancyChart from "./OccupancyChart";
import { ConnectorIcon, PlaygroundIcon, ReportsIcon } from "./ProductIcons";
import { BarChart } from "./SeriesChart";

export type ProductId = "playground" | "reports" | "connector";
export const PRODUCTS: ProductId[] = ["playground", "reports", "connector"];

/** What the three endpoints returned for the area as last released. The last two may have failed. */
export interface AreaFigures {
  stats: SelectionStats;
  rentals: RentalStats | null;
  invest: InvestStats | null;
}

/**
 * Whether a long-let or for-sale answer is for the drawn area. The live
 * queries filter by the polygon; the demo fallbacks (demoRentals, demoInvest
 * in marketData.ts) take no polygon and return one island-wide figure, so a
 * "demo" answer must not be shown as if it were inside the line.
 */
export const scoped = (r: { source: "live" | "demo" } | null) => r?.source === "live";

export interface ProductPanelsProps {
  place: string;
  changed: boolean;
  /** The area can have been taken anywhere on its map (the island's), so once changed it is not "near" the place. */
  roams?: boolean;
  /** Listings inside the area as it stands, when known: the same figure the map shows. */
  count: number | null;
  figures: AreaFigures | null;
  status: "loading" | "ready" | "error";
  /** The area moved and its figures have not arrived yet; the old ones stay, marked. */
  pending: boolean;
  playgroundHref: string;
  open: ProductId;
  /** True once the visitor has opened a panel: an opening panel's icon then makes its one small move. */
  lively: boolean;
  onOpen: (id: ProductId) => void;
  /** Each panel's icon, for the lines that run to them. */
  iconRef: (id: ProductId) => (el: HTMLSpanElement | null) => void;
}

type Cell = { figure: string; unit?: string; pending: boolean } | null;

function Panel({
  id,
  name,
  about,
  line,
  linePending,
  follows = true,
  icon,
  open,
  lively,
  onOpen,
  iconRef,
  children,
}: {
  id: ProductId;
  name: string;
  about: string;
  line: string;
  linePending: boolean;
  /** False when the line does not depend on what is inside the area, so it need not step back while a corner moves. */
  follows?: boolean;
  icon: React.ReactNode;
  open: boolean;
  /** True when the visitor opened this panel: its icon then makes its one small move. */
  lively: boolean;
  onOpen: (id: ProductId) => void;
  iconRef: (el: HTMLSpanElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="th-panel" data-open={open ? "" : undefined} data-lively={lively ? "" : undefined}>
      <div className="th-panel-head">
        <span ref={iconRef} className="th-panel-icon">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="th-panel-title">
            <h2 className="m-0">
              {/* The button stretches over the whole header (::after), so the heading keeps a short name. */}
              <button
                type="button"
                id={`th-${id}-head`}
                aria-expanded={open}
                aria-controls={`th-${id}-body`}
                // One panel is always open, so the open one cannot be collapsed.
                aria-disabled={open || undefined}
                onClick={() => onOpen(id)}
              >
                {name}
              </button>
            </h2>
            <p className="th-panel-about m-0">{about}</p>
          </div>
          {/* Open, the panel's own content says this and more, so the line steps aside. */}
          <p
            className="th-panel-live m-0"
            hidden={open}
            data-follows={follows ? "" : undefined}
            data-pending={linePending ? "" : undefined}
            aria-busy={linePending || undefined}
          >
            {line}
          </p>
        </div>
        <ChevronDown className="th-panel-chevron" size={18} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div id={`th-${id}-body`} className="th-panel-body" role="region" aria-labelledby={`th-${id}-head`} inert={!open}>
        <div className="th-panel-in">
          <div className="th-panel-pad">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * The link in each open panel, down the page to that product's own section: a text link with a down
 * arrow, the same in all three. `about` is the end of its sentence; beside the filled button, where the
 * row has no room for it, that part is kept for assistive tech only (the panel has already named the product).
 */
function More({ id, about }: { id: ProductId; about: string }) {
  return (
    <a href={`#${id}`} className="th-more">
      <span>
        Find out more<span className="th-more-about"> {about}</span>
      </span>
      <ArrowDown size={16} strokeWidth={2.2} aria-hidden="true" />
    </a>
  );
}

/** Short-let, long-let and for-sale side by side, each column saying what its figures cover. */
function MarketsTable({
  figures,
  count,
  loading,
  pending,
  area,
}: {
  figures: AreaFigures | null;
  count: number | null;
  loading: boolean;
  pending: boolean;
  area: string;
}) {
  const { stats = null, rentals = null, invest = null } = figures ?? {};
  // What is still on its way for each column. A figure that is not for the drawn area does not change when the area does.
  const wait = [loading || pending, loading || (pending && scoped(rentals)), loading || (pending && scoped(invest))];
  const listings = (n: number | null | undefined, late: boolean): Cell =>
    n == null ? null : { figure: fmtInt(n), unit: n === 1 ? "listing" : "listings", pending: late };
  const money = (v: number | null | undefined, late: boolean, unit?: string): Cell =>
    v == null ? null : { figure: fmtEuro(v), unit, pending: late };
  const rents = rentals?.rentQuartiles;
  const rows: Array<{ label: string; cells: [Cell, Cell, Cell] }> = [
    {
      label: "Listings",
      // The short-let count is the map's own, so it is never behind the line as drawn.
      cells: [listings(count, false), listings(rentals?.supply, wait[1]), listings(invest?.supply, wait[2])],
    },
    {
      label: "Typical price",
      cells: [
        money(stats?.medianRate, wait[0], "a night"),
        money(rents?.[1], wait[1], "a month"),
        money(invest?.priceQuartiles?.[1], wait[2]),
      ],
    },
    {
      label: "How full, the middle half of rents, and the price per square metre",
      cells: [
        stats?.effOccTodate == null
          ? null
          : { figure: pct(stats.effOccTodate), unit: `occupied ${SEASON}`, pending: wait[0] },
        rents ? { figure: `${fmtEuro(rents[0])} to ${fmtEuro(rents[2])}`, unit: "for most", pending: wait[1] } : null,
        money(invest?.eurPerM2Median, wait[2], "per m²"),
      ],
    },
  ];
  // While the first answer is on its way every row holds its place; after that a row with nothing in it goes.
  const shown = loading ? rows : rows.filter((r) => r.cells.some(Boolean));
  const inside = "inside the line";
  const cover = (r: { source: "live" | "demo" } | null) => (loading || !r ? "\u00a0" : scoped(r) ? inside : "all of Cyprus");
  const columns = [
    { id: "str", name: "Short\u2011let", scope: inside },
    { id: "ltr", name: "Long\u2011let", scope: cover(rentals) },
    { id: "sale", name: "For sale", scope: cover(invest) },
  ];
  const demo = [stats, rentals, invest].some((r) => r?.source === "demo");
  return (
    <table className="th-markets" aria-busy={loading || pending || undefined}>
      <caption>
        <span className="sr-only">Short-let, long-let and for-sale listings for {area}</span>
        {demo && <span className="th-tag">Demo data</span>}
      </caption>
      {/* The row names are for assistive tech only: each cell already says what it is. Their column has no width. */}
      <colgroup>
        <col className="th-rowhead" />
        {/* The first column carries the occupancy with its period, the middle one a range. */}
        <col style={{ width: "35%" }} />
        <col style={{ width: "37%" }} />
        <col style={{ width: "28%" }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="th-rowhead">
            <span className="sr-only">Figure</span>
          </th>
          {columns.map((c) => (
            <th key={c.id} scope="col">
              {c.name}
              <small>{c.scope}</small>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="th-rowhead">
              <span className="sr-only">{row.label}</span>
            </th>
            {row.cells.map((cell, i) => (
              <td
                key={columns[i].id}
                // The short-let column describes what is inside the line, so it steps back while a corner moves.
                data-follows={i === 0 ? "" : undefined}
                data-pending={cell ? (cell.pending ? "" : undefined) : wait[i] ? "" : undefined}
              >
                {cell ? (
                  <>
                    <b>{cell.figure}</b>
                    {/* The space stays outside the unit, so a narrow cell breaks there and nowhere else. */}
                    {cell.unit && (
                      <>
                        {" "}
                        <span>{cell.unit}</span>
                      </>
                    )}
                  </>
                ) : (
                  // An en dash holds an empty cell.
                  <>
                    <b className="th-none" aria-hidden="true">
                      –
                    </b>
                    <span className="sr-only">no figure</span>
                  </>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The three products, each made from the area on the map. One panel is open
 * at a time; a header opens its panel on click, Enter or Space, never on focus
 * alone, and nothing advances on its own.
 */
export default function ProductPanels({
  place,
  changed,
  roams,
  count,
  figures,
  status,
  pending,
  playgroundHref,
  open,
  lively,
  onOpen,
  iconRef,
}: ProductPanelsProps) {
  const stats = figures?.stats ?? null;
  const area = areaName(place, changed, roams);
  const loading = status === "loading";
  const late = loading || pending;
  const asked = question(place, changed, roams);
  // Until the count and the figures are both in, a sentence says what is happening instead.
  const say = (make: (n: number, s: SelectionStats) => string) =>
    count != null && stats ? make(count, stats) : loading || count == null ? READING : UNREACHABLE;
  // The sample page's chart: estimated revenue by month, or occupancy by week where the weekly figures carry no rate.
  const quotable = count != null && count > 0 && stats != null;
  const revenue = quotable ? revenueByMonth(stats.weekly) : null;
  const series = quotable && !revenue ? seriesFacts(stats.weekly) : null;

  return (
    <div className="th-panels">
      <Panel
        id="playground"
        name="Playground"
        about="Explore every listing yourself. Free."
        line={
          count != null
            ? playgroundLine(count, pending ? null : stats)
            : loading
              ? COUNTING
              : UNREACHABLE
        }
        linePending={late}
        icon={<PlaygroundIcon />}
        open={open === "playground"}
        lively={lively}
        onOpen={onOpen}
        iconRef={iconRef("playground")}
      >
        {status === "error" ? (
          <p className="th-panel-note m-0">
            We couldn&apos;t reach the listings just now, so there are no numbers to show. The Playground has them
            when it is back.
          </p>
        ) : (
          <MarketsTable figures={figures} count={count} loading={loading} pending={pending} area={area} />
        )}
        <div className="th-actions" data-pair="">
          {/* The page's one filled action. On phones it sits under the headline instead (DrawHero). */}
          <a href={playgroundHref} className="th-go th-go-panel">
            Open the Playground, it&apos;s free
            <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </a>
          <More id="playground" about="about the Playground" />
        </div>
      </Panel>

      <Panel
        id="reports"
        name="Reports"
        about="We write it up for you."
        line={say(reportsLine)}
        linePending={late}
        icon={<ReportsIcon />}
        open={open === "reports"}
        lively={lively}
        onOpen={onOpen}
        iconRef={iconRef("reports")}
      >
        <article className="th-sheet" aria-busy={late || undefined}>
          <h3 className="m-0">Short&#8209;lets in {area}</h3>
          {revenue && (
            <div data-follows="" data-pending={late ? "" : undefined}>
              <BarChart
                bars={revenue.months}
                format={estimate}
                subject={`estimated revenue per listing by month for short-lets in ${area}`}
                title={`Revenue per listing by month, ${revenue.range}`}
                sub="Estimated from weekly occupancy and nightly rate"
              />
            </div>
          )}
          {series && stats && (
            <>
              <OccupancyChart weekly={stats.weekly} />
              <p className="th-chart-note m-0">The weekly figures carry no nightly rate, so this is occupancy, not revenue.</p>
            </>
          )}
          {/* Holds the chart's place while the first answer is on its way, so the page does not grow when it lands. */}
          {loading && <div className="th-chart-hold" aria-hidden="true" />}
          <p className="m-0" data-follows="" data-pending={late ? "" : undefined}>
            {say(reading)}
          </p>
          <p className="th-sample m-0">Sample page. Real reports are written by the team.</p>
        </article>
        <div className="th-actions">
          <More id="reports" about="about reports" />
        </div>
      </Panel>

      <Panel
        id="connector"
        name="Connector"
        about="Ask it in Claude."
        line={asked}
        linePending={false}
        follows={false}
        icon={<ConnectorIcon />}
        open={open === "connector"}
        lively={lively}
        onOpen={onOpen}
        iconRef={iconRef("connector")}
      >
        <div className="th-exchange" aria-busy={late || undefined}>
          <p className="th-asked m-0">{asked}</p>
          <p className="th-tool m-0">
            <span>Answered through the {BRAND.name} connector, Noesis Cyprus</span>
            <span className="th-sample">Example answer</span>
          </p>
          <div className="th-answer">
            <p className="m-0" data-follows="" data-pending={late ? "" : undefined}>
              {say(answer)}
            </p>
            <a href={playgroundHref} className="th-link">
              See it on the map
            </a>
          </div>
        </div>
        <div className="th-actions">
          <More id="connector" about="about the connector" />
        </div>
      </Panel>
    </div>
  );
}
