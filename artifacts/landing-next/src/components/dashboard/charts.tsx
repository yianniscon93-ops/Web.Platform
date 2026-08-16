"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { UI } from "./tokens";

/** Shared SVG charts for the dashboard — data-green on dark glass. */

const W = 320;

interface TipLine {
  label?: string;
  value: string;
  color?: string;
}

/** Hover tooltip shared by every chart — anchored at a % of the chart width. */
function ChartTip({ xPct, title, lines }: { xPct: number; title: string; lines: TipLine[] }) {
  const x = Math.min(86, Math.max(14, xPct));
  return (
    <div
      className="absolute z-20 pointer-events-none rounded-lg px-2.5 py-1.5 whitespace-nowrap"
      style={{
        left: `${x}%`,
        top: -4,
        transform: "translate(-50%, -100%)",
        background: "rgba(12,16,10,0.96)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
      }}
    >
      <p className="text-[13px] font-semibold" style={{ color: UI.text }}>
        {title}
      </p>
      {lines.map((l, i) => (
        <p key={i} className="text-[13px] flex items-center gap-1.5" style={{ color: UI.muted }}>
          {l.color && (
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: l.color }} />
          )}
          {l.label}
          <span className="font-semibold" style={{ color: l.color ?? UI.text }}>
            {l.value}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Map a mouse position to the nearest index of an n-point series drawn in the padded viewBox. */
function hoverIndex(e: MouseEvent<HTMLDivElement>, n: number, pad: number): number {
  const rect = e.currentTarget.getBoundingClientRect();
  const fx = ((e.clientX - rect.left) / rect.width) * W;
  const g = (fx - pad) / (W - pad * 2);
  return Math.max(0, Math.min(n - 1, Math.round(g * (n - 1))));
}

export function LineAreaChart({
  data,
  yFmt = (v) => v.toFixed(1),
  xFmt = (x) => x,
  height = 96,
  emptyLabel = "Not enough data yet",
}: {
  data: Array<{ x: string; y: number | null }>;
  yFmt?: (v: number) => string;
  xFmt?: (x: string) => string;
  height?: number;
  emptyLabel?: string;
}) {
  const series = data.filter((p): p is { x: string; y: number } => p.y != null);
  const [hover, setHover] = useState<number | null>(null);

  if (series.length < 2) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }

  const H = height;
  const PAD = 6;
  const vals = series.map((p) => p.y);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = Math.max(1, max - min);
  const floor = min - span * 0.15;
  const ceil = max + span * 0.08;

  const xs = (i: number) => PAD + (i / (series.length - 1)) * (W - PAD * 2);
  const ys = (v: number) => H - 4 - ((v - floor) / (ceil - floor)) * (H - 14);
  const line = series.map((p, i) => `${xs(i)},${ys(p.y)}`).join(" ");
  const areaPts = `${xs(0)},${H} ${line} ${xs(series.length - 1)},${H}`;
  const last = series[series.length - 1];
  const peak = series.reduce((a, b) => (b.y > a.y ? b : a));
  const gradId = `lac-${Math.round(max * 7 + min * 3 + series.length)}`;

  return (
    <div>
      <div
        className="relative"
        onMouseMove={(e) => setHover(hoverIndex(e, series.length, PAD))}
        onMouseLeave={() => setHover(null)}
      >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ display: "block", height }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={UI.green} stopOpacity="0.24" />
            <stop offset="100%" stopColor={UI.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.28, 0.55, 0.82].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H * f}
            y2={H * f}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        <polygon points={areaPts} fill={`url(#${gradId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={UI.green}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {hover != null && series[hover] && (
          <line
            x1={xs(hover)}
            x2={xs(hover)}
            y1={2}
            y2={H - 2}
            stroke="rgba(234,240,223,0.3)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <circle
          cx={xs(hover ?? series.length - 1)}
          cy={ys(series[hover ?? series.length - 1].y)}
          r={3}
          fill={UI.green}
          stroke={UI.bg}
          strokeWidth={1.5}
        />
      </svg>
      {hover != null && series[hover] && (
        <ChartTip
          xPct={(xs(hover) / W) * 100}
          title={xFmt(series[hover].x)}
          lines={[{ value: yFmt(series[hover].y) }]}
        />
      )}
      </div>
      <div className="flex justify-between items-baseline mt-1.5">
        <span className="text-[13px]" style={{ color: UI.faint }}>
          {xFmt(series[0].x)}
        </span>
        <span className="text-[13px] font-semibold" style={{ color: UI.text }}>
          latest <span style={{ color: UI.green }}>{yFmt(last.y)}</span>
          <span className="font-normal" style={{ color: UI.faint }}>
            {" "}
            · peak {yFmt(peak.y)}
          </span>
        </span>
        <span className="text-[13px]" style={{ color: UI.faint }}>
          {xFmt(last.x)}
        </span>
      </div>
    </div>
  );
}

export interface TrendSeries {
  label: string;
  color: string;
  /** true → default benchmark dash; a string is used as the SVG dash pattern
   * directly (comparison slots carry their own pattern as a non-colour cue). */
  dashed?: boolean | string;
  data: Array<{ x: string; y: number | null }>;
}

const seriesDash = (d: boolean | string | undefined): string | undefined =>
  typeof d === "string" ? d : d ? "4 3" : undefined;

/** Calendar event drawn over a date-domain chart (see lib/dashboard/events). */
export interface ChartEvent {
  name: string;
  kind: "holiday" | "festival" | "school" | "season";
  start: string; // ISO date, inclusive
  end?: string;
  where?: string;
}

const EVENT_DOT: Record<ChartEvent["kind"], string> = {
  holiday: "#8FCC80",
  festival: "#C9B891",
  school: "#C9B891",
  season: "rgba(234,240,223,0.55)",
};
const EVENT_EMOJI: Record<ChartEvent["kind"], string> = {
  holiday: "🕊️",
  festival: "🎉",
  school: "🏫",
  season: "✈️",
};

/** Tooltip line for an event. */
export const eventTipLine = (e: ChartEvent): TipLine => ({
  value: `${EVENT_EMOJI[e.kind]} ${e.name}${e.where ? ` · ${e.where}` : ""}`,
  color: EVENT_DOT[e.kind],
});

const dayMs = 86400000;
const isoMs = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();

/**
 * Weekly trend with the contract's realized / "on the books" split: weeks
 * from `splitX` onward sit in a shaded forward region. Optional thin
 * benchmark lines share the x-axis (same week range).
 */
export function TrendChart({
  main,
  benchmarks = [],
  splitX,
  yFmt = (v) => v.toFixed(1),
  xFmt = (x) => x,
  height = 120,
  emptyLabel = "Not enough data yet",
  events = [],
  equalWeight = false,
}: {
  main: TrendSeries;
  benchmarks?: TrendSeries[];
  /** First week that is NOT realized (current Cyprus week). */
  splitX: string;
  yFmt?: (v: number) => string;
  xFmt?: (x: string) => string;
  height?: number;
  emptyLabel?: string;
  /** Calendar events — only meaningful when x values are ISO dates. Point
   * events render as dots along the top; school ranges as shaded bands. */
  events?: ChartEvent[];
  /** Comparison mode: all series are peers — same stroke weight, full
   * opacity, no area fill under the first series. */
  equalWeight?: boolean;
}) {
  const xs$ = main.data.map((p) => p.x);
  const all = [main, ...benchmarks];
  const vals = all.flatMap((s) => s.data.map((p) => p.y)).filter((v): v is number => v != null);
  const [hover, setHover] = useState<number | null>(null);

  if (xs$.length < 2 || vals.length < 2) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }

  const H = height;
  const PAD = 6;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = Math.max(1, max - min);
  const floor = min - span * 0.15;
  const ceil = max + span * 0.1;
  const xi = new Map(xs$.map((x, i) => [x, i]));
  const xs = (i: number) => PAD + (i / (xs$.length - 1)) * (W - PAD * 2);
  const ys = (v: number) => H - 4 - ((v - floor) / (ceil - floor)) * (H - 16);

  const linePts = (s: TrendSeries) =>
    s.data
      .filter((p): p is { x: string; y: number } => p.y != null && xi.has(p.x))
      .map((p) => `${xs(xi.get(p.x)!)},${ys(p.y)}`)
      .join(" ");

  // Forward ("on the books") region starts at the first week >= splitX.
  const splitIdx = xs$.findIndex((x) => x >= splitX);
  const splitPx = splitIdx >= 0 ? xs(splitIdx) : null;

  // Event overlay — maps ISO-dated events onto the x domain. On charts whose
  // x values aren't dates every comparison is NaN-false, so nothing renders.
  const ts = xs$.map(isoMs);
  const domainA = ts[0];
  const domainB = ts[ts.length - 1];
  const stepMs = ts.length > 1 ? (domainB - domainA) / (ts.length - 1) : dayMs;
  const timePx = (time: number) =>
    PAD + ((time - domainA) / Math.max(1, domainB - domainA)) * (W - PAD * 2);
  const eventMarks = new Map<number, ChartEvent[]>();
  for (const e of events) {
    if (e.kind === "school") continue;
    const mid = (isoMs(e.start) + isoMs(e.end ?? e.start)) / 2;
    let best = -1;
    let bestD = Infinity;
    ts.forEach((t, i) => {
      const d = Math.abs(t - mid);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0 && bestD <= stepMs) eventMarks.set(best, [...(eventMarks.get(best) ?? []), e]);
  }
  const eventBands = events
    .filter((e) => e.kind === "school" && e.end != null)
    .map((e) => {
      const a = Math.max(isoMs(e.start), domainA);
      const b = Math.min(isoMs(e.end!), domainB);
      return a <= b ? { e, x1: timePx(a), x2: timePx(b) } : null;
    })
    .filter((v): v is { e: ChartEvent; x1: number; x2: number } => v != null);

  const mainSeries = main.data.filter((p): p is { x: string; y: number } => p.y != null);
  const last = mainSeries[mainSeries.length - 1];
  const gradId = `tc-${Math.round(max * 7 + min * 3 + xs$.length)}`;

  const hoverX = hover != null ? xs$[hover] : null;
  const atX = (s: TrendSeries) =>
    hoverX != null ? (s.data.find((p) => p.x === hoverX)?.y ?? null) : null;
  const hoverEvents: ChartEvent[] =
    hover != null
      ? [
          ...(eventMarks.get(hover) ?? []),
          ...eventBands
            .filter(({ e }) => isoMs(e.start) <= ts[hover] && ts[hover] <= isoMs(e.end!))
            .map(({ e }) => e),
        ]
      : [];
  const hoverLines: TipLine[] =
    hoverX != null
      ? [
          ...all
            .map((s) => ({ s, v: atX(s) }))
            .filter((e): e is { s: TrendSeries; v: number } => e.v != null)
            .map(({ s, v }) => ({
              label: all.length > 1 ? s.label : undefined,
              value: yFmt(v),
              color: s.color,
            })),
          ...hoverEvents.map(eventTipLine),
        ]
      : [];

  return (
    <div>
      <div
        className="relative"
        onMouseMove={(e) => setHover(hoverIndex(e, xs$.length, PAD))}
        onMouseLeave={() => setHover(null)}
      >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ display: "block", height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={main.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={main.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {eventBands.map(({ e, x1, x2 }) => (
          <rect
            key={`band-${e.name}`}
            x={x1}
            y={0}
            width={Math.max(1, x2 - x1)}
            height={H}
            fill="rgba(201,184,145,0.06)"
          />
        ))}
        {splitPx != null && (
          <>
            <rect x={splitPx} y={0} width={W - PAD - splitPx} height={H} fill="rgba(255,255,255,0.045)" />
            <line x1={splitPx} x2={splitPx} y1={2} y2={H - 2} stroke="rgba(234,240,223,0.35)" strokeWidth={1} strokeDasharray="3 3" />
          </>
        )}
        {[0.28, 0.55, 0.82].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {!equalWeight && mainSeries.length >= 2 && (
          <polygon
            points={`${xs(xi.get(mainSeries[0].x)!)},${H} ${linePts(main)} ${xs(xi.get(last.x)!)},${H}`}
            fill={`url(#${gradId})`}
          />
        )}
        {benchmarks.map((b) => (
          <polyline
            key={b.label}
            points={linePts(b)}
            fill="none"
            stroke={b.color}
            strokeWidth={equalWeight ? 2.2 : 1.3}
            strokeDasharray={seriesDash(b.dashed)}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={equalWeight ? 1 : 0.8}
          />
        ))}
        <polyline
          points={linePts(main)}
          fill="none"
          stroke={main.color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {last && <circle cx={xs(xi.get(last.x)!)} cy={ys(last.y)} r={3} fill={main.color} stroke={UI.bg} strokeWidth={1.5} />}
        {[...eventMarks.entries()].map(([i, evs]) => (
          <circle
            key={`ev-${i}`}
            cx={xs(i)}
            cy={7}
            r={2.6}
            fill={EVENT_DOT[evs[0].kind]}
            stroke={UI.bg}
            strokeWidth={1}
            opacity={0.9}
          />
        ))}
        {hover != null && (
          <line
            x1={xs(hover)}
            x2={xs(hover)}
            y1={2}
            y2={H - 2}
            stroke="rgba(234,240,223,0.3)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {hoverX != null &&
          all.map((s) => {
            const v = atX(s);
            return v != null ? (
              <circle key={s.label} cx={xs(hover!)} cy={ys(v)} r={3} fill={s.color} stroke={UI.bg} strokeWidth={1.5} />
            ) : null;
          })}
      </svg>
      {hoverX != null && hoverLines.length > 0 && (
        <ChartTip
          xPct={(xs(hover!) / W) * 100}
          title={`${xFmt(hoverX)}${splitIdx >= 0 && hover! >= splitIdx ? " · on the books" : ""}`}
          lines={hoverLines}
        />
      )}
      </div>
      <div className="flex justify-between items-baseline mt-1.5">
        <span className="text-[13px]" style={{ color: UI.faint }}>
          {xFmt(xs$[0])}
        </span>
        {splitPx != null ? (
          <span className="text-[13px] font-medium" style={{ color: UI.muted }}>
            ← realized · on the books →
          </span>
        ) : (
          last && (
            <span className="text-[13px] font-semibold" style={{ color: UI.text }}>
              latest <span style={{ color: main.color }}>{yFmt(last.y)}</span>
            </span>
          )
        )}
        <span className="text-[13px]" style={{ color: UI.faint }}>
          {xFmt(xs$[xs$.length - 1])}
        </span>
      </div>
      {benchmarks.length > 0 && (
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
            <span className="w-3 h-[2.5px] rounded-full inline-block" style={{ background: main.color }} />
            {main.label}
          </span>
          {benchmarks.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
              <span
                className="w-3 h-[2px] rounded-full inline-block"
                style={{ background: b.color, opacity: 0.85 }}
              />
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Diverging weekly bars around a zero line — e.g. selection occupancy
 * minus benchmark. Positive = above the market, negative = below.
 */
export function GapBars({
  data,
  yFmt = (v) => v.toFixed(1),
  height = 110,
  labelEvery = 4,
  emptyLabel = "Not enough data yet",
}: {
  /** events: pre-resolved calendar events for that bar's period (tooltip + dot). */
  data: Array<{ label: string; value: number | null; events?: ChartEvent[] }>;
  yFmt?: (v: number) => string;
  height?: number;
  labelEvery?: number;
  emptyLabel?: string;
}) {
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  const [hover, setHover] = useState<number | null>(null);
  if (vals.length < 2) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }
  const maxAbs = Math.max(...vals.map(Math.abs), 0.1);
  const half = height / 2;
  const hv = hover != null ? data[hover] : null;
  return (
    <div>
      <div
        className="relative flex items-stretch gap-[3px]"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: half - 0.5, height: 1, background: "rgba(234,240,223,0.25)" }}
        />
        {data.map((d, i) => {
          const v = d.value;
          const h = v == null ? 0 : (Math.abs(v) / maxAbs) * (half - 4);
          const up = (v ?? 0) >= 0;
          return (
            <div key={`${d.label}-${i}`} className="flex-1 relative" onMouseEnter={() => setHover(i)}>
              {d.events && d.events.length > 0 && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 rounded-full"
                  style={{ top: 1, width: 5, height: 5, background: EVENT_DOT[d.events[0].kind], opacity: 0.9 }}
                />
              )}
              {v != null && (
                <div
                  className="absolute left-0 right-0 rounded-[2px]"
                  style={{
                    height: Math.max(2, h),
                    ...(up ? { bottom: half } : { top: half }),
                    background: up
                      ? "linear-gradient(180deg, #8FCC80, rgba(143,204,128,0.5))"
                      : "linear-gradient(180deg, rgba(217,139,106,0.5), #D98B6A)",
                    filter: hover === i ? "brightness(1.25)" : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
        {hv && hv.value != null && (
          <ChartTip
            xPct={((hover! + 0.5) / data.length) * 100}
            title={hv.label}
            lines={[
              {
                value: `${hv.value >= 0 ? "+" : ""}${yFmt(hv.value)}`,
                color: hv.value >= 0 ? UI.green : "#D98B6A",
              },
              ...(hv.events ?? []).map(eventTipLine),
            ]}
          />
        )}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className="flex-1 text-center text-[12px] truncate" style={{ color: UI.faint }}>
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface StackSegment {
  key: string;
  label: string;
  color: string;
}

/** 100%-stacked columns — e.g. stay-length mix per month. */
export function StackedBars({
  data,
  segments,
  height = 110,
  emptyLabel = "Not enough data yet",
}: {
  /** values are shares that already sum to ~100 per row. */
  data: Array<{ label: string; values: Record<string, number> }>;
  segments: StackSegment[];
  height?: number;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }
  return (
    <div>
      <div className="relative flex items-end gap-[5px]" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const total = segments.reduce((s, seg) => s + (d.values[seg.key] ?? 0), 0) || 1;
          return (
            <div
              key={d.label}
              className="flex-1 h-full flex flex-col-reverse rounded-[3px] overflow-hidden"
              style={{ filter: hover === i ? "brightness(1.2)" : undefined }}
              onMouseEnter={() => setHover(i)}
            >
              {segments.map((seg) => (
                <div
                  key={seg.key}
                  style={{
                    height: `${(100 * (d.values[seg.key] ?? 0)) / total}%`,
                    background: seg.color,
                  }}
                />
              ))}
            </div>
          );
        })}
        {hover != null && data[hover] && (
          <ChartTip
            xPct={((hover + 0.5) / data.length) * 100}
            title={data[hover].label}
            lines={segments.map((seg) => ({
              label: seg.label,
              value: `${(data[hover].values[seg.key] ?? 0).toFixed(0)}%`,
              color: seg.color,
            }))}
          />
        )}
      </div>
      <div className="flex gap-[5px] mt-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[12px] truncate" style={{ color: UI.faint }}>
            {d.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {segments.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
            <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: seg.color }} />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarsChart({
  data,
  yFmt = (v) => String(v),
  height = 96,
  highlightMax = false,
  labelEvery = 1,
  showValues = false,
  emptyLabel = "Not enough data yet",
  line,
  color,
}: {
  data: Array<{ label: string; value: number | null }>;
  yFmt?: (v: number) => string;
  height?: number;
  highlightMax?: boolean;
  /** Show every Nth x-label (sparse labels for dense histograms). */
  labelEvery?: number;
  /** Print each bar's value above it — only for charts with ~12 bars or fewer. */
  showValues?: boolean;
  emptyLabel?: string;
  /** Optional overlay line on its own scale — one value per bar (e.g. occupancy over RevPAR bars). */
  line?: {
    label: string;
    values: Array<number | null>;
    fmt: (v: number) => string;
    color?: string;
    /** Legend label for the bars themselves (legend only renders with a line). */
    barsLabel?: string;
  };
  /** Tint all bars with one series colour (comparison small multiples). */
  color?: string;
}) {
  const vals = data.map((d) => d.value ?? 0);
  const max = Math.max(...vals, 0);
  const [hover, setHover] = useState<number | null>(null);

  if (!data.length || max === 0) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }

  // With values on, bars top out below 100% so the label row always fits.
  const cap = showValues ? 82 : 100;

  // Overlay line on its own 0→max scale, kept inside the top ~70% band so it
  // doesn't collide with bar value labels at the base.
  const lineColor = line?.color ?? "#C9B891";
  const lineVals = line?.values ?? [];
  const lineMax = Math.max(...lineVals.filter((v): v is number => v != null), 1);
  const linePts = line
    ? data
        .map((_, i) => {
          const v = lineVals[i];
          if (v == null) return null;
          const x = ((i + 0.5) / data.length) * 100;
          const y = 12 + (1 - v / lineMax) * 55;
          return `${x},${y}`;
        })
        .filter((p): p is string => p != null)
        .join(" ")
    : "";

  return (
    <div>
      <div className="relative flex items-end gap-[3px]" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const v = d.value ?? 0;
          const isMax = highlightMax && v === max;
          const pct = Math.max(2, (cap * v) / max);
          const bar = (
            <div
              className="rounded-t-[3px] transition-colors"
              style={{
                height: `${pct}%`,
                background: color
                  ? isMax
                    ? color
                    : `linear-gradient(180deg, ${color}C0, ${color}60)`
                  : isMax
                    ? UI.green
                    : "linear-gradient(180deg, rgba(143,204,128,0.75), rgba(74,94,58,0.55))",
                filter: hover === i ? "brightness(1.25)" : undefined,
              }}
            />
          );
          return (
            <div
              key={`${d.label}-${i}`}
              className="flex-1 relative h-full flex flex-col justify-end"
              onMouseEnter={() => setHover(i)}
            >
              {showValues && d.value != null && (
                <span
                  className="absolute left-0 right-0 text-center text-[12px] font-medium whitespace-nowrap"
                  style={{
                    bottom: `calc(${pct}% + 3px)`,
                    color: isMax ? (color ?? UI.green) : UI.muted,
                    fontWeight: isMax ? 600 : 500,
                  }}
                >
                  {yFmt(v)}
                </span>
              )}
              {bar}
            </div>
          );
        })}
        {line && linePts && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <polyline
              points={linePts}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              opacity={0.9}
            />
          </svg>
        )}
        {hover != null && data[hover]?.value != null && (
          <ChartTip
            xPct={((hover + 0.5) / data.length) * 100}
            title={data[hover].label}
            lines={[
              { value: yFmt(data[hover].value!) },
              ...(line && lineVals[hover] != null
                ? [{ label: line.label, value: line.fmt(lineVals[hover]!), color: lineColor }]
                : []),
            ]}
          />
        )}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {data.map((d, i) => (
          <span
            key={`${d.label}-${i}`}
            className="flex-1 text-center text-[12px] truncate"
            style={{ color: UI.faint }}
          >
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      {line && (
        <div className="flex items-center gap-3 mt-1.5">
          {line.barsLabel && (
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
              <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: "rgba(143,204,128,0.7)" }} />
              {line.barsLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
            <span className="w-3 h-[2px] rounded-full inline-block" style={{ background: lineColor }} />
            {line.label}
          </span>
        </div>
      )}
    </div>
  );
}

export interface GroupedSeries {
  label: string;
  color: string;
}

/**
 * Grouped columns — one cluster per category, one bar per comparison slot.
 * Bars keep a 2px surface gap inside the cluster; the legend names every
 * series so identity is never colour-alone.
 */
export function GroupedBars({
  data,
  series,
  yFmt = (v) => String(v),
  height = 110,
  labelEvery = 1,
  emptyLabel = "Not enough data yet",
}: {
  /** values[i] belongs to series[i]; null renders as a missing bar. */
  data: Array<{ label: string; values: Array<number | null> }>;
  series: GroupedSeries[];
  yFmt?: (v: number) => string;
  height?: number;
  labelEvery?: number;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const all = data.flatMap((d) => d.values).filter((v): v is number => v != null);
  const max = Math.max(...all, 0);

  if (!data.length || max === 0) {
    return (
      <div
        className="h-24 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex items-end gap-[7px]" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            className="flex-1 h-full flex items-end gap-[2px]"
            onMouseEnter={() => setHover(i)}
            style={{ filter: hover === i ? "brightness(1.2)" : undefined }}
          >
            {d.values.map((v, si) => (
              <div key={si} className="flex-1 h-full flex flex-col justify-end">
                {v != null && (
                  <div
                    className="rounded-t-[3px]"
                    style={{
                      height: `${Math.max(2, (100 * v) / max)}%`,
                      background: `linear-gradient(180deg, ${series[si]?.color ?? UI.green}E6, ${series[si]?.color ?? UI.green}80)`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        {hover != null && data[hover] && (
          <ChartTip
            xPct={((hover + 0.5) / data.length) * 100}
            title={data[hover].label}
            lines={series
              .map((s, si) => ({ s, v: data[hover].values[si] }))
              .filter((e): e is { s: GroupedSeries; v: number } => e.v != null)
              .map(({ s, v }) => ({ label: s.label, value: yFmt(v), color: s.color }))}
          />
        )}
      </div>
      <div className="flex gap-[7px] mt-1.5">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className="flex-1 text-center text-[12px] truncate" style={{ color: UI.faint }}>
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[13px]" style={{ color: UI.muted }}>
            <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const NEG = "#D98B6A";

export interface QuadPoint {
  key: string;
  label: string;
  /** horizontal value (e.g. occupancy lift, pp) */
  x: number;
  /** vertical value (e.g. price lift, %) */
  y: number;
  /** magnitude for the bubble area (e.g. revenue €); sign only affects colour via `tone`. */
  size: number;
  tone?: "pos" | "neg";
  thin?: boolean;
  /** true → keep a permanent label; false → label only on hover */
  labeled?: boolean;
  tip: Array<{ label?: string; value: string; color?: string }>;
}

/**
 * Bubble "impact map": two quantitative axes + bubble area for a third measure.
 * Quadrant tints & corner labels give position meaning at a glance; labelled
 * points get a dodged, leader-lined caption so nothing collides; the rest are
 * dots that reveal detail on hover.
 */
export function ImpactQuadrant({
  points,
  xLabel,
  yLabel,
  xFmt = (v) => `${v > 0 ? "+" : ""}${v}`,
  yFmt = (v) => `${v > 0 ? "+" : ""}${v}%`,
  corners,
  height = 380,
  emptyLabel = "Not enough data yet",
}: {
  points: QuadPoint[];
  xLabel: string;
  yLabel: string;
  xFmt?: (v: number) => string;
  yFmt?: (v: number) => string;
  /** faint corner guides: [topLeft, topRight, bottomRight] */
  corners?: { tl?: string; tr?: string; br?: string };
  height?: number;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(720);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setCw(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [points.length]);

  if (points.length === 0) {
    return (
      <div
        className="h-40 flex items-center justify-center rounded-xl text-sm"
        style={{ background: "rgba(255,255,255,0.04)", color: UI.faint }}
      >
        {emptyLabel}
      </div>
    );
  }

  // Match the viewBox to the rendered width so 1 SVG unit ≈ 1px — keeps text
  // and bubbles at their true size instead of magnifying on wide cards.
  const VB = Math.max(560, Math.round(cw));
  const H = height;
  const ml = 54, mr = 96, mt = 30, mb = 48;
  const xsv = points.map((p) => p.x);
  const ysv = points.map((p) => p.y);
  const xMin = Math.min(0, ...xsv) - 1.5;
  const xMax = Math.max(0, ...xsv) + 1.5;
  const yMin = Math.min(0, ...ysv) - 3;
  const yMax = Math.max(...ysv) + 6;
  const px = (v: number) => ml + ((v - xMin) / (xMax - xMin)) * (VB - ml - mr);
  const py = (v: number) => H - mb - ((v - yMin) / (yMax - yMin)) * (H - mt - mb);
  const maxSize = Math.max(...points.map((p) => Math.abs(p.size)), 1);
  const rad = (v: number) => 9 + (Math.abs(v) / maxSize) * 17;

  // nice-ish ticks
  const xTicks: number[] = [];
  for (let t = Math.ceil(xMin / 2) * 2; t <= xMax; t += 2) xTicks.push(t);
  const yStep = yMax - yMin > 40 ? 15 : 10;
  const yTicks: number[] = [];
  for (let t = Math.max(0, Math.ceil(yMin / yStep) * yStep); t <= yMax; t += yStep) yTicks.push(t);

  const zx = px(0);

  const placed = points.map((p) => ({ p, cx: px(p.x), cy: py(p.y), r: rad(p.size) }));

  // Collision-aware label placement: for each labelled bubble try right, below,
  // above, then left; pick the first candidate that clears every other bubble
  // and every already-placed label. Falls back to pushing down on the right.
  type Box = { x1: number; y1: number; x2: number; y2: number };
  const boxOverlap = (a: Box, b: Box) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  const circleHitsBox = (c: { cx: number; cy: number; r: number }, b: Box) => {
    const nx = Math.max(b.x1, Math.min(c.cx, b.x2));
    const ny = Math.max(b.y1, Math.min(c.cy, b.y2));
    const dx = c.cx - nx, dy = c.cy - ny;
    return dx * dx + dy * dy < (c.r * 0.92) * (c.r * 0.92);
  };
  const estW = (s: string) => s.length * 6.3 + 8;
  const placedBoxes: Box[] = [];
  const labels: Array<{ p: QuadPoint; cx: number; cy: number; r: number; lx: number; ly: number; anchor: "start" | "middle" | "end"; lead: boolean }> = [];
  // Place the biggest (most important) bubbles' labels first.
  const toLabel = placed.filter((it) => it.p.labeled).sort((a, b) => b.r - a.r);
  for (const it of toLabel) {
    const txt = it.p.label + (it.p.thin ? " ⚠" : "");
    const w = estW(txt);
    const cands: Array<{ lx: number; ly: number; anchor: "start" | "middle" | "end"; box: Box }> = [
      { lx: it.cx + it.r + 6, ly: it.cy, anchor: "start", box: { x1: it.cx + it.r + 6, y1: it.cy - 8, x2: it.cx + it.r + 6 + w, y2: it.cy + 8 } },
      { lx: it.cx, ly: it.cy + it.r + 14, anchor: "middle", box: { x1: it.cx - w / 2, y1: it.cy + it.r + 6, x2: it.cx + w / 2, y2: it.cy + it.r + 20 } },
      { lx: it.cx, ly: it.cy - it.r - 9, anchor: "middle", box: { x1: it.cx - w / 2, y1: it.cy - it.r - 20, x2: it.cx + w / 2, y2: it.cy - it.r - 6 } },
      { lx: it.cx - it.r - 6, ly: it.cy, anchor: "end", box: { x1: it.cx - it.r - 6 - w, y1: it.cy - 8, x2: it.cx - it.r - 6, y2: it.cy + 8 } },
    ];
    let chosen = cands.find(
      (c) => c.box.x1 >= ml - 2 && c.box.x2 <= VB - 3 &&
        !placedBoxes.some((b) => boxOverlap(c.box, b)) &&
        !placed.some((o) => o.p.key !== it.p.key && circleHitsBox(o, c.box))
    );
    if (!chosen) {
      let ly = it.cy;
      for (let k = 0; k < 40; k++) {
        const box: Box = { x1: it.cx + it.r + 6, y1: ly - 8, x2: it.cx + it.r + 6 + w, y2: ly + 8 };
        if (box.x2 <= VB - 3 && !placedBoxes.some((b) => boxOverlap(box, b))) { chosen = { lx: box.x1, ly, anchor: "start", box }; break; }
        ly += 15;
      }
    }
    if (!chosen) {
      const box: Box = { x1: it.cx + it.r + 6, y1: it.cy - 8, x2: it.cx + it.r + 6 + w, y2: it.cy + 8 };
      chosen = { lx: box.x1, ly: it.cy, anchor: "start", box };
    }
    placedBoxes.push(chosen.box);
    labels.push({ ...it, lx: chosen.lx, ly: chosen.ly, anchor: chosen.anchor, lead: Math.hypot(chosen.lx - it.cx, chosen.ly - it.cy) > it.r + 12 });
  }

  const hp = hover ? placed.find((it) => it.p.key === hover) : null;

  return (
    <div ref={wrapRef} className="relative">
      <div className="overflow-x-auto ps-scroll">
        <svg
          viewBox={`0 0 ${VB} ${H}`}
          style={{ width: "100%", minWidth: 560, height: "auto", display: "block" }}
        >
          {/* quadrant tints */}
          <rect x={zx} y={mt} width={VB - mr - zx} height={H - mt - mb} fill="rgba(143,204,128,0.05)" />
          <rect x={ml} y={mt} width={zx - ml} height={H - mt - mb} fill="rgba(217,139,106,0.05)" />
          {/* gridlines + ticks */}
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={px(t)} x2={px(t)} y1={mt} y2={H - mb} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={px(t)} y={H - mb + 16} fill={UI.faint} fontSize={10.5} textAnchor="middle">{xFmt(t)}</text>
            </g>
          ))}
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={ml} x2={VB - mr} y1={py(t)} y2={py(t)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={ml - 8} y={py(t) + 3.5} fill={UI.faint} fontSize={10.5} textAnchor="end">{yFmt(t)}</text>
            </g>
          ))}
          {/* zero occupancy divider */}
          <line x1={zx} x2={zx} y1={mt} y2={H - mb} stroke="rgba(234,240,223,0.28)" strokeWidth={1} strokeDasharray="4 3" />
          {/* axis labels */}
          <text x={(ml + VB - mr) / 2} y={H - 6} fill={UI.muted} fontSize={11.5} fontWeight={600} textAnchor="middle">{xLabel}</text>
          <text
            x={15} y={(mt + H - mb) / 2} fill={UI.muted} fontSize={11.5} fontWeight={600}
            textAnchor="middle" transform={`rotate(-90 15 ${(mt + H - mb) / 2})`}
          >{yLabel}</text>
          {/* corner guides */}
          {corners?.tl && <text x={px(xMin) + 10} y={mt + 14} fill={NEG} fontSize={10.5} fontWeight={700} opacity={0.62} letterSpacing=".04em">{corners.tl}</text>}
          {corners?.tr && <text x={VB - mr - 6} y={mt + 14} fill={UI.green} fontSize={10.5} fontWeight={700} opacity={0.62} letterSpacing=".04em" textAnchor="end">{corners.tr}</text>}
          {corners?.br && <text x={VB - mr - 6} y={H - mb - 8} fill={UI.oliveLight} fontSize={10.5} fontWeight={700} opacity={0.62} letterSpacing=".04em" textAnchor="end">{corners.br}</text>}
          {/* leader lines for displaced labels (drawn under the bubbles) */}
          {labels.map((l) => (
            l.lead ? (
              <line key={`ld-${l.p.key}`} x1={l.cx} y1={l.cy} x2={l.lx} y2={l.ly} stroke="rgba(234,240,223,0.20)" strokeWidth={1} />
            ) : null
          ))}
          {/* bubbles */}
          {placed.map(({ p, cx, cy, r }) => {
            const col = (p.tone ?? (p.x >= 0 ? "pos" : "neg")) === "neg" ? NEG : UI.green;
            const active = hover === p.key;
            const dim = hover !== null && !active;
            return (
              <g key={p.key} style={{ cursor: "pointer" }} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)}>
                {active && (
                  <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={col} strokeOpacity={0.4} strokeWidth={1.5} />
                )}
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={col} fillOpacity={p.thin ? 0.14 : active ? 0.5 : dim ? 0.16 : 0.34}
                  stroke={col} strokeOpacity={dim ? 0.45 : 1} strokeWidth={p.thin ? 1.2 : 2}
                  strokeDasharray={p.thin ? "3 3" : undefined}
                  style={{ transition: "fill-opacity .12s, stroke-opacity .12s" }}
                />
                <circle cx={cx} cy={cy} r={3} fill={col} fillOpacity={dim ? 0.45 : 1} />
              </g>
            );
          })}
          {/* labels */}
          {labels.map((l) => (
            <text
              key={`lb-${l.p.key}`} x={l.lx} y={l.ly + 3.5} textAnchor={l.anchor}
              fontSize={12} fontWeight={600} fill={l.p.thin ? UI.faint : UI.text}
            >
              {l.p.label}{l.p.thin ? " ⚠" : ""}
            </text>
          ))}
        </svg>
      </div>

      {/* floating tooltip — pops over the chart, anchored to the hovered bubble */}
      {hp && (() => {
        const leftPct = Math.min(88, Math.max(12, (hp.cx / VB) * 100));
        const topPct = (hp.cy / H) * 100;
        const above = hp.cy > 120;
        return (
          <div
            className="absolute z-30 pointer-events-none flex flex-col rounded-lg px-3 py-2 whitespace-nowrap"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(-50%, ${above ? `calc(-100% - ${hp.r + 8}px)` : `${hp.r + 8}px`})`,
              background: "rgba(12,16,10,0.96)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-[13px] font-semibold" style={{ color: UI.text }}>
              {hp.p.label}{hp.p.thin ? " · thin sample" : ""}
            </span>
            {hp.p.tip.map((l, i) => (
              <span key={i} className="text-[13px] flex items-center justify-between gap-6" style={{ color: UI.muted }}>
                <span>{l.label}</span>
                <span className="font-semibold" style={{ color: l.color ?? UI.text }}>{l.value}</span>
              </span>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
