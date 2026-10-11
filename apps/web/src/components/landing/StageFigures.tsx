"use client";

import { ArrowRight } from "lucide-react";
import type { InvestStats, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { fmtEuro, fmtInt } from "@/lib/dashboard/format";
import { SEASON, areaName, pct } from "@/lib/landing/areaLines";
import AreaMark from "./AreaMark";

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

export interface StageFiguresProps {
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
  /** The mark heading the block, for the line that runs to it from the area on the map. */
  markRef: (el: HTMLSpanElement | null) => void;
}

type Cell = { figure: string; unit?: string; pending: boolean } | null;

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
    { id: "str", name: "Short-\u2060let", scope: inside },
    { id: "ltr", name: "Long-\u2060let", scope: cover(rentals) },
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
 * Beside the map, what the area holds: short-lets, long-lets and homes for sale side by side, and the page's one
 * filled action. The three products are explained in their own sections down the page (critique, 2026-10-11:
 * the stage's panels told them a fourth time); here the area's figures and the way into the Playground are all.
 */
export default function StageFigures({
  place,
  changed,
  roams,
  count,
  figures,
  status,
  pending,
  playgroundHref,
  markRef,
}: StageFiguresProps) {
  const area = areaName(place, changed, roams);
  return (
    <div className="th-panels">
      <section className="th-panel" data-open="" aria-labelledby="th-inside-h">
        <div className="th-panel-head">
          <span ref={markRef} className="th-panel-icon">
            <AreaMark size={40} />
          </span>
          <div className="min-w-0">
            <div className="th-panel-title">
              <h3 id="th-inside-h" className="m-0">
                Inside the line
              </h3>
              <p className="th-panel-about m-0">What {area} earns, rents for and sells for.</p>
            </div>
          </div>
        </div>
        <div className="th-panel-body">
          <div className="th-panel-in">
            <div className="th-panel-pad">
              {status === "error" ? (
                <p className="th-panel-note m-0">
                  We couldn&apos;t reach the listings just now, so there are no numbers to show. The Playground has
                  them when it is back.
                </p>
              ) : (
                <MarketsTable figures={figures} count={count} loading={status === "loading"} pending={pending} area={area} />
              )}
              <div className="th-actions">
                {/* The page's one filled action. On phones it sits under the stage's sentence instead (DrawHero). */}
                <a href={playgroundHref} className="th-go th-go-panel">
                  Open the Playground, it&apos;s free
                  <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
