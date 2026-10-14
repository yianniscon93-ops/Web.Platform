"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listingPoints } from "@/lib/landing/listingPoints";

/** How many short-lets the curve is drawn from, and the share booked at least each whole per cent of nights. */
type Curve = { n: number; atLeast: number[] };

/** The share of listings whose season occupancy is at least each whole per cent, 0 to 100. */
function curveOf(values: number[]): Curve {
  const sorted = [...values].sort((a, b) => a - b);
  const atLeast: number[] = [];
  let i = 0;
  for (let x = 0; x <= 100; x++) {
    while (i < sorted.length && sorted[i] < x) i++;
    atLeast.push((sorted.length - i) / sorted.length);
  }
  return { n: sorted.length, atLeast };
}

const H = 196;
const TOP = 40;
const BASE = H - 28;
// The plot runs as wide as the slider's handle travels above it (its 16px handle travels inside the track), so a
// point on the curve sits under the handle at the same value.
const INSET = 8;

/**
 * Under the Playground's tipping point: every Cyprus short-let's occupancy this season, as the share of them booked
 * at least each share of nights, in the product's own window. The tipping point is marked on it, and so is the
 * visitor's own figure from the slider above, which a press or a drag along the chart also sets (the chart and the
 * slider are one control; the slider is the one a keyboard and a screen reader use). The figures are the listings'
 * own (/api/dashboard/points, the same the first screen draws), so on demo data they are the demo listings'.
 * Nothing shows until they have arrived; the panel reads whole without it.
 */
export default function OccupancyCurve({
  at,
  tip,
  onPick,
  demo,
}: {
  at: number;
  tip: number;
  onPick: (value: number) => void;
  demo: boolean;
}) {
  const [curve, setCurve] = useState<Curve | null>(null);
  const [held, setHeld] = useState(false);
  // The drawing is laid out at the width it is shown at, so its 15px labels stay 15px on a phone.
  const [W, setW] = useState(640);
  const plot = useRef<SVGSVGElement>(null);
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    let live = true;
    listingPoints()
      .then((points) => {
        const values = points.map((p) => p.effOccTodate).filter((v): v is number => v != null && Number.isFinite(v));
        if (live && values.length > 0) setCurve(curveOf(values));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [curve]);

  const X = (value: number) => INSET + (value / 100) * (W - 2 * INSET);

  const path = useMemo(() => {
    if (!curve) return "";
    const x = (value: number) => INSET + (value / 100) * (W - 2 * INSET);
    return curve.atLeast.map((s, v) => `${v ? "L" : "M"}${x(v).toFixed(1)} ${Y(s).toFixed(1)}`).join("");
  }, [curve, W]);

  if (!curve) return null;

  // A tipping point over 100% cannot be reached: no listing is past it, and the panel says a tenant always wins.
  const reachable = tip <= 100;
  const pastTip = reachable ? curve.atLeast[Math.max(0, tip)] : 0;
  const reach = curve.atLeast[Math.max(0, Math.min(100, Math.round(at)))];
  const pct = (s: number) => `${Math.round(s * 100)}%`;
  // Where a press or a drag falls, as a whole per cent of nights.
  const valueAt = (clientX: number) => {
    const r = plot.current?.getBoundingClientRect();
    if (!r || r.width === 0) return at;
    const x = ((clientX - r.left) / r.width) * W;
    return Math.max(0, Math.min(100, Math.round(((x - INSET) / (W - 2 * INSET)) * 100)));
  };
  const readAt = at > 74 ? "end" : at < 26 ? "start" : "middle";

  return (
    <figure ref={box} className="pt-curve m-0" data-held={held ? "" : undefined}>
      <figcaption>
        <b>
          {reachable
            ? `${pct(pastTip)} of Cyprus short-\u2060lets are past the tipping point this season.`
            : "No Cyprus short-\u2060let can pass the tipping point: it is above every night of the year."}
        </b>{" "}
        <span>
          {pct(reach)} are booked {at}% or more. Press or drag along the line to try another figure.
        </span>
      </figcaption>
      <svg
        ref={plot}
        className="pt-curve-plot"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setHeld(true);
          onPick(valueAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (held) onPick(valueAt(e.clientX));
        }}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
      >
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <g key={s}>
            <path className="pt-curve-grid" d={`M${INSET} ${Y(s)}H${W - INSET}`} />
            <text className="pt-curve-tick" x={W - INSET} y={Y(s) - 6} textAnchor="end">
              {s * 100}%
            </text>
          </g>
        ))}
        <path className="pt-curve-base" d={`M${INSET} ${BASE}H${W - INSET}`} />
        <path className="pt-curve-fill" d={`${path}L${X(100)} ${BASE}L${X(0)} ${BASE}Z`} />
        <path className="pt-curve-line" d={path} />
        {reachable && (
          <g className="pt-curve-tip">
            <path d={`M${X(tip)} ${TOP - 8}V${BASE}`} />
            <circle cx={X(tip)} cy={Y(pastTip)} r="5" />
            {/* The label sits right of the line, or left of it where the plot runs out of room. */}
            <text x={X(tip) > W - 150 ? X(tip) - 10 : X(tip) + 10} y={Y(pastTip) - 10} textAnchor={X(tip) > W - 150 ? "end" : "start"}>
              Tipping point
            </text>
          </g>
        )}
        <g className="pt-curve-you">
          <path d={`M${X(at)} ${Y(reach)}V${BASE}`} />
          <circle cx={X(at)} cy={Y(reach)} r="6" />
          <text x={X(at) + (readAt === "end" ? -10 : readAt === "start" ? 10 : 0)} y={TOP - 14} textAnchor={readAt}>
            Yours, {at}%
          </text>
        </g>
        {(W < 420 ? [0, 50, 100] : [0, 25, 50, 75, 100]).map((t) => (
          <text key={t} className="pt-curve-tick" x={X(t)} y={H - 6} textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"}>
            {t}%
          </text>
        ))}
      </svg>
      <p className="pt-curve-note">
        Each of the {curve.n.toLocaleString("en-GB")} short-&#8288;lets seen this season, by the share of its nights booked so far
        {demo ? " (demo data)" : ""}.
      </p>
    </figure>
  );
}

function Y(share: number) {
  return BASE - share * (BASE - TOP);
}
