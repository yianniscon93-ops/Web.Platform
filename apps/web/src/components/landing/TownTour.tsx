"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { euro, int, pct } from "@/lib/landing/areaLines";
import { listingPoints } from "@/lib/landing/listingPoints";
import { inPolygon } from "@/lib/landing/polygon";
import type { TourArea, TourStop, TownPt } from "@/lib/landing/tour";

// One stop, in ms from the moment its map starts to arrive.
const DOTS_AT = 400; // the listings start to appear, west to east
const DRAW_AT = 1100; // the pointer starts on the first area's first corner
const CORNER_MS = 170; // from one corner to the next
// After an area closes it sets (its listings light, its figures are pinned) and stays to be read. Below 1024px
// the figures are only up while the band is on their area, so there the stay is longer.
const SET_MS = 1100;
const SET_BAND_MS = 1700;
const MOVE_MS = 500; // the pointer goes on to the next area's first corner, and below 1024px the map follows it
const HOLD_MS = 2200; // everything stays once the last figures have been read
const OUT_MS = 450; // the areas, their figures and the listings leave
const FIRST_MS = 3600; // how long the town the page arrives on, already complete, stays
const POINTER_IN = 250; // the pointer shows on the first corner this long before it moves
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

/** The dots of one map. `area` is the area a listing is inside (its index), or 255 for none. */
type Dots = { x: Float32Array; y: Float32Array; step: Uint8Array; area: Uint8Array; late: Float32Array; n: number };
const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
const at = ([x, y]: TownPt, size: number) => ({ "--x": pc(x, size), "--y": pc(y, size) }) as React.CSSProperties;
const path = (ring: TownPt[]) => "M" + ring.map((p) => p.join(" ")).join("L") + "Z";
const middle = (ring: TownPt[]): TownPt => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

/** An area with too few listings to quote is drawn, with no figures. */
const quoted = (a: TourArea): a is TourArea & { occupied: number; rate: number } => a.occupied != null && a.rate != null;

/** An area's figures: how full and how dear, with how full drawn as a bar in the listings' own shade. */
function Figures({ area }: { area: TourArea }) {
  if (!quoted(area)) return null;
  return (
    <>
      <b>
        {area.name}
        <small>{int(area.count)} short&#8209;lets</small>
      </b>
      <span>
        <em>{pct(area.occupied)}</em>
        occupied
      </span>
      <span>
        <em>{euro(area.rate)}</em>a night
      </span>
      <i data-step={stepOf(area.occupied)} style={{ "--full": `${Math.round(area.occupied)}%` } as React.CSSProperties} />
    </>
  );
}

/**
 * The first screen's picture: a tour of drawn town maps that runs by itself. On each, the short-lets there appear
 * as dots; then a pointer draws one area after another round a few streets, the listings inside each take their
 * colours, and how full and how dear they are is pinned beside it; then the map moves on to the next town. The
 * first town is complete when the page arrives. Below 1024px the map is a band that shows part of a town: it is
 * centred on the area being drawn and moves on with the pointer, and the figures of the area drawn last are
 * docked in its corner. The tour waits while the visitor is typing in the search box or the picture is out of
 * view, stops at the Pause control until it is pressed again, and does not run with reduced motion. Its styles
 * are in app/landing-hero.css.
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
  const [dots, setDots] = useState<Dots[] | null>(null);
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
  const clock = useRef(0);
  const seen = useRef(true);
  const stop = stops[stopAt];

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

  // The listings on each town's map, once: where each is, how full, and which of the town's areas it is inside.
  useEffect(() => {
    let live = true;
    Promise.all([listingPoints(), Promise.all(stops.map((s) => waterOf(s.src)))])
      .then(([points, water]) => {
        if (!live) return;
        setDots(
          stops.map((s, i) => {
            const found: Found[] = [];
            for (const p of points) {
              const x = (p.lng - s.west) * s.perLng;
              const y = (s.north - p.lat) * s.perLat;
              if (x <= 0 || x >= s.size || y <= 0 || y >= s.size) continue;
              const k = s.areas.findIndex((a) => inPolygon(x, y, a.ring));
              if (k >= 0 || !water[i](x, y, s.size)) found.push([x, y, stepOf(p.effOccTodate), k < 0 ? OUT : k]);
            }
            const kept = [
              ...s.areas.flatMap((_, k) => {
                const own = found.filter((d) => d[3] === k);
                return own.length <= SPARSE ? own : thin(spread(own, CELL), MOST_IN);
              }),
              ...thin(spread(found.filter((d) => d[3] === OUT), CELL / 2), MOST_OUT),
            ];
            return {
              x: Float32Array.from(kept, (d) => d[0]),
              y: Float32Array.from(kept, (d) => d[1]),
              step: Uint8Array.from(kept, (d) => d[2]),
              area: Uint8Array.from(kept, (d) => d[3]),
              // Each arrives a moment after its neighbour to the west, with a little unevenness.
              late: Float32Array.from(kept, (d, k) => (d[0] / s.size) * 700 + ((k * 37) % 11) * 12),
              n: kept.length,
            };
          }),
        );
      })
      .catch(() => {}); // Without the listings the maps, areas and figures are still there.
    return () => {
      live = false;
    };
  }, [stops]);

  useEffect(() => setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

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
  useEffect(() => {
    const d = dots?.[stopAt] ?? null;
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
      // On arrival the first town is complete: its listings are simply there, in their colours.
      const shown = (i: number) => (toured ? Math.min(1, Math.max(0, (t - DOTS_AT - d.late[i]) / 240)) : 1);
      const lit = (i: number) => {
        if (d.area[i] === OUT) return 0;
        if (!toured) return 1;
        return Math.min(1, Math.max(0, (t - times.areas[d.area[i]].closed - (i % 7) * 28) / 220));
      };
      ctx.globalAlpha = gone;
      ctx.fillStyle = tone("--th-dot-out");
      ctx.beginPath();
      for (let i = 0; i < d.n; i++) {
        const a = shown(i);
        if (a <= 0 || lit(i) >= 1) continue;
        const r = 1.75 * dpr * a;
        ctx.moveTo(d.x[i] * k + r, d.y[i] * k);
        ctx.arc(d.x[i] * k, d.y[i] * k, r, 0, 6.2832);
      }
      ctx.fill();
      // Inside an area: the dark ring first, then each shade of "how full" over it.
      for (let pass = -1; pass < steps.length; pass++) {
        ctx.fillStyle = pass < 0 ? tone("--th-occ-ring") : steps[pass];
        ctx.beginPath();
        for (let i = 0; i < d.n; i++) {
          if (pass >= 0 && d.step[i] !== pass) continue;
          const b = lit(i) * shown(i);
          if (b <= 0) continue;
          const r = (pass < 0 ? 3.8 : 2.8) * dpr * b;
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
      if (!waiting) clock.current += Math.min(64, now - last);
      last = now;
      over.current?.toggleAttribute("data-waiting", waiting);
      const t = clock.current;
      paint(t);
      if (drawing.current) drawing.current.currentTime = t;
      const n = times.areas.filter((a) => t >= a.closed + 120).length;
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
  }, [stopAt, dots, stopped, toured, still, times]);

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
          {stops.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- static vector drawings, sized by the stylesheet
            <img
              key={s.key}
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
          ))}
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
              {s.town}, {a.name}: {pct(a.occupied)} occupied, {euro(a.rate)} a night, {int(a.count)} short&#8209;lets
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
        {/* What the shades of the listings inside an area mean, as on the stage's map. */}
        <span className="lh-key">
          emptier
          <span className="th-key-dots" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          fuller
          <span className="sr-only">: listings inside an area are shaded by how full they have been this season</span>
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
