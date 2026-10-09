"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { PointRow } from "@/lib/dashboard/types";
import { COUNTING, countChip, countLine } from "@/lib/landing/areaLines";
import { VIEW_H, VIEW_W, project, unproject, viewOf } from "@/lib/landing/areaView";
import { ISLAND_AREA, ISLAND_BOUNDS, ZOOM_LEVELS, type DrawnArea } from "@/lib/landing/compare";
import { inPolygon, isSimple, rightmost, ringPath, type Pt } from "@/lib/landing/polygon";

// The dots are thinned by what the screen can show, in two sets, each chosen once per window and size of map.
// The first is spaced by an inside dot's width (ring and all, in CSS px at the size the map is shown): no two
// are closer than this many times it, so inside the line a dense town reads as beads side by side, each with
// its ring and its shade, and not as a blot. These dots stay on the map while the area is redrawn and only
// change sides. The second set fills in between them, spaced by an outside dot's own, smaller, width: it shows
// outside the line only, so a town the area does not hold still reads as a town, and it is left out inside,
// where the first set speaks for it. The count is not thinned.
const DOT_SPACING = 0.9;
const FINE_SPACING = 1.3;
// The thin ring round an inside dot, in CSS px.
const DOT_RING = 1;
// The least an outside dot's radius may be, in CSS px.
const DOT_OUT_MIN = 1.5;
// The most dots the small map down the page is sent for an area the window cuts.
const MAX_SENT = 600;
// Arrow keys move a corner this many view units; Shift moves it further.
const STEP = 10;
const BIG_STEP = 40;
// The island's own window. The basemap's unseen coast is in its units (IslandBasemap), whatever window is shown.
const WHOLE = viewOf(ISLAND_AREA);
// Closer in than this, a town is no longer a few dots wide and the dots take their full size.
const WIDE_BELOW = 3;
// A pointer that has gone less far than this (CSS px) with the map in hand has clicked it, not moved it.
const PAN_SLOP = 3;
// "Draw an area here": how much of the window's width the new area spans, and how far each of its five corners
// stands from its middle, a little uneven, as a hand would draw them (the same ring a picked place gets).
const FRESH_SHARE = 0.22;
const FRESH_RING = [1, 0.92, 1.06, 0.94, 1.02];
// A corner stays this many CSS pixels inside the visible map.
const EDGE = 12;
// A keyboard move is over this long after its last key-down if no key-up or blur has said so sooner.
const KEY_IDLE_MS = 1500;
// When the listings pop in on first load, in ms after navigation: after the handles and the outline.
const DOTS_AT = 1100;
// How long the count takes to tick up beside them.
const TICK_MS = 700;

// How long a listing takes to pop when the line crosses it, either way.
const POP_MS = 250;
// A finger has to rest on the area this long before it moves the area; a plain swipe scrolls the page, or moves
// the map once that is zoomed in.
const HOLD_MS = 300;
// Further than this (CSS px) before the hold is up, and the finger is swiping.
const HOLD_SLOP = 8;
/**
 * Where one shade of "how full" ends and the next begins, in % of nights occupied this season: four steps,
 * emptier to fuller. A listing without a figure has no step and stays ink.
 */
const OCC_STEPS = [60, 70, 80];
const stepOf = (occ: number | null | undefined) =>
  occ == null || Number.isNaN(occ) ? 0 : 1 + OCC_STEPS.filter((edge) => occ >= edge).length;

type Box = { x0: number; y0: number; x1: number; y1: number };
/**
 * The dots on the map. `step` is each one's shade (0 none, 1 to 4 emptier to fuller). `side` is which side of
 * the line it was last painted on and `flip` when it last crossed (0 when it is at rest), for the pop.
 */
type Dots = {
  x: Float32Array;
  y: Float32Array;
  delay: Float32Array;
  step: Uint8Array;
  /** 1 for a dot of the second, finer set, which shows outside the line only. */
  fine: Uint8Array;
  side: Uint8Array;
  flip: Float64Array;
  n: number;
};
/**
 * A corner in the hand (`i` is its index), or the whole area (`i` is -1 and `from` the corners it started at).
 * `id` is the pointer that has it: one drag at a time, and no other pointer's events move or end it.
 */
type Drag = { id: number; i: number; dx: number; dy: number; x: number; y: number; raf: number; from?: Pt[] };

/** The map itself in the hand (a mouse's, or a finger's): the pointer, where it took hold, and how far it has taken the map (CSS px). */
type Pan = { id: number; x: number; y: number; dx: number; dy: number; raf: number };

/**
 * An inside dot's radius in CSS px, without its ring, on a map shown at `px` CSS px to the view unit. Dots hold
 * their size on screen; seen from far out (`wide`) a town is a few dots wide, so they are drawn smaller.
 */
const dotRadius = (px: number, wide: boolean) => Math.max(2.2, Math.min(3, (VIEW_W * px) / 250)) * (wide ? 0.7 : 1);

/**
 * Which of the points are far enough apart to be drawn as separate dots: taken in order, each at least `gap`
 * from every one taken before it, and from every one of `taken` (dots already chosen, which are not given
 * again). The points are sorted into squares `gap` wide, so each is only measured against those in the squares
 * round its own.
 */
function spaced(xs: Float64Array, ys: Float64Array, gap: number, taken: number[] = []): number[] {
  const squares = new Map<number, number[]>();
  const key = (cx: number, cy: number) => (cx + 0x8000) * 0x10000 + (cy + 0x8000);
  const kept: number[] = [];
  const already = new Set(taken);
  for (const i of taken) {
    const at = key(Math.floor(xs[i] / gap), Math.floor(ys[i] / gap));
    const here = squares.get(at);
    if (here) here.push(i);
    else squares.set(at, [i]);
  }
  for (let i = 0; i < xs.length; i++) {
    if (already.has(i)) continue;
    const cx = Math.floor(xs[i] / gap);
    const cy = Math.floor(ys[i] / gap);
    let clear = true;
    for (let ax = cx - 1; clear && ax <= cx + 1; ax++) {
      for (let ay = cy - 1; clear && ay <= cy + 1; ay++) {
        const near = squares.get(key(ax, ay));
        if (near?.some((j) => Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) < gap)) clear = false;
      }
    }
    if (!clear) continue;
    kept.push(i);
    const here = squares.get(key(cx, cy));
    if (here) here.push(i);
    else squares.set(key(cx, cy), [i]);
  }
  return kept;
}

/** At most `max` of the items, taken evenly through the list. */
function thin<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  return Array.from({ length: max }, (_, i) => items[Math.floor((i * items.length) / max)]);
}

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
/** Index of the highest corner on the map: where the count goes while the whole area moves. */
const topmost = (ring: Pt[]) => ring.reduce((at, p, i) => (p[1] < ring[at][1] ? i : at), 0);
const easeOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** The middle of a ring: of the box round it. */
function middleOf(ring: Pt[]): Pt {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
const within = (p: Pt, b: Box) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1;
/** Can the ring be seen and taken hold of in the window `b`: is its middle there, and at least one corner? */
const inSight = (ring: Pt[], b: Box) => within(middleOf(ring), b) && ring.some((p) => within(p, b));

export interface AreaMapProps {
  /** The map's own area, and the window it is seen through just now (`area.view`). */
  area: DrawnArea;
  /** The ground under the area, drawn for that window (IslandBasemap). */
  basemap: React.ReactNode;
  /** How far in the window is: 1 is the whole island. */
  zoom: number;
  /** The visitor asks for another window: this far in, with [lat, lng] at its middle. */
  onWindow: (zoom: number, lat: number, lng: number) => void;
  points: PointRow[] | null;
  /** The area's corners in the window's view units, as last released. */
  verts: Pt[];
  changed: boolean;
  /** What the count bar says when the visitor is not mid-drag. */
  countText: string;
  countPending: boolean;
  /** How full and how dear the listings inside are, to follow the count on phones (", 80% occupied this season, €194 a night"). */
  facts: string;
  factsPending: boolean;
  demo: boolean;
  /** True during the first-load choreography. */
  intro: boolean;
  /** True until the visitor first touches a corner; one handle pulses meanwhile and the invitation stands beside it. */
  cue: boolean;
  /** How to name the area for assistive tech ("Protaras", "your area near Protaras"). */
  name: string;
  /**
   * A corner was released (or moved by a key), or a fresh area was drawn in the window: the new corners and how
   * many listings they hold.
   */
  onCommit: (verts: Pt[], count: number | null) => void;
  /** Called on every frame of a drag, after the map has redrawn, so the lines to the panels can follow. */
  onLiveMove: () => void;
  /** The listings are placed; `count` of those on land are inside the area as it stands. */
  onCount: (count: number) => void;
  /**
   * Where the dots inside the area are painted, in view units, each with its shade of "how full" (0 for none,
   * 1 to 4): called when the listings are placed and when the corners come to rest (a release, a key, a
   * reset), never while a corner is in the hand.
   */
  onDots: (inside: Array<[number, number, number]>) => void;
  onTouch: () => void;
  /** Back to the map's own area; `count` listings are inside that, and `inSight` says whether this window shows it. */
  onReset: (count: number | null, inSight: boolean) => void;
}

/**
 * The stage's map: the island's basemap with the drawn area on it, in a
 * window the visitor can zoom (plus and minus, a double click) and, once it
 * is zoomed in, move by its ground with a mouse or one finger. The square
 * handles are real controls. While one moves, or the map does, nothing here
 * re-renders: the outline, the handles, the dots (one canvas) and the count
 * are redrawn straight from the pointer, once per animation frame, and a map
 * in the hand is only shifted.
 */
export default function AreaMap({
  area,
  basemap,
  zoom,
  onWindow,
  points,
  verts,
  changed,
  countText,
  countPending,
  facts,
  factsPending,
  demo,
  intro,
  cue,
  name,
  onCommit,
  onLiveMove,
  onCount,
  onDots,
  onTouch,
  onReset,
}: AreaMapProps) {
  const view = useMemo(() => viewOf(area), [area]);
  const original = useMemo(() => area.polygon.map(([lat, lng]) => project(view, lat, lng)), [area.polygon, view]);

  // Where the basemap's unseen coast is drawn: the island's own window on its kind of map.
  const seaView = area.frame ? WHOLE : view;

  const rootRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<HTMLButtonElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const portRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const areaKeyRef = useRef<HTMLButtonElement>(null);
  const trunkRef = useRef<SVGPathElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const handleRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // The corners as they are right now, mid-drag included. `verts` catches up on release.
  const live = useRef<Pt[]>(verts);
  // Every listing on land, wherever it is, in the window's units (the count is of these, so it does not depend
  // on the window), and the dots drawn for those the window shows.
  const all = useRef<{ x: Float64Array; y: Float64Array; step: Uint8Array; n: number } | null>(null);
  const dots = useRef<Dots | null>(null);
  // The listings that would be dots past the window's edge (indexes into `all`): not painted, but the small map
  // down the page shows them when the window cuts the area.
  const beyond = useRef<number[]>([]);
  const names = useRef<Array<{ el: HTMLElement; x: number; y: number }>>([]);
  const paintState = useRef({
    dpr: 1,
    unit: 1,
    // An inside dot's colour by its step: ink for none, then the four shades of "how full".
    steps: ["#000", "#000", "#000", "#000", "#000"],
    dotOut: "#999",
    // The thin ring round every inside dot: the darkest shade, so a pale fill still reads as a mark.
    ring: "#000",
    accent: "#000",
    still: false,
    popAt: -1,
    raf: 0,
    // True while `paint` is rescheduling itself (the first-load pop, or dots crossing the line).
    looping: false,
    // Seen from far out a town is a few dots wide, so the dots are drawn smaller.
    wide: zoom < WIDE_BELOW,
  });
  const drag = useRef<Drag | null>(null);
  const pan = useRef<Pan | null>(null);
  // A finger resting on the area, not yet moving it: where it is now (`x`, `y`) and where it came down.
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; id: number; x: number; y: number; x0: number; y0: number } | null>(
    null
  );
  // True once a held finger has taken the area: its moves must not scroll the page.
  const touchMoving = useRef(false);
  const popped = useRef(false);
  // The top and the foot of the part of the view the frame shows, in view units; `bounds` keeps them current.
  const visibleTop = useRef(0);
  const visibleBottom = useRef(VIEW_H);
  // The place names' boxes (the same as `labels`), for the chip, which keeps off them.
  const labelBoxes = useRef<Box[]>([]);
  // The corner in the visitor's hand (pointer or arrow keys), if any.
  const moving = useRef<number | null>(null);
  const keyIdle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The count ticking up on first load: the figure it climbs to, and from when. Null once it has landed.
  const tick = useRef<{ n: number | null; start: number } | null>(null);
  const settled = useRef(countText);
  settled.current = countText;
  const introRef = useRef(intro);
  introRef.current = intro;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // The place names showing on the basemap, in view units; no dot is drawn under one.
  const [labels, setLabels] = useState<Box[]>([]);
  // The listings that are on land: the sea is tested once, not for every window.
  const [land, setLand] = useState<PointRow[] | null>(null);
  // The part of the view the frame shows, in view units: "the window" wherever the map asks what is in sight.
  const [shown, setShown] = useState<Box>({ x0: 0, y0: 0, x1: VIEW_W, y1: VIEW_H });
  // CSS px to the view unit at the size the map is shown, to the nearest hundredth: the dots are spaced by it.
  const [px, setPx] = useState(0);

  const countInside = useCallback((ring: Pt[]): number | null => {
    const a = all.current;
    if (!a) return null;
    let n = 0;
    for (let i = 0; i < a.n; i++) if (inPolygon(a.x[i], a.y[i], ring)) n++;
    return n;
  }, []);

  /**
   * The painted dots that fall inside `ring`, to one decimal of a view unit, each with its shade. Where the
   * window cuts the area (the visitor has zoomed in on part of it), the listings in the rest of it are not
   * painted here, but the small map down the page shows the whole area: those that would be dots there are
   * added, in the same units.
   */
  const dotsInside = useCallback((ring: Pt[]): Array<[number, number, number]> | null => {
    const d = dots.current;
    const a = all.current;
    if (!d) return null;
    const dot = (x: number, y: number, step: number): [number, number, number] => [Math.round(x * 10) / 10, Math.round(y * 10) / 10, step];
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < d.n; i++) {
      if (!d.fine[i] && inPolygon(d.x[i], d.y[i], ring)) out.push(dot(d.x[i], d.y[i], d.step[i]));
    }
    if (!a || !ring.some(([x, y]) => x < 0 || x > VIEW_W || y < 0 || y > VIEW_H)) return out;
    const more = beyond.current.filter((i) => inPolygon(a.x[i], a.y[i], ring)).map((i) => dot(a.x[i], a.y[i], a.step[i]));
    return out.concat(thin(more, Math.max(0, MAX_SENT - out.length)));
  }, []);

  /**
   * The dots, on the canvas. Inside the line: shaded by how full the listing is, each inside a thin ring of
   * the darkest shade. Outside it: small and grey. A dot the line has just crossed pops from one to the other over
   * POP_MS; only those are drawn one by one, and the loop that animates them stops when none is left.
   */
  const paint = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const d = dots.current;
    const s = paintState.current;
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!d) return;
    const ring = live.current;
    const k = s.unit * s.dpr; // device pixels per view unit
    const inside = new Uint8Array(d.n);
    let nIn = 0;
    let popping = 0;
    for (let i = 0; i < d.n; i++) {
      if (d.fine[i]) {
        // 2: a dot of the finer set that the line holds, which is not drawn.
        if (inPolygon(d.x[i], d.y[i], ring)) inside[i] = 2;
        continue;
      }
      if (inPolygon(d.x[i], d.y[i], ring)) (inside[i] = 1), nIn++;
      // 2 marks a dot that has not been painted yet: it takes its side without a pop.
      if (d.side[i] !== 2 && d.side[i] !== inside[i] && !s.still && s.popAt < 0) d.flip[i] = now;
      d.side[i] = inside[i];
      if (d.flip[i] && now - d.flip[i] >= POP_MS) d.flip[i] = 0;
      if (d.flip[i]) popping++;
    }
    // For checks: how many solid dots this pass paints (the count is higher wherever listings stand closer
    // than dots can be told apart: see DOT_SPACING), and how many are mid-pop.
    canvas.dataset.inside = String(nIn);
    canvas.dataset.popping = String(popping);
    // Dots hold their size on screen, however many there are: they were chosen far enough apart for it.
    const base = dotRadius(s.unit, s.wide) * s.dpr;
    // An outside dot is smaller, but never so small that a thinned-out town cannot be seen at all.
    const small = Math.max(base * 0.55, Math.min(base, DOT_OUT_MIN * s.dpr));
    const edge = DOT_RING * s.dpr;
    const pop = s.popAt < 0 ? 1 : (now - s.popAt) / 380;
    const grow = (i: number) => (s.popAt < 0 ? 1 : easeOut(Math.max(0, pop - d.delay[i])));
    const disc = (i: number, r: number) => {
      ctx.moveTo(d.x[i] * k + r, d.y[i] * k);
      ctx.arc(d.x[i] * k, d.y[i] * k, r, 0, 6.2832);
    };

    // Outside, at rest: one path.
    ctx.fillStyle = s.dotOut;
    ctx.globalAlpha = s.popAt < 0 ? 1 : easeOut(Math.max(0, Math.min(1, pop)));
    ctx.beginPath();
    for (let i = 0; i < d.n; i++) if (!inside[i] && !d.flip[i]) disc(i, small);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Inside, at rest: the rings as one path, then one path for each shade.
    ctx.fillStyle = s.ring;
    ctx.beginPath();
    for (let i = 0; i < d.n; i++) {
      if (inside[i] !== 1 || d.flip[i]) continue;
      const r = (base + edge) * grow(i);
      if (r > 0.05) disc(i, r);
    }
    ctx.fill();
    for (let step = 0; step < s.steps.length; step++) {
      ctx.fillStyle = s.steps[step];
      ctx.beginPath();
      for (let i = 0; i < d.n; i++) {
        if (inside[i] !== 1 || d.flip[i] || d.step[i] !== step) continue;
        const r = base * grow(i);
        if (r > 0.05) disc(i, r);
      }
      ctx.fill();
    }
    // Crossing the line: each on its own, between its outside and its inside look.
    if (popping) {
      for (let i = 0; i < d.n; i++) {
        if (!d.flip[i]) continue;
        const t = Math.min(1, (now - d.flip[i]) / POP_MS);
        const e = 1 - Math.pow(1 - t, 3);
        // How far towards "inside" the dot is: growing as it enters, shrinking as it leaves.
        const into = inside[i] ? e : 1 - e;
        const r = small + (base - small) * into;
        ctx.globalAlpha = 1;
        ctx.fillStyle = s.ring;
        ctx.beginPath();
        disc(i, r + edge * into);
        ctx.fill();
        ctx.fillStyle = s.dotOut;
        ctx.beginPath();
        disc(i, r);
        ctx.fill();
        ctx.globalAlpha = into;
        ctx.fillStyle = s.steps[d.step[i]];
        ctx.beginPath();
        disc(i, r);
        ctx.fill();
        if (inside[i]) {
          // A brief ring going out from a listing the line has just taken in.
          ctx.globalAlpha = 0.7 * (1 - t);
          ctx.strokeStyle = s.accent;
          ctx.lineWidth = 1.5 * s.dpr;
          ctx.beginPath();
          disc(i, base + edge + 7 * s.dpr * e);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    if (s.popAt >= 0 && pop > 2.2) s.popAt = -1;
    // One loop, running only while something is animating.
    s.looping = s.popAt >= 0 || popping > 0;
    if (s.looping) s.raf = requestAnimationFrame(paint);
  }, []);

  /**
   * Puts everything that follows the corners where they now are. With
   * `moving` (the corner in the visitor's hand) it also writes the count, in
   * the bar and in the chip beside that corner; at rest the bar is React's.
   */
  const draw = useCallback(
    (moving: number | null) => {
      const ring = live.current;
      const d = ringPath(ring);
      fillRef.current?.setAttribute("d", d);
      outlineRef.current?.setAttribute("d", d);
      hitRef.current?.setAttribute("d", d);
      // The whole-area control sits at the middle of the area, for assistive tech that places focus by position.
      if (areaKeyRef.current) {
        areaKeyRef.current.style.left = pct(ring.reduce((sum, p) => sum + p[0], 0) / ring.length, VIEW_W);
        areaKeyRef.current.style.top = pct(ring.reduce((sum, p) => sum + p[1], 0) / ring.length, VIEW_H);
      }
      const anchor = rightmost(ring);
      ring.forEach(([x, y], i) => {
        const el = handleRefs.current[i];
        if (!el) return;
        el.style.left = pct(x, VIEW_W);
        el.style.top = pct(y, VIEW_H);
        el.toggleAttribute("data-anchor", i === anchor);
      });
      // The first stretch of the lines to the panels: from the right-most corner to the map's edge.
      // It runs on past the view, so it still reaches the edge while the map is in the hand and shifted.
      trunkRef.current?.setAttribute("d", `M${ring[anchor][0].toFixed(1)} ${ring[anchor][1].toFixed(1)}H${VIEW_W * 2 + 20}`);
      // A name the area now covers takes the tinted land as its halo.
      for (const n of names.current) n.el.toggleAttribute("data-in", inPolygon(n.x, n.y, ring));
      const s = paintState.current;
      // While the dots are animating, the loop repaints them itself on this same frame.
      if (!s.looping) paint(performance.now());
      const chip = chipRef.current;
      if (moving == null) {
        chip?.removeAttribute("data-on");
        return;
      }
      const n = countInside(ring);
      if (n == null) return;
      if (countRef.current) countRef.current.textContent = countLine(n);
      if (chip) {
        const [x, y] = ring[moving];
        const text = countChip(n);
        chip.textContent = text;
        chip.style.left = pct(x, VIEW_W);
        chip.style.top = pct(y, VIEW_H);
        // Above the corner, unless that would push it off the top of the map. If it would then lie on a place
        // name, it goes to the other side of the hand, where that side is on the map and clear of the names.
        // The chip's box, in view units, from its type (13px semibold) and its 16px gap from the corner.
        const hw = (16 + text.length * 7.8) / 2 / s.unit;
        const h = 22 / s.unit;
        const gap = 16 / s.unit;
        const top = (below: boolean) => (below ? y + gap : y - gap - h);
        const onName = (below: boolean) =>
          labelBoxes.current.some((b) => x + hw > b.x0 && x - hw < b.x1 && top(below) + h > b.y0 && top(below) < b.y1);
        const room = (below: boolean) => (below ? (visibleBottom.current - y) * s.unit >= 44 : (y - visibleTop.current) * s.unit >= 44);
        let below = !room(false);
        if (onName(below) && room(!below) && !onName(!below)) below = !below;
        chip.toggleAttribute("data-below", below);
        chip.setAttribute("data-on", "");
      }
    },
    [countInside, paint]
  );

  /** Marks the hero as having a corner in hand (what follows the area is then stale), or not. */
  const setMoving = useCallback(
    (i: number | null) => {
      moving.current = i;
      // Set on the whole hero, so the panels can step back what still describes the area as it was.
      (rootRef.current?.closest(".th-hero-in") ?? rootRef.current)?.toggleAttribute("data-moving", i != null);
      draw(i);
    },
    [draw]
  );

  // The released corners arrive as props (a reset, the echo of a release, or the same ground in another window).
  // Three steps, in this order, before the browser paints: the corners, then the listings in the window's units,
  // then everything drawn from both.
  useLayoutEffect(() => {
    live.current = verts;
  }, [verts]);
  // Place the listings in the window. Every one on land is kept for the count. Those far enough apart to be told
  // apart on screen are drawn as dots, none under a place name. They are chosen over the whole island, not the
  // window, so moving the map leaves every dot on the listing it was on.
  useLayoutEffect(() => {
    if (!land || px <= 0) return;
    const ring = live.current;
    const wide = zoom < WIDE_BELOW;
    const xs = new Float64Array(land.length);
    const ys = new Float64Array(land.length);
    const steps = new Uint8Array(land.length);
    land.forEach((p, i) => {
      [xs[i], ys[i]] = project(view, p.lat, p.lng);
      steps[i] = stepOf(p.effOccTodate);
    });
    // Each dot: where it is, how full the listing is (its shade once it is inside the line), and which set it is of.
    const chosen: Array<[number, number, number, number]> = [];
    const past: number[] = [];
    const seen = (x: number, y: number) => x >= 0 && x <= VIEW_W && y >= 0 && y <= VIEW_H;
    const named = (x: number, y: number) => labels.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
    // The first set's gap is an inside dot's width, the larger of the two looks: a dot keeps its place whichever
    // side it is on.
    const radius = dotRadius(px, wide);
    const first = spaced(xs, ys, (DOT_SPACING * 2 * (radius + DOT_RING)) / px);
    for (const i of first) {
      if (!seen(xs[i], ys[i])) past.push(i);
      else if (!named(xs[i], ys[i])) chosen.push([xs[i], ys[i], steps[i], 0]);
    }
    // The second set's gap is an outside dot's width (see `small` in paint), kept clear of the first set too.
    const small = Math.max(radius * 0.55, Math.min(radius, DOT_OUT_MIN));
    for (const i of spaced(xs, ys, (FINE_SPACING * 2 * small) / px, first)) {
      if (seen(xs[i], ys[i]) && !named(xs[i], ys[i])) chosen.push([xs[i], ys[i], steps[i], 1]);
    }
    all.current = { x: xs, y: ys, step: steps, n: land.length };
    beyond.current = past;
    dots.current = {
      x: Float32Array.from(chosen, (p) => p[0]),
      y: Float32Array.from(chosen, (p) => p[1]),
      // On first load the dots pop in as a sweep from the area's left to its right.
      delay: Float32Array.from(chosen, (p) => (p[0] / VIEW_W) * 0.9),
      step: Uint8Array.from(chosen, (p) => p[2]),
      fine: Uint8Array.from(chosen, (p) => p[3]),
      // Not painted yet: in a new window every dot takes its side without a pop.
      side: new Uint8Array(chosen.length).fill(2),
      flip: new Float64Array(chosen.length),
      n: chosen.length,
    };
    const n = countInside(ring) ?? 0;
    onCount(n);
    onDots(dotsInside(ring) ?? []);
    const s = paintState.current;
    s.wide = wide;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!popped.current && !still && intro) {
      // The one authored moment: the listings pop in and the count ticks up, after the outline has closed.
      const start = Math.max(performance.now(), DOTS_AT);
      s.popAt = start;
      cancelAnimationFrame(s.raf);
      s.looping = true;
      s.raf = requestAnimationFrame(paint);
      if (tick.current) tick.current = { n, start };
    } else if (!s.looping) {
      paint(performance.now());
    }
    popped.current = true;
    // `intro` is read once, when the listings first arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [land, view, labels, zoom, px, countInside, dotsInside, onCount, onDots, paint]);
  useLayoutEffect(() => {
    draw(moving.current);
  }, [verts, draw]);
  // The corners have come to rest: say which dots are now inside, for the small map down the page.
  useEffect(() => {
    const inside = dotsInside(verts);
    if (inside) onDots(inside);
  }, [verts, dotsInside, onDots]);

  // On first load the count waits for its turn in the choreography, then ticks up with the dots.
  const tickText = useCallback((now: number): string | null => {
    const t = tick.current;
    if (!t) return null;
    if (t.n == null || now < t.start) return COUNTING;
    return countLine(Math.round(t.n * easeOut((now - t.start) / TICK_MS)));
  }, []);
  useEffect(() => {
    if (!introRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    tick.current = { n: null, start: 0 };
    let raf = 0;
    const loop = (now: number) => {
      const t = tick.current;
      if (!t) return;
      if (t.n == null ? !introRef.current : now >= t.start + TICK_MS) {
        tick.current = null;
        if (countRef.current) countRef.current.textContent = settled.current;
        return;
      }
      if (countRef.current) countRef.current.textContent = tickText(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      tick.current = null;
    };
  }, [tickText]);
  /**
   * Ends the first-load tick at once, for a visitor who acts before it has run out: from here the
   * count is theirs (`draw` writes it while a corner is in the hand, React at rest), so the tick
   * must not write another figure over it.
   */
  const endTick = useCallback(() => {
    if (!tick.current) return;
    tick.current = null;
    if (countRef.current) countRef.current.textContent = settled.current;
  }, []);
  // While that runs, a re-render must not put the final figure in early.
  useLayoutEffect(() => {
    const text = tickText(performance.now());
    if (text != null && countRef.current) countRef.current.textContent = text;
  }, [countText, tickText]);

  // The roles as colours the canvas can take, once: a probe resolves the ones that are mixed from others.
  useEffect(() => {
    const host = viewRef.current;
    if (!host) return;
    const s = paintState.current;
    const probe = document.createElement("i");
    probe.style.display = "none";
    host.appendChild(probe);
    const role = (name: string, fallback: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color || fallback;
    };
    s.steps = ["--th-dot", "--th-occ-1", "--th-occ-2", "--th-occ-3", "--th-occ-4"].map((name, i) => role(name, s.steps[i]));
    s.dotOut = role("--th-dot-out", s.dotOut);
    s.ring = role("--th-occ-ring", s.ring);
    s.accent = role("--th-a", s.accent);
    probe.remove();
    s.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      cancelAnimationFrame(s.raf);
      s.popAt = -1;
      s.looping = false;
    };
  }, []);

  // Size the canvas to the map, and find the place names on it: they change with the window. Strokes and
  // dots keep their size on screen whatever the map's width.
  useEffect(() => {
    const host = viewRef.current;
    const port = portRef.current;
    const canvas = canvasRef.current;
    if (!host || !port || !canvas) return;
    const found = Array.from(host.querySelectorAll<HTMLElement>(".th-place"));
    names.current = found.map((el) => ({
      el,
      x: (parseFloat(el.style.left) / 100) * VIEW_W,
      y: (parseFloat(el.style.top) / 100) * VIEW_H,
    }));
    const s = paintState.current;
    let last = "";
    const measure = () => {
      const frame = host.getBoundingClientRect();
      const { width, height } = frame;
      if (width === 0) return;
      s.dpr = Math.min(window.devicePixelRatio || 1, 3);
      s.unit = width / VIEW_W;
      setPx(Math.round(s.unit * 100) / 100);
      const w = Math.round(width * s.dpr);
      const h = Math.round(height * s.dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // View units per CSS pixel, for the strokes drawn in view units.
      host.style.setProperty("--th-u", (VIEW_W / width).toFixed(4));
      const unit = VIEW_W / width;
      // The frame shows the middle of the view and crops the rest. From the sizes alone: a map in the hand is
      // shifted, and must measure the same.
      const cropX = Math.max(0, (width - port.clientWidth) / 2) * unit;
      const cropY = Math.max(0, (height - port.clientHeight) / 2) * unit;
      setShown((was) => {
        const now = { x0: cropX, y0: cropY, x1: VIEW_W - cropX, y1: VIEW_H - cropY };
        return Math.abs(was.x0 - now.x0) < 0.5 && Math.abs(was.y0 - now.y0) < 0.5 ? was : now;
      });
      const pad = 5; // px around the text: a dot's radius and its ring
      const boxes: Box[] = [];
      for (const el of found) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        boxes.push({
          x0: Math.floor((r.left - pad - frame.left) * unit),
          y0: Math.floor((r.top - pad - frame.top) * unit),
          x1: Math.ceil((r.right + pad - frame.left) * unit),
          y1: Math.ceil((r.bottom + pad - frame.top) * unit),
        });
      }
      labelBoxes.current = boxes;
      const key = JSON.stringify(boxes);
      if (key !== last) {
        last = key;
        setLabels(boxes);
      }
      draw(moving.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    ro.observe(port); // a frame that changes shape crops the view differently
    for (const el of found) ro.observe(el); // a name's face loading changes its box
    // The canvas also depends on devicePixelRatio, which the observer does not watch; a zoom fires resize.
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [draw, view]);

  // Which listings are on land. Demo listings scatter uniformly, and a listing in the water reads as a broken
  // map: it is neither drawn nor counted. The coast it is tested against does not move with the window, so
  // neither does the answer.
  useEffect(() => {
    const host = viewRef.current;
    if (!points || !host) return;
    const svg = host.querySelector<SVGSVGElement>("svg");
    const sea = host.querySelector<SVGGeometryElement>("path[data-sea]");
    // The island's coast is drawn simplified, so a seafront listing can fall just outside it: on that map a
    // listing within this path's stroke of the coast is on land.
    const shore = host.querySelector<SVGGeometryElement>("path[data-shore-slack]");
    const at = svg?.createSVGPoint();
    const inSea = (lat: number, lng: number) => {
      if (!sea || !at) return false;
      [at.x, at.y] = project(seaView, lat, lng);
      // The sea is only drawn for its own window; beyond it the test cannot say water, so the listing is on land.
      if (at.x < 0 || at.x > VIEW_W || at.y < 0 || at.y > VIEW_H) return false;
      try {
        return sea.isPointInFill(at) && !shore?.isPointInStroke(at);
      } catch {
        return false;
      }
    };
    setLand(points.filter((p) => !inSea(p.lat, p.lng)));
  }, [points, seaView]);

  /** The part of the view the frame shows, in view units, less a margin that keeps a corner on the map. */
  const bounds = useCallback((): Box | null => {
    const port = portRef.current?.getBoundingClientRect();
    const frame = viewRef.current?.getBoundingClientRect();
    if (!port || !frame || frame.width === 0) return null; // the map has gone
    const unit = VIEW_W / frame.width;
    visibleTop.current = Math.max(0, port.top - frame.top) * unit;
    visibleBottom.current = Math.min(frame.height, port.bottom - frame.top) * unit;
    return {
      x0: Math.max(0, port.left - frame.left) * unit + EDGE * unit,
      y0: Math.max(0, port.top - frame.top) * unit + EDGE * unit,
      x1: Math.min(frame.width, port.right - frame.left) * unit - EDGE * unit,
      y1: Math.min(frame.height, port.bottom - frame.top) * unit - EDGE * unit,
    };
  }, []);

  /** Moves corner `i` to (x, y), unless that would fold the area over itself. */
  const moveTo = useCallback(
    (i: number, x: number, y: number): boolean => {
      const b = bounds();
      if (!b) return false;
      const next = live.current.map((p) => [p[0], p[1]] as Pt);
      next[i] = [Math.min(b.x1, Math.max(b.x0, x)), Math.min(b.y1, Math.max(b.y0, y))];
      if (!isSimple(next)) {
        // An area shaped closer in can already be tighter than this window's gaps allow, and every move of it
        // would be refused. Its corners may still move, so long as the ring stays apart by the closest window's gaps.
        const k = zoomRef.current / ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
        if (isSimple(live.current) || !isSimple(next, 8 * k, 2 * k)) return false;
      }
      live.current = next;
      return true;
    },
    [bounds]
  );

  /**
   * Moves every corner of `from` by (dx, dy), held back so that none leaves the visible map. The shape does
   * not change, so it cannot fold over itself.
   */
  const moveAll = useCallback(
    (from: Pt[], dx: number, dy: number): boolean => {
      const b = bounds();
      if (!b) return false;
      const xs = from.map((p) => p[0]);
      const ys = from.map((p) => p[1]);
      // A corner that is already outside the margin (it cannot be, but a resize could leave one there) does not lock the area.
      const lowX = Math.min(0, b.x0 - Math.min(...xs));
      const highX = Math.max(0, b.x1 - Math.max(...xs));
      const lowY = Math.min(0, b.y0 - Math.min(...ys));
      const highY = Math.max(0, b.y1 - Math.max(...ys));
      const mx = Math.min(highX, Math.max(lowX, dx));
      const my = Math.min(highY, Math.max(lowY, dy));
      live.current = from.map(([x, y]) => [x + mx, y + my] as Pt);
      return true;
    },
    [bounds]
  );

  const frame = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    d.raf = 0;
    const r = viewRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return; // the map has gone
    const unit = VIEW_W / r.width;
    if (d.from) {
      // The whole area: every corner by how far the pointer has gone from where it took hold.
      if (moveAll(d.from, (d.x - r.left) * unit - d.dx, (d.y - r.top) * unit - d.dy)) {
        draw(topmost(live.current));
        onLiveMove();
      }
    } else if (moveTo(d.i, (d.x - r.left) * unit - d.dx, (d.y - r.top) * unit - d.dy)) {
      draw(d.i);
      onLiveMove();
    }
  }, [draw, moveAll, moveTo, onLiveMove]);

  /** A finger waiting out its hold on the area is waiting no longer. */
  const dropHold = useCallback(() => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  }, []);

  /**
   * The end of any drag, a corner's or the area's: nothing is in the hand, the area is no longer held, and a
   * finger's moves scroll the page again.
   */
  const letGo = useCallback(() => {
    drag.current = null;
    touchMoving.current = false;
    rootRef.current?.removeAttribute("data-held");
  }, []);

  // A frame still waiting when the map goes (a picked place remounts it) must not run.
  useEffect(
    () => () => {
      if (drag.current?.raf) cancelAnimationFrame(drag.current.raf);
      if (pan.current?.raf) cancelAnimationFrame(pan.current.raf);
      pan.current = null;
      letGo();
      dropHold();
      clearTimeout(keyIdle.current);
      document.querySelector(".th-hero-in[data-moving]")?.removeAttribute("data-moving");
    },
    [letGo, dropHold]
  );

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, i: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // One drag at a time: a second finger landing on a corner while the area (or another corner) is in the
    // hand is ignored, so it can neither take the drag over nor leave the first one unfinished.
    if (drag.current || pan.current) return;
    // A finger still waiting out its hold on the area gives way to the corner.
    dropHold();
    const r = viewRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const unit = VIEW_W / r.width;
    const [vx, vy] = live.current[i];
    // The corner keeps its offset from the pointer, so it does not jump under the finger.
    drag.current = {
      id: e.pointerId,
      i,
      dx: (e.clientX - r.left) * unit - vx,
      dy: (e.clientY - r.top) * unit - vy,
      x: e.clientX,
      y: e.clientY,
      raf: 0,
    };
    try {
      // Keeps the corner with the pointer when it leaves the 44px target.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that is already gone cannot be captured; the press still counts.
    }
    e.currentTarget.setAttribute("data-dragging", "");
    bounds();
    endTick();
    setMoving(i);
    onTouch();
  }

  function onPointerMove(e: React.PointerEvent<Element>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.raf) d.raf = requestAnimationFrame(frame);
  }

  /** The end of a drag, however it ends: release, cancel, or the capture being taken away. */
  function onPointerEnd(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.from || d.id !== e.pointerId) return;
    if (d.raf) {
      cancelAnimationFrame(d.raf);
      frame();
    }
    letGo();
    setMoving(null);
    e.currentTarget.removeAttribute("data-dragging");
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (live.current !== verts) onCommit(live.current, countInside(live.current));
  }

  /** Takes hold of the whole area at the pointer. */
  function takeArea(target: Element, pointerId: number, clientX: number, clientY: number) {
    const r = viewRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const unit = VIEW_W / r.width;
    // The area keeps its offset from the pointer: `dx`, `dy` are where the pointer took hold, in view units.
    drag.current = {
      id: pointerId,
      i: -1,
      dx: (clientX - r.left) * unit,
      dy: (clientY - r.top) * unit,
      x: clientX,
      y: clientY,
      raf: 0,
      from: live.current,
    };
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // A pointer that is already gone cannot be captured; the press still counts.
    }
    rootRef.current?.setAttribute("data-held", "");
    bounds();
    endTick();
    setMoving(topmost(live.current));
    onTouch();
  }

  /**
   * A press inside the area. A mouse or a pen takes the area at once. A finger has to rest on it for HOLD_MS
   * first, so that a swipe that happens to start on the area still scrolls the page or, once the map is zoomed
   * in, moves the map (`onAreaMove`).
   */
  function onAreaDown(e: React.PointerEvent<SVGPathElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (drag.current || pan.current) return;
    const target = e.currentTarget;
    const { pointerId, clientX, clientY } = e;
    if (e.pointerType !== "touch") {
      takeArea(target, pointerId, clientX, clientY);
      return;
    }
    dropHold();
    hold.current = {
      id: pointerId,
      x: clientX,
      y: clientY,
      x0: clientX,
      y0: clientY,
      timer: setTimeout(() => {
        const h = hold.current;
        hold.current = null;
        // Something else took a drag while this finger waited: it does not take the area as well.
        if (!h || drag.current || pan.current) return;
        takeArea(target, h.id, h.x, h.y);
        // Only once the area really is in the hand do the finger's moves stop scrolling the page.
        touchMoving.current = drag.current != null;
      }, HOLD_MS),
    };
  }

  function onAreaMove(e: React.PointerEvent<SVGPathElement>) {
    const h = hold.current;
    if (h && h.id === e.pointerId) {
      if (zoom > 1) {
        // Zoomed in, the page does not take a finger's drag over the map (the stylesheet's `touch-action`), so
        // nothing ends a swipe for us: a finger that has left where it came down is swiping, and it has the map.
        // Its moves bubble to the view from here, which carries the map on (`onMapMove`).
        if (Math.hypot(e.clientX - h.x0, e.clientY - h.y0) > HOLD_SLOP) {
          dropHold();
          takeMap(e.pointerId, h.x0, h.y0);
        } else {
          h.x = e.clientX;
          h.y = e.clientY;
        }
        return;
      }
      // Still waiting out the hold: a finger that travels is swiping, and the page may have it.
      if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > HOLD_SLOP) {
        dropHold();
      } else {
        h.x = e.clientX;
        h.y = e.clientY;
      }
      return;
    }
    onPointerMove(e);
  }

  /** The end of a press on the area, however it ends. */
  function onAreaEnd(e: React.PointerEvent<SVGPathElement>) {
    if (hold.current && hold.current.id === e.pointerId) dropHold();
    const d = drag.current;
    if (!d || !d.from || d.id !== e.pointerId) return;
    if (d.raf) {
      cancelAnimationFrame(d.raf);
      frame();
    }
    letGo();
    setMoving(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (live.current !== verts) onCommit(live.current, countInside(live.current));
  }

  // Once a held finger has the area, its moves are the area's: the page must not scroll under it. Only a
  // listener that is not passive can say so, and React's are passive, so this one is attached by hand.
  useEffect(() => {
    const el = hitRef.current;
    if (!el) return;
    const stay = (e: TouchEvent) => {
      if (touchMoving.current && e.cancelable) e.preventDefault();
    };
    // A long press must not open the browser's own menu over the map.
    const quiet = (e: Event) => {
      if (touchMoving.current || hold.current) e.preventDefault();
    };
    el.addEventListener("touchmove", stay, { passive: false });
    el.addEventListener("contextmenu", quiet);
    return () => {
      el.removeEventListener("touchmove", stay);
      el.removeEventListener("contextmenu", quiet);
    };
  }, []);

  /** The arrow keys on the whole area: every corner by one step, kept on the map. */
  function onAreaKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const dir: Record<string, Pt> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const by = dir[e.key];
    if (!by) return;
    e.preventDefault();
    endTick();
    onTouch();
    const step = e.shiftKey ? BIG_STEP : STEP;
    const before = live.current;
    moveAll(before, by[0] * step, by[1] * step);
    const went = live.current.some((p, i) => p[0] !== before[i][0] || p[1] !== before[i][1]);
    if (!went) live.current = before;
    setMoving(topmost(live.current));
    clearTimeout(keyIdle.current);
    keyIdle.current = setTimeout(onKeyEnd, KEY_IDLE_MS);
    if (!went) return;
    onLiveMove();
    onCommit(live.current, countInside(live.current));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir: Record<string, Pt> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const by = dir[e.key];
    if (!by) return;
    e.preventDefault();
    endTick();
    onTouch();
    const step = e.shiftKey ? BIG_STEP : STEP;
    const [x, y] = live.current[i];
    const went = moveTo(i, x + by[0] * step, y + by[1] * step);
    // The chip shows the count while the key is down, moved or not. A key-up or a blur ends the
    // move; so does a pause, in case neither ever comes.
    setMoving(i);
    clearTimeout(keyIdle.current);
    keyIdle.current = setTimeout(onKeyEnd, KEY_IDLE_MS);
    if (!went) return;
    onLiveMove();
    onCommit(live.current, countInside(live.current));
  }

  /** A key coming up, or focus leaving the corner, ends a keyboard move. */
  function onKeyEnd() {
    clearTimeout(keyIdle.current);
    if (!drag.current) setMoving(null);
  }

  const stepIn = ZOOM_LEVELS.find((level) => level > zoom + 0.001);
  const stepOut = [...ZOOM_LEVELS].reverse().find((level) => level < zoom - 0.001);

  /**
   * One step closer. A double click or double tap goes in on its own point (`about`), wherever the area is: on
   * a touch screen it is the way to other ground. The plus button keeps the area in sight: while its middle is
   * in the window the new window is centred on it, and once the visitor has left it behind, on the window's own.
   */
  function zoomIn(about?: [number, number]) {
    if (stepIn == null || drag.current || pan.current) return;
    const mid = middleOf(live.current);
    const [lat, lng] = about ?? (within(mid, shown) ? unproject(view, mid[0], mid[1]) : unproject(view, VIEW_W / 2, VIEW_H / 2));
    onWindow(stepIn, lat, lng);
  }

  /** One step back out, round the same middle. */
  function zoomOut() {
    if (stepOut == null || drag.current || pan.current) return;
    const [lat, lng] = unproject(view, VIEW_W / 2, VIEW_H / 2);
    onWindow(stepOut, lat, lng);
  }

  /** A double click on the map's own ground (not on the area or a corner) zooms in about that point. */
  function onMapDouble(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const unit = VIEW_W / r.width;
    zoomIn(unproject(view, (e.clientX - r.left) * unit, (e.clientY - r.top) * unit));
  }

  /** How far (CSS px) the map may be taken from where it lies: its middle stays on the island. */
  function held(dx: number, dy: number): [number, number] {
    const px = paintState.current.unit; // CSS px per view unit
    const [lat, lng] = unproject(view, VIEW_W / 2 - dx / px, VIEW_H / 2 - dy / px);
    const [x, y] = project(
      view,
      Math.min(ISLAND_BOUNDS.north, Math.max(ISLAND_BOUNDS.south, lat)),
      Math.min(ISLAND_BOUNDS.east, Math.max(ISLAND_BOUNDS.west, lng))
    );
    return [(VIEW_W / 2 - x) * px, (VIEW_H / 2 - y) * px];
  }

  /** The map in the hand follows the pointer: the whole view is shifted, and nothing in it is redrawn. */
  const panFrame = useCallback(() => {
    const p = pan.current;
    if (!p || !viewRef.current) return;
    p.raf = 0;
    viewRef.current.style.translate = `${p.dx.toFixed(1)}px ${p.dy.toFixed(1)}px`;
    onLiveMove();
  }, [onLiveMove]);

  /** The pointer takes the map, at the point where it came down. */
  function takeMap(pointerId: number, clientX: number, clientY: number) {
    pan.current = { id: pointerId, x: clientX, y: clientY, dx: 0, dy: 0, raf: 0 };
    rootRef.current?.setAttribute("data-panning", "");
  }

  /**
   * A press on the map's own ground takes the map, once it is zoomed in: a mouse's, or one finger's (the
   * stylesheet keeps the page from scrolling under it there). On the whole island there is nowhere to take it,
   * and a finger's drag scrolls the page. One drag at a time: a second finger is ignored.
   */
  function onMapDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (zoom <= 1 || drag.current || pan.current) return;
    // A finger still waiting out its hold on the area gives way to the one that has the map.
    dropHold();
    takeMap(e.pointerId, e.clientX, e.clientY);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that is already gone cannot be captured; the press still counts.
    }
  }

  function onMapMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = pan.current;
    if (!p || p.id !== e.pointerId) return;
    [p.dx, p.dy] = held(e.clientX - p.x, e.clientY - p.y);
    if (!p.raf) p.raf = requestAnimationFrame(panFrame);
  }

  /** The map is let go, however that happens: the window takes the middle it was moved to, and the shift is undone. */
  function onMapEnd(e: React.PointerEvent<HTMLDivElement>) {
    const p = pan.current;
    if (!p || p.id !== e.pointerId) return;
    if (p.raf) cancelAnimationFrame(p.raf);
    pan.current = null;
    rootRef.current?.removeAttribute("data-panning");
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (Math.hypot(p.dx, p.dy) >= PAN_SLOP) {
      const px = paintState.current.unit;
      const [lat, lng] = unproject(view, VIEW_W / 2 - p.dx / px, VIEW_H / 2 - p.dy / px);
      // The new window is rendered before the shift comes off, so the map never shows the old ground unshifted.
      flushSync(() => onWindow(zoom, lat, lng));
    }
    e.currentTarget.style.translate = "";
    onLiveMove();
  }

  /**
   * "Draw an area here": a fresh five-cornered area in the middle of the window, in place of the one there was.
   * It is theirs from the start.
   */
  function drawHere() {
    if (drag.current || pan.current) return;
    const cx = (shown.x0 + shown.x1) / 2;
    const cy = (shown.y0 + shown.y1) / 2;
    const reach = Math.min(((shown.x1 - shown.x0) * FRESH_SHARE) / 2, (shown.y1 - shown.y0) * 0.3);
    // Clockwise from the north-west.
    const ring = FRESH_RING.map((f, i): Pt => {
      const bearing = ((-54 + 72 * i) * Math.PI) / 180;
      return [cx + reach * f * Math.sin(bearing), cy - reach * f * Math.cos(bearing)];
    });
    live.current = ring;
    endTick();
    draw(null);
    onLiveMove();
    onTouch();
    // On the whole island this button goes once the area is in sight: the keyboard moves to the area it has just drawn.
    if (zoom <= 1) areaKeyRef.current?.focus({ preventScroll: true });
    onCommit(ring, countInside(ring));
  }

  // Drawing is on offer whenever the map is zoomed in: that is where a visitor draws their own part of the
  // island. It is also offered when there is nothing of the area to take hold of in the window.
  const offered = zoom > 1 || !inSight(verts, shown);

  const outline = ringPath(verts);
  // How far the edge that leaves the inviting corner runs to the right for each unit it drops: the words beside
  // that corner stand clear of it (the stylesheet uses this where the words are to the corner's right).
  const cueTo = original[(area.cue.corner + 1) % original.length];
  const cueFrom = original[area.cue.corner];
  const cueRun = cueTo[1] > cueFrom[1] ? Math.max(0, (cueTo[0] - cueFrom[0]) / (cueTo[1] - cueFrom[1])) : 0;

  const fill = (
    <svg className="th-area-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
      <path ref={fillRef} className="th-area-fill" d={outline} />
    </svg>
  );

  return (
    <div
      ref={rootRef}
      className="th-map"
      data-intro={intro ? "" : undefined}
      data-cue={cue ? "" : undefined}
      data-zoomed={zoom > 1 ? "" : undefined}
    >
      <div className="th-map-frame">
        {/* The zoom control, on the map's top-right corner. At either end a step stays in the tab order and says
            it is unavailable, so the keyboard is not dropped when the last step is taken. */}
        <div className="th-zoom">
          <div className="th-zoom-steps" role="group" aria-label="Zoom the map">
            <button
              ref={zoomInRef}
              type="button"
              aria-label="Zoom in"
              aria-disabled={stepIn == null || undefined}
              onClick={() => zoomIn()}
            >
              <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Zoom out" aria-disabled={stepOut == null || undefined} onClick={zoomOut}>
              <Minus size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          {zoom > 1 && (
            <button
              type="button"
              className="th-zoom-whole"
              onClick={() => {
                // This button goes with the zoom: the keyboard moves to the step back in.
                zoomInRef.current?.focus({ preventScroll: true });
                onWindow(1, 0, 0);
              }}
            >
              Whole island
            </button>
          )}
        </div>
        <div
          ref={portRef}
          className="th-map-port"
          role="group"
          aria-label={`Map of Cyprus with ${name} drawn on it. Each corner of the area can be moved, and so can the whole area.`}
        >
          <div
            ref={viewRef}
            className="th-map-view"
            onPointerDown={onMapDown}
            onPointerMove={onMapMove}
            onPointerUp={onMapEnd}
            onPointerCancel={onMapEnd}
            onLostPointerCapture={onMapEnd}
            onDoubleClick={onMapDouble}
          >
            {/* On a street map the fill goes under the basemap's sea, so it tints the land only and stays one
                colour. The drawn island is a picture with its own towns and forest, which would hide a fill
                under it, so there the fill goes over the picture. */}
            {!area.frame && fill}
            {basemap}
            {area.frame && fill}
            <svg className="th-area-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
              <path ref={trunkRef} className="th-trunk" pathLength={1} />
              <path ref={outlineRef} className="th-area-line" d={outline} pathLength={1} />
              {/* The inside of the area: dragging here moves the whole of it. It paints nothing. */}
              <path
                ref={hitRef}
                className="th-area-hit"
                d={outline}
                onPointerDown={onAreaDown}
                onPointerMove={onAreaMove}
                onPointerUp={onAreaEnd}
                onPointerCancel={onAreaEnd}
                onLostPointerCapture={onAreaEnd}
              />
            </svg>
            <canvas ref={canvasRef} className="th-map-dots" aria-hidden="true" />
            {verts.map(([x, y], i) => (
              <button
                key={i}
                ref={(el) => {
                  handleRefs.current[i] = el;
                }}
                type="button"
                className="th-handle"
                data-cue={i === area.cue.corner ? "" : undefined}
                style={{ left: pct(x, VIEW_W), top: pct(y, VIEW_H), "--i": i } as React.CSSProperties}
                aria-label={`Corner ${i + 1} of ${verts.length}. Arrow keys move it.`}
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onLostPointerCapture={onPointerEnd}
                onKeyDown={(e) => onKeyDown(e, i)}
                onKeyUp={onKeyEnd}
                onBlur={onKeyEnd}
              >
                <i />
              </button>
            ))}
            {/* The whole area for the keyboard, after its corners: it shows as a ring on the outline when focused. */}
            <button
              ref={areaKeyRef}
              type="button"
              className="th-area-key"
              aria-label="The whole area. Arrow keys move it."
              onKeyDown={onAreaKeyDown}
              onKeyUp={onKeyEnd}
              onBlur={onKeyEnd}
            />
            {/* The invitation, set like a place name beside the corner that pulses; gone at the first touch of the
                area. Both wordings are in the markup and the stylesheet shows the one for the pointer in use
                (`pointer: coarse`), so the server and the browser render the same thing. */}
            {cue && (
              <span
                className="th-cue-label"
                data-side={area.cue.side}
                style={
                  {
                    "--fx": (original[area.cue.corner][0] / VIEW_W).toFixed(4),
                    "--fy": (original[area.cue.corner][1] / VIEW_H).toFixed(4),
                    "--run": cueRun.toFixed(3),
                  } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <span className="th-cue-fine">Drag a corner, or the whole area</span>
                <span className="th-cue-coarse">Drag a corner, or hold the area to move it</span>
              </span>
            )}
            {/* The count beside the corner in hand. AreaMap writes and places it as the corner moves. */}
            <span ref={chipRef} className="th-count-chip" aria-hidden="true" />
          </div>
          {offered && (
            <button type="button" className="th-draw-here" onClick={drawHere}>
              Draw an area here
            </button>
          )}
        </div>
        <div className="th-map-bar">
          <p className="th-map-count" aria-busy={countPending || undefined}>
            <span ref={countRef}>{countText}</span>
            {/* Phones only: the rest of the Playground's line, so a drag changes more than one figure in view. */}
            <span className="th-map-facts" data-pending={factsPending ? "" : undefined}>
              {facts}
            </span>
            {demo && <span className="th-tag">Demo data</span>}
          </p>
          {/* What the shades of the listings inside the line mean. The words carry it; the dots only show the scale. */}
          <p className="th-key">
            <span>emptier</span>
            <span className="th-key-dots" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>fuller</span>
            <span className="sr-only">: listings inside the line are shaded by how full they have been this season</span>
          </p>
          {/* The invitation to drag is on the map, beside the corner. Reset appears once the area has changed. */}
          {changed && (
            <button
              type="button"
              className="th-reset"
              onClick={() => {
                // This button goes with the reset: the keyboard moves to the area it has just put back, not to the page.
                areaKeyRef.current?.focus({ preventScroll: true });
                onReset(countInside(original), inSight(original, shown));
              }}
            >
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </div>
      {/* The count is of every listing inside the line, the dots only of those the screen can show apart: say so.
          Then the credit: the island's picture is drawn from OpenStreetMap data. */}
      <p className="th-credit">
        Where listings crowd together, one dot stands for several. Map data ©&nbsp;
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>
        , ©&nbsp;
        <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">
          OpenMapTiles
        </a>
      </p>
    </div>
  );
}
