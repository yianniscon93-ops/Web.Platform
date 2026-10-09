"use client";

import { useMemo, useState } from "react";
import type { WeeklyPoint } from "@/lib/dashboard/types";
import { MONTHS, weekOf } from "@/lib/landing/areaLines";

/**
 * Occupancy by week for the drawn area, from the `weekly` series /stats
 * returns: one 2px line, the axis's two ends labelled, and up to three month
 * ticks. Pointing at it reads out a week. Returns nothing without at least
 * three weeks of data.
 */
export default function OccupancyChart({ weekly }: { weekly: WeeklyPoint[] }) {
  const [at, setAt] = useState<number | null>(null);

  const chart = useMemo(() => {
    const pts = weekly
      .filter((w): w is WeeklyPoint & { effOcc: number } => w.effOcc != null)
      .map((w) => ({ ...weekOf(w.weekStart), v: w.effOcc }));
    if (pts.length < 3) return null;
    const t0 = pts[0].t;
    const span = pts[pts.length - 1].t - t0 || 1;
    // The axis runs between the tens that bracket the data, so its two labels are round.
    const low = Math.floor(Math.min(...pts.map((p) => p.v)) / 10) * 10;
    const high = Math.max(low + 10, Math.ceil(Math.max(...pts.map((p) => p.v)) / 10) * 10);
    const px = (t: number) => ((t - t0) / span) * 100;
    const py = (v: number) => (1 - (v - low) / (high - low)) * 100;
    // The first of each month inside the range; thinned to at most three, evenly.
    const firsts: Array<{ x: number; label: string }> = [];
    for (let y = pts[0].y, m = pts[0].m; ; m === 12 ? ((m = 1), y++) : m++) {
      const t = Date.UTC(y, m - 1, 1);
      if (t > t0 + span) break;
      if (t >= t0) firsts.push({ x: px(t), label: MONTHS[m - 1] });
    }
    const every = Math.ceil(firsts.length / 3);
    const ticks = firsts.filter((f, i) => i % every === Math.floor((every - 1) / 2) && f.x > 4 && f.x < 96);
    const lo = pts.reduce((a, b) => (b.v < a.v ? b : a));
    const hi = pts.reduce((a, b) => (b.v > a.v ? b : a));
    const when = (p: { d: number; m: number }) => `${p.d} ${MONTHS[p.m - 1]}`;
    return {
      pts: pts.map((p) => ({ x: px(p.t), y: py(p.v), v: p.v, label: when(p) })),
      path: "M" + pts.map((p) => `${px(p.t).toFixed(2)} ${py(p.v).toFixed(2)}`).join("L"),
      low,
      high,
      ticks,
      range: `${when(pts[0])} to ${when(pts[pts.length - 1])} ${pts[pts.length - 1].y}`,
      summary: `lowest ${Math.round(lo.v)}% in the week of ${when(lo)}, highest ${Math.round(hi.v)}% in the week of ${when(hi)}`,
    };
  }, [weekly]);

  if (!chart) return null;
  const hover = at == null ? null : chart.pts[at];

  function track(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    let best = 0;
    for (let i = 1; i < chart!.pts.length; i++) {
      if (Math.abs(chart!.pts[i].x - x) < Math.abs(chart!.pts[best].x - x)) best = i;
    }
    setAt(best);
  }

  return (
    <figure className="th-chart m-0">
      <figcaption className="th-chart-cap">
        {hover ? (
          <>
            Week of {hover.label}: <b>{Math.round(hover.v)}% occupied</b>
          </>
        ) : (
          <>Nights occupied by week, {chart.range}</>
        )}
      </figcaption>
      <div className="th-chart-body">
        <span className="th-chart-y" aria-hidden="true">
          <span>{chart.high}%</span>
          <span>{chart.low}%</span>
        </span>
        <div
          className="th-chart-plot"
          role="img"
          aria-label={`Line chart of the share of nights occupied by week, ${chart.range}: ${chart.summary}.`}
          onPointerMove={track}
          onPointerDown={track}
          onPointerLeave={() => setAt(null)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="th-chart-line" d={chart.path} vectorEffect="non-scaling-stroke" />
          </svg>
          {hover && (
            <>
              <i className="th-chart-cross" style={{ left: `${hover.x}%` }} />
              <i className="th-chart-dot" style={{ left: `${hover.x}%`, top: `${hover.y}%` }} />
            </>
          )}
        </div>
        <span className="th-chart-x" aria-hidden="true">
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
