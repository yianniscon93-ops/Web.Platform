"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { euro, int, pct } from "@/lib/landing/areaLines";
import { listingPoints } from "@/lib/landing/listingPoints";
import { inPolygon } from "@/lib/landing/polygon";
import type { TourArea, TourMarket, TourStop, TownPt } from "@/lib/landing/tour";

// One stop, in ms from the moment its map starts to arrive.
const DOTS_AT = 400; // the listings start to appear, west to east
const DRAW_AT = 1100; // the pointer starts on the first area's first corner
const CORNER_MS = 170; // from one corner to the next
// After an area closes it sets (its listings light, its figures are pinned) and stays to be read. Below 1024px
// the figures are only up while the band is on their area, so there the stay is longer. The lighting has to be
// over well inside the shorter stay: WAVE_MS + POP_MS is 960ms of the 1100.
const SET_MS = 1100;
const SET_BAND_MS = 1700;
const MOVE_MS = 500; // the pointer goes on to the next area's first corner, and below 1024px the map follows it
const HOLD_MS = 2200; // everything stays once the last figures have been read
const OUT_MS = 450; // the areas, their figures and the listings leave
const FIRST_MS = 3600; // how long the town the page arrives on, already complete, stays
const POINTER_IN = 250; // the pointer shows on the first corner this long before it moves
// The moment an area closes is the event of the tour: its listings light one after another, in a wave that starts
// where the line closed (its first corner, where the pointer rests) and reaches its farthest corner in WAVE_MS,
// whatever the area's size. Each listing the wave reaches swells past its size and settles, and a ring widens
// from it and fades, over POP_MS. Its figures are pinned as the wave is under way, so the card lands with it.
const WAVE_MS = 600;
const POP_MS = 360;
const PIN_AT = 260;
// Once a stop's first area has closed, the listings outside every area step back to this much of their strength
// over RECEDE_MS, so the listings caught read as the figure and the rest of the town as ground.
const RECEDE_TO = 0.45;
const RECEDE_MS = 400;
// An exponential ease-out that runs from exactly 0 to exactly 1, for the pop: quick at first, then settling.
const SETTLE = 1 - 2 ** -6;
const outExpo = (p: number) => (1 - 2 ** (-6 * p)) / SETTLE;
// Which listings become dots. In an area every one of them, while they can be told apart (up to SPARSE). A
// fuller area is thinned to what the screen can show, one dot to a cell of the map about a dot and a half
// across and no more than MOST_IN, so it reads as a stipple and the shades stay visible; its card still counts
// them all. Outside the areas, an even sample.
const SPARSE = 60;
const CELL = 22;
const MOST_IN = 160;
const MOST_OUT = 600;
type Found = [x: number, y: number, step: number, area: number];
const thin = <T,>(all: T[], most: number): T[] => (all.length <= most ? all : Array.from({ length: most }, (_, k) => all[Math.floor((k * all.length) / most)]));
const spread = (all: Found[], cell: number): Found[] => {
  const taken = new Set<number>();
  return all.filter(([x, y]) => {
    const key = Math.floor(x / cell) * 4096 + Math.floor(y / cell);
    return taken.has(key) ? false : (taken.add(key), true);
  });
};
const OUT = 255; // a listing in none of the town's areas
// How full a listing is, or an area, in four steps, as on the stage.
const stepOf = (occ: number | null | undefined) => (occ == null || Number.isNaN(occ) ? 0 : 1 + [60, 70, 80].filter((e) => occ >= e).length);

/**
 * Which parts of a town's drawing are water, read off the drawing itself at a coarse grain: a listing whose
 * position falls on the sea colour is left off the map (demo listings scatter into the sea; a real one can sit
 * on a pier), unless it is inside a drawn area, whose card counts it. Answers "dry" for everything if the
 * drawing cannot be read.
 */
async function waterOf(src: string): Promise<(x: number, y: number, size: number) => boolean> {
  const dry = () => false;
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const n = 320;
    const cv = document.createElement("canvas");
    cv.width = cv.height = n;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return dry;
    ctx.drawImage(img, 0, 0, n, n);
    const px = ctx.getImageData(0, 0, n, n).data;
    return (x, y, size) => {
      const i = (Math.min(n - 1, Math.floor((y / size) * n)) * n + Math.min(n - 1, Math.floor((x / size) * n))) * 4;
      // The sea is the one colour on these maps that is clearly bluer than it is red.
      return px[i + 2] - px[i] > 14;
    };
  } catch {
    return dry;
  }
}

/**
 * The dots of one map. `area` is the area a listing is inside (its index), or 255 for none; `late` is how long
 * after DOTS_AT it appears; `wave` is how long after its area closes it lights (0 for a listing in none).
 */
type Dots = { x: Float32Array; y: Float32Array; step: Uint8Array; area: Uint8Array; late: Float32Array; wave: Float32Array; n: number };
const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
const at = ([x, y]: TownPt, size: number) => ({ "--x": pc(x, size), "--y": pc(y, size) }) as React.CSSProperties;
const path = (ring: TownPt[]) => "M" + ring.map((p) => p.join(" ")).join("L") + "Z";
const middle = (ring: TownPt[]): TownPt => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

/** An area with too few listings to quote is drawn, with no figures. */
const quoted = (a: TourArea): a is TourArea & { occupied: number; rate: number } => a.occupied != null && a.rate != null;

/** One market's line on a card: what it is, how many listings, and what they come to. `mark` is the shade its listings wear on the map, for the market that is drawn there. */
function Line({ of, n, mark, children }: { of: string; n: number; mark?: number; children?: React.ReactNode }) {
  return (
    <>
      <span className="lh-of" data-step={mark}>
        {of}
      </span>
      <span className="lh-n">{int(n)}</span>
      <span className="lh-fig">{children}</span>
    </>
  );
}

/** A market's median, or that its listings are too few to quote one. With none at all there is nothing to say. */
const median = (m: TourMarket, unit?: string) =>
  m.median != null ? (
    <>
      <em>{euro(m.median)}</em>
      {unit && <small> {unit}</small>}
    </>
  ) : m.count > 0 ? (
    "too few"
  ) : null;

/**
 * An area's figures, a line to a market: the short-lets inside (a night's price and how full they are), the
 * long-lets (a month's rent) and the homes for sale (the asking price), each with how many there are. The
 * short-lets are the dots on the map, so their line carries the dots' shade, and how full they are is drawn
 * again as a bar in it along the card's foot.
 */
function Figures({ area }: { area: TourArea }) {
  if (!quoted(area)) return null;
  const step = stepOf(area.occupied);
  return (
    <>
      <b>{area.name}</b>
      <Line of={"Short\u2011let"} n={area.count} mark={step}>
        <em>{euro(area.rate)}</em>
        <small> a night</small>
      </Line>
      {area.rent && (
        <Line of={"Long\u2011let"} n={area.rent.count}>
          {median(area.rent, "a month")}
        </Line>
      )}
      {area.sale && (
        <Line of="For sale" n={area.sale.count}>
          {median(area.sale)}
        </Line>
      )}
      <i data-step={step} data-occ={`${pct(area.occupied)} occupancy`} style={{ "--full": `${Math.round(area.occupied)}%` } as React.CSSProperties} />
    </>
  );
}

/** The same, said in a sentence for a reader who cannot see the card. */
const spoken = (a: TourArea & { occupied: number; rate: number }) =>
  [
    `${int(a.count)} short\u2011lets, ${pct(a.occupied)} occupancy this season, ${euro(a.rate)} a night`,
    a.rent && `${int(a.rent.count)} long\u2011lets${a.rent.median != null ? `, ${euro(a.rent.median)} a month` : ""}`,
    a.sale && `${int(a.sale.count)} homes for sale${a.sale.median != null ? `, ${euro(a.sale.median)} asked` : ""}`,
  ]
    .filter(Boolean)
    .join("; ");

/**
 * The first screen's picture: a tour of drawn town maps that runs by itself. On each, the short-lets there appear
 * as dots; then a pointer draws one area after another round a few streets, the listings inside each light in a
 * wave from where its line closed while the rest of the town steps back, and how full and how dear they are is
 * pinned beside it; then the map moves on to the next town. The first town is complete when the page arrives.
 * Below 1024px the map is a band that shows part of a town: it is centred on the area being drawn and moves on
 * with the pointer, and the figures of the area drawn last are docked in its corner. The tour waits while the
 * visitor is typing in the search box or the picture is out of view, stops at the Pause control until it is
 * pressed again, and does not run with reduced motion. Its styles are in app/landing-hero.css.
 */
export default function TownTour({ stops, demo }: { stops: TourStop[]; demo: boolean }) {
  const [stopAt, setStopAt] = useState(0);
  // The stop that was showing before this one: its map leaves as this one's arrives.
  const [was, setWas] = useState<number | null>(null);
  // How many of this stop's areas are drawn and have their figures up.
  const [drawn, setDrawn] = useState(stops[0].areas.length);
  // The area the band is centred on, below 1024px: the one being drawn, or the last.
  const [aim, setAim] = useState(stops[0].areas.length - 1);
  const [leaving, setLeaving] = useState(false);
  const [stopped, setStopped] = useState(false);
  // True once the tour has moved: from then a stop plays its whole sequence. The first is complete on arrival.
  const [toured, setToured] = useState(false);
  // Each town's listings as dots, by its place in the tour: made when the town is next, not before.
  const [dots, setDots] = useState<Record<number, Dots>>({});
  // True once the page has settled and the tour is going to move: only then is the next town's map fetched.
  const [ahead, setAhead] = useState(false);
  // True where the map is shown whole, with every area's figures pinned on it (from 1024px).
  const [wide, setWide] = useState(true);
  // True for a visitor who has asked for no motion: the first town stays, and there is no tour to pause.
  const [still, setStill] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const over = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<HTMLSpanElement>(null);
  const drawing = useRef<Animation | null>(null);
  const maps = useRef<Record<number, HTMLImageElement | null>>({});
  const asked = useRef(new Set<number>());
  const clock = useRef(0);
  const seen = useRef(true);
  const stop = stops[stopAt];
  const next = (stopAt + 1) % stops.length;

  // When each of the stop's areas starts being drawn and is closed, and when the stop ends.
  const times = useMemo(() => {
    const set = wide ? SET_MS : SET_BAND_MS;
    let t = DRAW_AT;
    const areas = stop.areas.map((a) => {
      const from = t;
      const closed = from + a.ring.length * CORNER_MS;
      t = closed + set + MOVE_MS;
      return { from, closed };
    });
    return { areas, set, end: t - MOVE_MS + HOLD_MS };
  }, [stop, wide]);

  // The listings on a town's map: where each is, how full, and which of the town's areas it is inside. They are
  // made for the town showing and, once the tour is going to move, for the next one, so a visitor is not sent
  // every town's map before they have seen the first.
  useEffect(() => {
    for (const i of ahead ? [stopAt, next] : [stopAt]) {
      if (asked.current.has(i)) continue;
      asked.current.add(i);
      const s = stops[i];
      Promise.all([listingPoints(), waterOf(s.src)])
        .then(([points, water]) => {
          const found: Found[] = [];
          for (const p of points) {
            const x = (p.lng - s.west) * s.perLng;
            const y = (s.north - p.lat) * s.perLat;
            if (x <= 0 || x >= s.size || y <= 0 || y >= s.size) continue;
            const k = s.areas.findIndex((a) => inPolygon(x, y, a.ring));
            if (k >= 0 || !water(x, y, s.size)) found.push([x, y, stepOf(p.effOccTodate), k < 0 ? OUT : k]);
          }
          const kept = [
            ...s.areas.flatMap((_, k) => {
              const own = found.filter((d) => d[3] === k);
              return own.length <= SPARSE ? own : thin(spread(own, CELL), MOST_IN);
            }),
            ...thin(spread(found.filter((d) => d[3] === OUT), CELL / 2), MOST_OUT),
          ];
          // The wave crosses each area from its first corner, where the line closes, at the pace that takes it to
          // the area's farthest corner in WAVE_MS: a listing lights after its share of that reach.
          const reach = s.areas.map(({ ring: [[x0, y0], ...rest] }) => Math.max(1, ...rest.map(([x, y]) => Math.hypot(x - x0, y - y0))));
          const made: Dots = {
            x: Float32Array.from(kept, (d) => d[0]),
            y: Float32Array.from(kept, (d) => d[1]),
            step: Uint8Array.from(kept, (d) => d[2]),
            area: Uint8Array.from(kept, (d) => d[3]),
            // Each arrives a moment after its neighbour to the west, with a little unevenness.
            late: Float32Array.from(kept, (d, k) => (d[0] / s.size) * 700 + ((k * 37) % 11) * 12),
            wave: Float32Array.from(kept, ([x, y, , k]) => {
              if (k === OUT) return 0;
              const [x0, y0] = s.areas[k].ring[0];
              return Math.min(1, Math.hypot(x - x0, y - y0) / reach[k]) * WAVE_MS;
            }),
            n: kept.length,
          };
          setDots((all) => ({ ...all, [i]: made }));
        })
        // Without the listings the map, its areas and their figures are still there. Asked again next time round.
        .catch(() => asked.current.delete(i));
    }
  }, [stops, stopAt, next, ahead]);

  useEffect(() => {
    const none = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(none);
    setAhead(!none);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => (seen.current = entry.isIntersecting), { threshold: 0.2 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  // The stop's clock, the dots, and the move to the next town. The clock only runs while the picture is in view,
  // the page is showing, and the visitor is neither typing in the search box nor has stopped the tour.
  const mine = dots[stopAt] ?? null;
  useEffect(() => {
    const d = mine;
    // The tour does not leave a town until the next one's map has come: it never shows areas on bare paper.
    const ready = () => maps.current[next]?.complete ?? false;
    const paint = (t: number) => {
      const cv = canvas.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      const side = cv.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(side * dpr)) cv.width = cv.height = Math.round(side * dpr);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!d || !side) return;
      const css = getComputedStyle(cv);
      const tone = (name: string) => css.getPropertyValue(name).trim();
      const steps = [tone("--th-dot"), tone("--th-occ-1"), tone("--th-occ-2"), tone("--th-occ-3"), tone("--th-occ-4")];
      const k = (side / stop.size) * dpr;
      const gone = t > times.end ? Math.max(0, 1 - (t - times.end) / OUT_MS) : 1;
      // The town steps back once the first area has closed, and comes forward again as the stop leaves.
      const first = times.areas[0]?.closed ?? Infinity;
      const back = t > times.end ? Math.max(0, 1 - (t - times.end) / OUT_MS) : Math.min(1, Math.max(0, (t - first) / RECEDE_MS));
      // On arrival the first town is complete: its listings are simply there, in their colours (it is painted at
      // the end of its stop, past every listing's moment).
      const shown = (i: number) => (toured ? Math.min(1, Math.max(0, (t - DOTS_AT - d.late[i]) / 240)) : 1);
      // How far into its pop a listing inside an area is: below 0 the wave has not reached it, from 1 it is settled.
      const into = (i: number) => (t - times.areas[d.area[i]].closed - d.wave[i]) / POP_MS;
      const grey = tone("--th-dot-out");
      const edge = tone("--th-occ-ring");
      // Grey: the listings outside every area and those inside one the wave has not reached yet, all stepped
      // back once the first area is closed, so the wave lifts each listing from the receded town into colour and
      // nothing hints at where the next area will be before the pen gets there.
      ctx.fillStyle = grey;
      for (let pass = 0; pass < 2; pass++) {
        const inside = pass === 1;
        ctx.globalAlpha = gone * (1 - (1 - RECEDE_TO) * back);
        ctx.beginPath();
        for (let i = 0; i < d.n; i++) {
          if ((d.area[i] !== OUT) !== inside || (inside && into(i) >= 0)) continue;
          const a = shown(i);
          if (a <= 0) continue;
          const r = 1.75 * dpr * a;
          ctx.moveTo(d.x[i] * k + r, d.y[i] * k);
          ctx.arc(d.x[i] * k, d.y[i] * k, r, 0, 6.2832);
        }
        ctx.fill();
      }
      // The ring each listing sends out as the wave reaches it: it widens quickly from the dot's edge and fades.
      // Each has its own strength, so each is a stroke of its own; only the listings mid-pop draw one.
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.2 * dpr;
      for (let i = 0; i < d.n; i++) {
        if (d.area[i] === OUT) continue;
        const p = into(i);
        if (p < 0 || p >= 1) continue;
        const r = (3.8 + 5.2 * outExpo(p)) * dpr;
        ctx.globalAlpha = gone * (1 - p);
        ctx.beginPath();
        ctx.arc(d.x[i] * k, d.y[i] * k, r, 0, 6.2832);
        ctx.stroke();
      }
      ctx.globalAlpha = gone;
      // Inside an area, once lit: the dark ring first, then each shade of "how full" over it. A listing mid-pop
      // swells to 1.7 times its size and settles back, its dark edge going with it.
      for (let pass = -1; pass < steps.length; pass++) {
        ctx.fillStyle = pass < 0 ? edge : steps[pass];
        ctx.beginPath();
        for (let i = 0; i < d.n; i++) {
          if (d.area[i] === OUT || (pass >= 0 && d.step[i] !== pass)) continue;
          const p = into(i);
          if (p < 0) continue;
          const swell = p >= 1 ? 1 : 1 + 0.7 * Math.sin(Math.PI * outExpo(p));
          const r = (2.8 * swell + (pass < 0 ? 1 : 0)) * dpr * shown(i);
          if (r <= 0) continue;
          ctx.moveTo(d.x[i] * k + r, d.y[i] * k);
          ctx.arc(d.x[i] * k, d.y[i] * k, r, 0, 6.2832);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    if (still || stopped || !toured) {
      // Nothing is moving on the map: the first town on arrival, a stopped tour, or no motion at all.
      const whole = !toured || still ? times.end : clock.current;
      over.current?.toggleAttribute("data-waiting", stopped && toured);
      paint(whole);
      const ro = new ResizeObserver(() => paint(whole));
      if (canvas.current) ro.observe(canvas.current);
      if (still || stopped) return () => ro.disconnect();
      // The first town holds as it arrived, then leaves as every other does and the tour sets off.
      const hold = window.setInterval(() => {
        const typing = document.activeElement?.matches(".lh-box input") ?? false;
        if (!seen.current || document.hidden || typing) return;
        if (clock.current >= FIRST_MS && !ready()) return;
        clock.current += 100;
        if (clock.current >= FIRST_MS) setLeaving(true);
        if (clock.current >= FIRST_MS + OUT_MS) go();
      }, 100);
      return () => {
        ro.disconnect();
        window.clearInterval(hold);
      };
    }
    let raf = 0;
    let last = performance.now();
    let out = false;
    let done = -1;
    let aimed = -1;
    const tick = (now: number) => {
      const typing = document.activeElement?.matches(".lh-box input") ?? false;
      const waiting = !seen.current || document.hidden || typing;
      if (!waiting && !(clock.current >= times.end && !ready())) clock.current += Math.min(64, now - last);
      last = now;
      over.current?.toggleAttribute("data-waiting", waiting);
      const t = clock.current;
      paint(t);
      if (drawing.current) drawing.current.currentTime = t;
      const n = times.areas.filter((a) => t >= a.closed + PIN_AT).length;
      if (n !== done) setDrawn((done = n));
      const going = times.areas.filter((a, k) => k === 0 || t >= times.areas[k - 1].closed + times.set).length - 1;
      if (going !== aimed) setAim((aimed = going));
      if (t > times.end && !out) {
        out = true;
        setLeaving(true);
      }
      if (t > times.end + OUT_MS) return go();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `go` and `paint` are the stop's own: the effect is the stop's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAt, mine, stopped, toured, still, times]);

  function go() {
    setWas(stopAt);
    setStopAt((stopAt + 1) % stops.length);
    setDrawn(0);
    setAim(0);
    setLeaving(false);
    setToured(true);
    clock.current = 0;
  }

  // What is drawn over the map is in the map's units; its lines are told how many units a screen pixel is, so
  // they keep one width whatever size the map is shown at.
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const measure = () => el.clientWidth && el.style.setProperty("--u", String(stop.size / el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stop.size]);

  // The pointer goes round each area's corners in turn as it is drawn, then steps off the map. Its path is laid
  // out once for the stop and held; the stop's clock moves it, so it waits whenever the clock does.
  useEffect(() => {
    const el = pointer.current;
    if (!el || !toured) return;
    const start = DRAW_AT - POINTER_IN;
    const total = times.end - HOLD_MS + POINTER_IN - start;
    const frames: Keyframe[] = [];
    stop.areas.forEach((a, k) => {
      // Round the corners and back to the first, where it rests while the area sets.
      const ring = [...a.ring, a.ring[0], a.ring[0]];
      ring.forEach(([x, y], j) => {
        const when = j > a.ring.length ? times.areas[k].closed + times.set : times.areas[k].from + j * CORNER_MS;
        frames.push({ left: pc(x, stop.size), top: pc(y, stop.size), opacity: 1, offset: (when - start) / total });
      });
    });
    const anim = el.animate([{ ...frames[0], opacity: 0, offset: 0 }, ...frames, { ...frames[frames.length - 1], opacity: 0, offset: 1 }], {
      duration: total,
      delay: start,
      fill: "both",
      easing: "linear",
    });
    anim.pause();
    drawing.current = anim;
    return () => {
      anim.cancel();
      drawing.current = null;
    };
  }, [stopAt, toured, stop, times]);

  // The area drawn last: below 1024px it is the one whose figures show.
  const now = Math.min(stop.areas.length, drawn) - 1;
  const current = stop.areas[Math.max(0, now)];
  // Where the band is centred on each town's map: the area in hand on this one, the last area on the one that is
  // leaving (it stays as it was), the first on the others (so each arrives already in place).
  const focus = (s: TourStop, i: number) => {
    const [x, y] = middle(s.areas[i === stopAt ? Math.min(aim, s.areas.length - 1) : i === was ? s.areas.length - 1 : 0].ring);
    return { "--fx": pc(x, s.size), "--fy": pc(y, s.size) } as React.CSSProperties;
  };
  // The band moves from one area to the next, but arrives on a town's first without moving.
  const pan = aim > 0 && toured ? "" : undefined;

  return (
    <div ref={root} className="lh-town">
      <div className="lh-frame">
        {/* The drawings alone fade into the paper. What is drawn over them is on a sheet of its own, in the same
            square, so no corner or card fades with them. */}
        <div className="lh-sheet">
          {/* Three maps at most are in the page: the town showing, the one it took over from, which is still
              leaving, and the next, which is fetched while this one plays. */}
          {stops.map(
            (s, i) =>
              (i === stopAt || i === was || (ahead && i === next)) && (
            // eslint-disable-next-line @next/next/no-img-element -- static vector drawings, sized by the stylesheet
            <img
              key={s.key}
              ref={(el) => {
                maps.current[i] = el;
              }}
              className="lh-map"
              src={s.src}
              alt=""
              width={s.size}
              height={s.size}
              data-on={i === stopAt ? "" : undefined}
              data-was={i === was ? "" : undefined}
              data-pan={i === stopAt ? pan : undefined}
              style={focus(s, i)}
              decoding="async"
            />
              ),
          )}
        </div>
        <div ref={over} className="lh-over" aria-hidden="true">
          <div ref={sheet} className="lh-map" data-pan={pan} style={focus(stop, stopAt)}>
            <canvas ref={canvas} className="lh-dots" data-leaving={leaving ? "" : undefined} />
            {/* Keyed by the stop, so each town's areas, corners and figures arrive afresh. */}
            <div key={stopAt} className="lh-stop" data-leaving={leaving ? "" : undefined} data-arrived={toured ? undefined : ""}>
              <svg viewBox={`0 0 ${stop.size} ${stop.size}`}>
                {stop.areas.map((a, k) => (
                  <g
                    key={a.name}
                    data-drawn={k < drawn ? "" : undefined}
                    data-now={k === now ? "" : undefined}
                    style={{ "--draw": `${times.areas[k].from}ms`, "--drawing": `${a.ring.length * CORNER_MS}ms` } as React.CSSProperties}
                  >
                    <path className="lh-area-fill" d={path(a.ring)} />
                    <path className="lh-area" d={path(a.ring)} pathLength={1} />
                    {quoted(a) && <path className="lh-lead" d={`M${a.ring[a.from].join(" ")}L${a.to.join(" ")}`} />}
                  </g>
                ))}
              </svg>
              {stop.areas.flatMap((a, k) =>
                a.ring.map((p, j) => (
                  <i
                    key={`${k}.${j}`}
                    className="lh-node"
                    style={{ ...at(p, stop.size), "--at": `${times.areas[k].from + j * CORNER_MS}ms` } as React.CSSProperties}
                  />
                )),
              )}
              <span className="lh-where" style={at(stop.where, stop.size)}>
                {stop.town}
              </span>
              {stop.areas.map(
                (a, k) =>
                  quoted(a) && (
                    <p key={a.name} className="lh-pin m-0" data-side={a.side} data-drawn={k < drawn ? "" : undefined} style={at(a.at, stop.size)}>
                      <Figures area={a} />
                    </p>
                  ),
              )}
              <span ref={pointer} className="lh-pointer">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 2.5v15l4.2-3.9 2.9 6 2.7-1.3-2.9-5.9h5.6z" />
                </svg>
              </span>
            </div>
          </div>
          {/* Below 1024px the band shows part of the town, so its name is in the band's corner, and the figures
              are not pinned on the map: the last area drawn says its own here, for as long as the band stays on
              it. When the band moves on to the next area the figures go, and that area's come once it is drawn. */}
          <span key={stopAt} className="lh-where lh-named" data-leaving={leaving ? "" : undefined}>
            {stop.town}
          </span>
          {drawn > 0 && quoted(current) && (
            <p key={`${stopAt}.${current.name}`} className="lh-pin lh-dock m-0" data-drawn="" data-leaving={leaving || aim !== now ? "" : undefined}>
              <Figures area={current} />
            </p>
          )}
        </div>
      </div>
      {/* What the moving picture shows, for a reader who cannot watch it. */}
      <ul className="sr-only">
        {stops.flatMap((s) =>
          s.areas.filter(quoted).map((a) => (
            <li key={`${s.key}.${a.name}`}>
              {s.town}, {a.name}: {spoken(a)}
            </li>
          )),
        )}
      </ul>
      <p className="lh-credit m-0">
        {!still && (
          <button type="button" className="lh-stopper" onClick={() => setStopped((v) => !v)}>
            {stopped ? <Play size={12} strokeWidth={2.4} aria-hidden="true" /> : <Pause size={12} strokeWidth={2.4} aria-hidden="true" />}
            {stopped ? "Play the tour" : "Pause the tour"}
          </button>
        )}
        {/* Which listings the dots are, and what their shades mean, as on the stage's map. */}
        <span className="lh-key">
          <span className="lh-key-of">
            Short&#8209;lets<span className="lh-key-when"> this season</span>:
          </span>
          emptier
          <span className="th-key-dots" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          fuller
          <span className="sr-only">: the short&#8209;lets inside an area are shaded by how full they have been this season</span>
        </span>
        {demo && <span className="th-tag">Demo data</span>}
        <span>
          Map data ©&nbsp;
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a>
          , ©&nbsp;
          <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">
            OpenMapTiles
          </a>
        </span>
      </p>
    </div>
  );
}
