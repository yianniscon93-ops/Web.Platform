"use client";

import { useMemo, useState } from "react";
import { MONTHS } from "@/lib/landing/areaLines";
import { seriesRange, type SeriesPoint } from "@/lib/landing/sectionLines";

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];

/** Round numbers that bracket the data in at most four steps, so both axis labels are round. */
function bounds(min: number, max: number): [number, number] {
  for (const step of STEPS) {
    const low = Math.floor(min / step) * step;
    const high = Math.max(low + step, Math.ceil(max / step) * step);
    if ((high - low) / step <= 4) return [low, high];
  }
  return [Math.floor(min), Math.ceil(max)];
}

/**
 * A series over time in the hero chart's style (OccupancyChart), for any
 * figure: one 2px line ending in a square node, the value axis's two ends
 * labelled, up to three month ticks, and a week or date read out under the
 * pointer. `subject` names the figure for the text alternative ("the share of
 * nights occupied by week"); `per` names a point ("Week of", "On"). Returns
 * nothing without at least three points: the caller says so in words.
 */
export function LineChart({
  points,
  format,
  subject,
  per,
  unit = "",
  caption,
}: {
  points: SeriesPoint[];
  format: (v: number) => string;
  subject: string;
  per: string;
  /** What follows a value in the readout: " occupied", " a night". */
  unit?: string;
  /** The line above the plot when nothing is pointed at. Defaults to what the series covers. */
  caption?: string;
}) {
  const [at, setAt] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (points.length < 3) return null;
    const t0 = points[0].t;
    const span = points[points.length - 1].t - t0 || 1;
    const [low, high] = bounds(Math.min(...points.map((p) => p.v)), Math.max(...points.map((p) => p.v)));
    const px = (t: number) => ((t - t0) / span) * 100;
    const py = (v: number) => (1 - (v - low) / (high - low)) * 100;
    // The first of each month inside the range; thinned to at most three, evenly.
    const firsts: Array<{ x: number; label: string }> = [];
    for (let y = points[0].y, m = points[0].m; ; m === 12 ? ((m = 1), y++) : m++) {
      const t = Date.UTC(y, m - 1, 1);
      if (t > t0 + span) break;
      if (t >= t0) firsts.push({ x: px(t), label: MONTHS[m - 1] });
    }
    const every = Math.ceil(firsts.length / 3);
    const ticks = firsts.filter((f, i) => i % every === Math.floor((every - 1) / 2) && f.x > 4 && f.x < 96);
    const lo = points.reduce((a, b) => (b.v < a.v ? b : a));
    const hi = points.reduce((a, b) => (b.v > a.v ? b : a));
    return {
      pts: points.map((p) => ({ x: px(p.t), y: py(p.v), v: p.v, label: p.label })),
      path: "M" + points.map((p) => `${px(p.t).toFixed(2)} ${py(p.v).toFixed(2)}`).join("L"),
      low,
      high,
      ticks,
      range: seriesRange(points),
      summary: `lowest ${format(lo.v)} (${lo.label}), highest ${format(hi.v)} (${hi.label})`,
    };
  }, [points, format]);

  if (!chart) return null;
  const hover = at == null ? null : chart.pts[at];
  const end = chart.pts[chart.pts.length - 1];

  function track(e: React.PointerEvent<HTMLDivElement>) {
    // The line is drawn in the plot's inner area, which stops short of the frame so the end node fits.
    const r = (e.currentTarget.firstElementChild ?? e.currentTarget).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    let best = 0;
    for (let i = 1; i < chart!.pts.length; i++) {
      if (Math.abs(chart!.pts[i].x - x) < Math.abs(chart!.pts[best].x - x)) best = i;
    }
    setAt(best);
  }

  return (
    <figure className="ps-chart">
      <figcaption className="ps-chart-cap">
        {hover ? (
          <>
            {per} {hover.label}:{" "}
            <b>
              {format(hover.v)}
              {unit}
            </b>
          </>
        ) : (
          (caption ?? chart.range)
        )}
      </figcaption>
      <div className="ps-chart-body">
        <span className="ps-chart-y" aria-hidden="true">
          <span>{format(chart.high)}</span>
          <span>{format(chart.low)}</span>
        </span>
        <div
          className="ps-chart-plot"
          role="img"
          aria-label={`Line chart of ${subject}, ${chart.range}: ${chart.summary}.`}
          onPointerMove={track}
          onPointerDown={track}
          onPointerLeave={() => setAt(null)}
        >
          <div className="ps-chart-area">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="ps-chart-line" d={chart.path} vectorEffect="non-scaling-stroke" />
            </svg>
            {/* The series ends in the brand's square node: where "latest" is. */}
            <i className="ps-chart-end" style={{ left: `${end.x}%`, top: `${end.y}%` }} />
            {hover && (
              <>
                <i className="ps-chart-cross" style={{ left: `${hover.x}%` }} />
                <i className="ps-chart-dot" style={{ left: `${hover.x}%`, top: `${hover.y}%` }} />
              </>
            )}
          </div>
        </div>
        <span className="ps-chart-x" aria-hidden="true">
          {chart.ticks.map((t) => (
            <span key={t.x} style={{ left: `${t.x}%` }}>
              {t.label}
            </span>
          ))}
        </span>
      </div>
    </figure>
  );
}

export interface Bar {
  /** Under the bar: "Oct". */
  label: string;
  /** For the text alternative: "October 2026". */
  name: string;
  v: number;
}

/**
 * A handful of labelled bars: each one named beneath and its value written
 * above it. With `axis` the value axis's two ends are labelled as well, for
 * values that do not say their own unit; without it the bars stand on a
 * baseline alone. `title` and `sub` are the two lines over the plot. Returns
 * nothing for an empty list.
 */
export function BarChart({
  bars,
  format,
  axis,
  subject,
  title,
  sub,
}: {
  bars: Bar[];
  /** A bar's own value, written above it. */
  format: (v: number) => string;
  /** The value axis's two ends. */
  axis?: (v: number) => string;
  subject: string;
  /** What the bars are, over the plot. */
  title?: string;
  /** A quieter second line: how the figures were arrived at. */
  sub?: string;
}) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => b.v));
  // With an axis the bars are measured against its round upper end; without one, against the tallest of them.
  const high = axis ? bounds(0, max)[1] : max || 1;
  return (
    <figure className="ps-chart ps-bars" data-axis={axis ? "" : undefined}>
      {(title || sub) && (
        <figcaption className="ps-bars-cap">
          {title && <b>{title}</b>}
          {sub && <span>{sub}</span>}
        </figcaption>
      )}
      <div className="ps-chart-body">
        {axis && (
          <span className="ps-chart-y" aria-hidden="true">
            <span>{axis(high)}</span>
            <span>{axis(0)}</span>
          </span>
        )}
        <div
          className="ps-chart-plot"
          role="img"
          aria-label={`Bar chart of ${subject}: ${bars.map((b) => `${b.name} ${format(b.v)}`).join(", ")}.`}
        >
          <div className="ps-bars-row" aria-hidden="true">
            {bars.map((b) => (
              <span key={b.name} className="ps-bar">
                <b>{format(b.v)}</b>
                <i style={{ "--ps-bar": b.v / high } as React.CSSProperties} />
              </span>
            ))}
          </div>
        </div>
        <span className="ps-bars-x" aria-hidden="true">
          {bars.map((b) => (
            <span key={b.name}>{b.label}</span>
          ))}
        </span>
      </div>
    </figure>
  );
}
