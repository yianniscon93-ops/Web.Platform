"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AreaInfo, InvestStats, PointRow, PolygonCoords, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { usePublishHeroArea } from "@/lib/landing/areaContext";
import { COUNTING, UNREACHABLE, areaName, countLine, int, rateFacts } from "@/lib/landing/areaLines";
import { VIEW_H, VIEW_W, project, unproject, viewOf, zoomedView } from "@/lib/landing/areaView";
import { ArrowRight } from "lucide-react";
import {
  HERO_AREAS,
  ISLAND_AREA,
  PICK_EVENT,
  WHOLE_ISLAND,
  pickedArea,
  stageWindow,
  type DrawnArea,
  type PickedPlace,
  type StageWindow,
} from "@/lib/landing/compare";
import { listingPoints } from "@/lib/landing/listingPoints";
import { inPolygon, type Pt } from "@/lib/landing/polygon";
import AreaMap from "./AreaMap";
import IslandBasemap from "./IslandBasemap";
import ProductPanels, { PRODUCTS, scoped, type AreaFigures, type ProductId } from "./ProductPanels";

/** How long after a release the figures are asked for, so a run of key presses asks once. */
const SETTLE_MS = 300;
/** The first-load choreography is over by now (ms after the hero mounts). */
const INTRO_MS = 2400;
/** The island's own window: every window the stage shows is this one, enlarged and moved. */
const WHOLE = viewOf(ISLAND_AREA);
/** How much of the window's width a picked place's ring spans when the stage turns to it. */
const PICK_SHARE = 0.22;

async function post<T>(path: string, polygon: PolygonCoords, signal: AbortSignal): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ polygon }),
    signal,
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

/**
 * The window for a picked place: the place at its middle, and as far in as leaves its ring that share of the
 * width (so not always one of the map's own steps; plus and minus go on to the next one).
 */
function windowRound(area: DrawnArea): StageWindow {
  const lats = area.polygon.map((p) => p[0]);
  const lngs = area.polygon.map((p) => p[1]);
  // How wide the ring is in the whole island's window, in view units.
  const span = (Math.max(...lngs) - Math.min(...lngs)) * WHOLE.sx;
  const [lat, lng] = area.centre ?? [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  return stageWindow((PICK_SHARE * VIEW_W) / span, lat, lng);
}

/** The gutter stretch of a line to a panel: out of the map, along a shared rail, into the icon. */
function wire(x0: number, y0: number, rail: number, x1: number, y1: number): string {
  const dy = y1 - y0;
  const r = Math.min(10, Math.abs(dy) / 2, rail - x0, x1 - rail);
  if (r < 1) return `M${x0} ${y0}H${x1}`;
  const s = Math.sign(dy);
  return (
    `M${x0} ${y0}H${rail - r}Q${rail} ${y0} ${rail} ${y0 + s * r}` +
    `V${y1 - s * r}Q${rail} ${y1} ${rail + r} ${y1}H${x1}`
  );
}

/**
 * Counts the listings inside the own area of a place the map does not show (the two the head to head
 * compares), as the map counts: those on its street map's land and inside the line. It mounts that place's
 * street map out of sight for the one measurement (the sea is hit-tested against its path) and is removed
 * once it has reported.
 */
function PlaceCount({
  area,
  basemap,
  points,
  onCount,
}: {
  area: DrawnArea;
  basemap: React.ReactNode;
  points: PointRow[];
  onCount: (key: DrawnArea["key"], count: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const svg = ref.current?.querySelector<SVGSVGElement>("svg");
    const sea = ref.current?.querySelector<SVGGeometryElement>("path[data-sea]");
    const shore = ref.current?.querySelector<SVGGeometryElement>("path[data-shore-slack]");
    if (!svg || !sea) return; // No map to measure against: the place stays uncounted.
    const at = svg.createSVGPoint();
    const view = viewOf(area);
    const ring = area.polygon.map(([lat, lng]) => project(view, lat, lng));
    let n = 0;
    for (const p of points) {
      const [x, y] = project(view, p.lat, p.lng);
      if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H || !inPolygon(x, y, ring)) continue;
      at.x = x;
      at.y = y;
      try {
        if (sea.isPointInFill(at) && !shore?.isPointInStroke(at)) continue;
      } catch {
        // A browser that cannot test the point counts it, as AreaMap does.
      }
      n++;
    }
    onCount(area.key, n);
  }, [area, points, onCount]);
  return (
    <div ref={ref} className="th-measure" aria-hidden="true">
      {basemap}
    </div>
  );
}

/**
 * The stage: a heading and one sentence, then a map with a hand-drawn area the
 * visitor can reshape and, beside it, the three products, each made from that
 * area. There is one map, the island, which the visitor can zoom and move; it
 * opens on the whole of it. `basemaps` are the server-rendered street maps
 * (AreaBasemap) of the two places the head to head compares, for their counts.
 */
export default function DrawHero({ basemaps }: { basemaps: Partial<Record<DrawnArea["key"], React.ReactNode>> }) {
  // The map's own area, which Reset goes back to, and the window that shows it: Limassol's on the whole island,
  // or the ring round a place the visitor picked in the first screen's search box, on the ground round it.
  // `pick` counts the picks: each is a map of its own, the same place picked twice included.
  const [base, setBase] = useState<{ area: DrawnArea; areaId?: string; home: StageWindow; pick: number }>({
    area: ISLAND_AREA,
    home: WHOLE_ISLAND,
    pick: 0,
  });
  const baseRef = useRef(base);
  baseRef.current = base;
  const placeKey = base.area.key;
  // The window on the island: how far in, and where its middle is.
  const [win, setWin] = useState<StageWindow>(WHOLE_ISLAND);
  const view = useMemo(() => (win.z === 1 ? WHOLE : zoomedView(WHOLE, win.z, win.lat, win.lng)), [win]);
  const viewRef = useRef(view);
  viewRef.current = view;
  // The area as the map takes it: the map's own, seen through the window as it stands.
  const area = useMemo<DrawnArea>(() => ({ ...base.area, view }), [base, view]);
  // On the island's map the area can be taken anywhere: once moved it is "your area", not "near" where it began.
  const roams = area.frame != null;
  // The area's corners as last released, as [lat, lng], so they keep their ground when the window changes; null
  // while the area is still the map's own.
  const [ring, setRing] = useState<Array<[number, number]> | null>(null);
  const changed = ring != null;
  // The same corners in the window's view units, for the map.
  const verts = useMemo<Pt[]>(
    () => (ring ?? base.area.polygon).map(([lat, lng]) => project(view, lat, lng)),
    [ring, base, view]
  );
  // What the figures are asked for. It does not change with the window, so a zoom or a move asks nothing.
  const polygon = useMemo<PolygonCoords>(
    () => (ring ? ring.map((p) => p.map((v) => Math.round(v * 1e5) / 1e5) as [number, number]) : base.area.polygon),
    [ring, base]
  );

  const [points, setPoints] = useState<PointRow[] | null>(null);
  const [pointsFailed, setPointsFailed] = useState(false);
  // Listings on the map's land inside the area as it stands: the one count the hero quotes.
  const [count, setCount] = useState<number | null>(null);
  // The count for each place's own area as first drawn: the map's for its own, PlaceCount's for the two street places.
  const [own, setOwn] = useState<Partial<Record<DrawnArea["key"], number>>>({});
  // Where the map paints the listings inside the area as last released, for the small map down the page.
  const [dots, setDots] = useState<Array<[number, number, number]> | null>(null);
  const [figures, setFigures] = useState<AreaFigures | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState<ProductId>("playground");
  // True once the visitor has opened a panel: from then an opening panel's icon makes its small move.
  const [lively, setLively] = useState(false);
  const [intro, setIntro] = useState(true);
  const [touched, setTouched] = useState(false);
  // The named area the Playground opens on for the island's own area (Limassol).
  const [islandId, setIslandId] = useState<string | null>(null);
  const [said, setSaid] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const wiresRef = useRef<SVGSVGElement>(null);
  const icons = useRef<Partial<Record<ProductId, HTMLSpanElement | null>>>({});
  const openRef = useRef(open);
  openRef.current = open;
  // Answers already had, by polygon, so going back to a shape (Reset, a place picked again) asks nothing.
  const cache = useRef(new Map<string, AreaFigures>());
  const latest = useRef<AreaFigures | null>(null);
  // Counts the asks, so an answer can tell whether it is still the newest.
  const asked = useRef(0);
  // True until the first ask after mount or a picked place has gone out: that one does not wait.
  const askNow = useRef(true);
  // True once the visitor has moved a corner, drawn or reset the area, or picked a place.
  const acted = useRef(false);
  const countRef = useRef(count);
  countRef.current = count;

  // Every listing, for the dots (the page asks once: the first screen draws from the same answer); and the named
  // areas, so the Playground can open on this place.
  useEffect(() => {
    const ac = new AbortController();
    listingPoints().then(
      (d) => {
        if (!ac.signal.aborted) setPoints(d);
      },
      () => {
        // Without listings the area is still drawn, just with no dots, and the count falls back to the API's.
        if (!ac.signal.aborted) setPointsFailed(true);
      }
    );
    fetch("/api/dashboard/areas", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: AreaInfo[]) => {
        const named = list
          .filter((a) => a.nameEn.toLowerCase() === ISLAND_AREA.name.toLowerCase())
          .sort((a, b) => b.listingCount - a.listingCount)[0];
        if (named) setIslandId(named.areaId);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // The figures for the area as it stands. The first ask after the page loads
  // or a place is picked goes at once; every later one waits SETTLE_MS. Only
  // the newest ask may be shown or kept: one that was overtaken (a newer shape,
  // another place) is aborted and its answer dropped, whatever had arrived.
  useEffect(() => {
    const key = JSON.stringify(polygon);
    const mine = ++asked.current;
    const had = cache.current.get(key);
    if (had) {
      askNow.current = false;
      latest.current = had;
      setFigures(had);
      setStatus("ready");
      setPending(false);
      return;
    }
    const ac = new AbortController();
    const prev = latest.current;
    const current = () => !ac.signal.aborted && mine === asked.current;
    const timer = setTimeout(
      () => {
        askNow.current = false;
        // A figure that is not for the drawn area cannot have changed, so it is not asked for again.
        // A long-let or for-sale ask that fails leaves its column empty; it does not fail the rest.
        const side = <T extends { source: "live" | "demo" }>(old: T | null | undefined, path: string) =>
          old && !scoped(old)
            ? Promise.resolve({ ok: true, value: old as T | null })
            : post<T>(path, polygon, ac.signal).then(
                (value) => ({ ok: true, value: value as T | null }),
                () => ({ ok: false, value: null as T | null })
              );
        Promise.all([
          post<SelectionStats>("/api/dashboard/stats", polygon, ac.signal),
          side<RentalStats>(prev?.rentals, "/api/dashboard/rentals"),
          side<InvestStats>(prev?.invest, "/api/dashboard/invest"),
        ])
          .then(([stats, rentals, invest]) => {
            if (!current()) return;
            const got = { stats, rentals: rentals.value, invest: invest.value };
            // Only a whole answer is kept; with a part missing, the next ask for this shape tries again.
            if (rentals.ok && invest.ok) cache.current.set(key, got);
            latest.current = got;
            setFigures(got);
            setStatus("ready");
            setPending(false);
          })
          .catch(() => {
            if (!current()) return;
            latest.current = null;
            setFigures(null);
            setStatus("error");
            setPending(false);
          });
      },
      askNow.current ? 0 : SETTLE_MS
    );
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [polygon]);

  // Tell assistive tech what the area now holds: once it has come to rest, never while it moves.
  // The region is emptied first, so a release that leaves the same count is still announced.
  useEffect(() => {
    if (!acted.current) return; // nothing to announce on load
    setSaid("");
    const t = setTimeout(() => {
      const name = areaName(area.name, changed, roams);
      setSaid(countRef.current == null ? `Showing ${name}.` : `${countLine(countRef.current)} ${name}.`);
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [polygon, area.name, changed, roams]);

  // The choreography plays once. A visitor who acts sooner ends it early.
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), INTRO_MS);
    return () => clearTimeout(t);
  }, []);

  /** Runs the lines from the map's edge to each panel's icon. Desktop only; the stylesheet hides them below it. */
  const layoutWires = useCallback(() => {
    const root = rootRef.current;
    const svg = wiresRef.current;
    if (!root || !svg || svg.getBoundingClientRect().width === 0) return;
    const port = root.querySelector<HTMLElement>(".th-map-port");
    const anchor = root.querySelector<HTMLElement>(".th-handle[data-anchor]");
    if (!port || !anchor) return;
    const o = root.getBoundingClientRect();
    const p = port.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    // From the corner's height; from the nearest end of the map's edge when the window has left the corner above or below it.
    const y0 = Math.min(p.bottom - 14, Math.max(p.top + 14, a.top + a.height / 2)) - o.top;
    const x0 = Math.round(p.right - o.left);
    const paths = svg.querySelectorAll<SVGPathElement>("path");
    let lead = "";
    PRODUCTS.forEach((id, i) => {
      const icon = icons.current[id]?.getBoundingClientRect();
      if (!icon) return;
      const x1 = icon.left - o.left - 7;
      const d = wire(x0, y0, Math.round((x0 + x1) / 2), x1, Math.round(icon.top + icon.height / 2 - o.top) + 0.5);
      // The open panel's line is drawn once, on top, in the area's colour.
      if (id === openRef.current) lead = d;
      paths[i].setAttribute("d", id === openRef.current ? "" : d);
    });
    paths[PRODUCTS.length].setAttribute("d", lead);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    layoutWires();
    // Panels change height as they open, and the window can resize: both move the icons.
    const ro = new ResizeObserver(layoutWires);
    ro.observe(root);
    root.querySelectorAll(".th-panel").forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [layoutWires]);

  useEffect(layoutWires, [layoutWires, open, verts, placeKey]);

  const onOwnCount = useCallback((key: DrawnArea["key"], n: number) => {
    setOwn((o) => (o[key] === n ? o : { ...o, [key]: n }));
  }, []);
  useEffect(() => {
    if (!changed && count != null) onOwnCount(placeKey, count);
  }, [changed, count, placeKey, onOwnCount]);

  const onCommit = useCallback((next: Pt[], inside: number | null) => {
    acted.current = true;
    // The corners are kept by the ground they stand on, in whatever window they were released.
    const through = viewRef.current;
    setRing(next.map(([x, y]) => unproject(through, x, y)));
    setPending(true);
    setIntro(false);
    if (inside != null) setCount(inside);
  }, []);

  const onTouch = useCallback(() => {
    setTouched(true);
    setIntro(false);
  }, []);

  // The visitor zooms or moves the map. The area and everything said about it stay as they are.
  const onWindow = useCallback((z: number, lat: number, lng: number) => {
    setWin(stageWindow(z, lat, lng));
    setIntro(false);
  }, []);

  // The first screen's search box hands over a place: the stage turns to the ground round it, with an area drawn
  // round the place itself.
  useEffect(() => {
    const on = (e: Event) => {
      const place = (e as CustomEvent<PickedPlace>).detail;
      if (!place || typeof place.lat !== "number" || typeof place.lng !== "number") return;
      const picked = pickedArea(place);
      const home = windowRound(picked);
      acted.current = true;
      askNow.current = true;
      setBase((was) => ({ area: picked, areaId: place.areaId, home, pick: was.pick + 1 }));
      setWin(home);
      setRing(null);
      setCount(null);
      setDots(null);
      setFigures(null);
      latest.current = null;
      setStatus("loading");
      setPending(false);
      setIntro(false);
    };
    window.addEventListener(PICK_EVENT, on);
    return () => window.removeEventListener(PICK_EVENT, on);
  }, []);

  const onReset = useCallback((inside: number | null, inSight: boolean) => {
    acted.current = true;
    setRing(null);
    setPending(true);
    // The map's own area is back, and the visitor should see it: a window that has left it returns to its own.
    if (!inSight) setWin(baseRef.current.home);
    if (inside != null) setCount(inside);
  }, []);

  const iconRef = useCallback(
    (id: ProductId) => (el: HTMLSpanElement | null) => {
      icons.current[id] = el;
    },
    []
  );

  const onOpen = useCallback((id: ProductId) => {
    setOpen(id);
    setLively(true);
  }, []);

  const stats = figures?.stats ?? null;
  // One count everywhere: the listings the map shows inside the line. Only if the listings could
  // not be fetched does the API's own count for this shape stand in.
  const shownCount = count ?? (pointsFailed && stats && !pending ? stats.listingCount : null);
  const facts = shownCount == null ? [] : rateFacts(shownCount, stats);
  // A picked place has two counts: what the list of places gives it, and what the line drawn round it holds.
  // Until the visitor moves a corner the count says both, so the two never seem to disagree.
  const listed = !changed && shownCount != null ? area.listed : undefined;
  const countText =
    shownCount == null
      ? ""
      : listed == null || listed === shownCount
        ? countLine(shownCount)
        : shownCount < listed
          ? `${countLine(shownCount)}, of ${int(listed)} in ${area.name}`
          : `${countLine(shownCount)}; ${area.name} itself has ${int(listed)}`;
  // The Playground opens on a named place: the picked one, or the place the island's own area is drawn on.
  const namedId = placeKey === "PICK" ? base.areaId : islandId;
  const playgroundHref = namedId ? `/dashboard?area=${encodeURIComponent(namedId)}` : "/dashboard";

  // The product sections down the page are about this same area: hand them what the hero knows of it,
  // whenever any of it changes. Publishing does not re-render the hero (it only reads the setter).
  const publish = usePublishHeroArea();
  useEffect(() => {
    publish({
      place: area,
      polygon,
      changed,
      name: areaName(area.name, changed, roams),
      count: shownCount,
      own,
      countsFailed: pointsFailed,
      dots,
      figures,
      pending,
      status,
      playgroundHref,
    });
  }, [publish, area, polygon, changed, roams, shownCount, own, pointsFailed, dots, figures, pending, status, playgroundHref]);

  return (
    <section id="draw" className="th-landing th-hero">
      <div ref={rootRef} className="th-hero-in">
        <h2 className="th-h1 th-stage-h m-0">Draw an area. Get it three ways.</h2>
        <p className="th-lede m-0">
          Zoom in on your part of the island, move the corners of the area, and everything follows: the listings
          inside it, and what the Playground, a report and the Connector say about them.
        </p>
        {/* Phones only: the page's one filled action, in the first screen. From 640px it is in the Playground panel. */}
        <a href={playgroundHref} className="th-go th-go-top">
          Open the Playground, it&apos;s free
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>

        <AreaMap
          // A picked place is another map: its corners, its dots and anything in the hand start again.
          key={`${placeKey}:${base.pick}`}
          area={area}
          // The island's picture, placed for the window: it needs no data, so the stage draws it itself.
          basemap={<IslandBasemap area={area} />}
          zoom={win.z}
          onWindow={onWindow}
          points={points}
          verts={verts}
          changed={changed}
          countText={shownCount != null ? countText : pointsFailed && status === "error" ? UNREACHABLE : COUNTING}
          countPending={shownCount == null}
          // Each fact keeps to one line ("€194 a night" never breaks after "a").
          facts={facts.map((f) => `, ${f.replace(/ /g, "\u00a0")}`).join("")}
          factsPending={pending}
          demo={stats?.source === "demo"}
          intro={intro}
          cue={!touched}
          name={areaName(area.name, changed, roams)}
          onCommit={onCommit}
          onLiveMove={layoutWires}
          onCount={setCount}
          onDots={setDots}
          onTouch={onTouch}
          onReset={onReset}
        />

        <ProductPanels
          place={area.name}
          changed={changed}
          roams={roams}
          count={shownCount}
          figures={figures}
          status={status}
          pending={pending}
          playgroundHref={playgroundHref}
          open={open}
          lively={lively}
          onOpen={onOpen}
          iconRef={iconRef}
        />

        {/* The lines from the area to the products. Their paths are measured, so they are set by layoutWires. */}
        <svg ref={wiresRef} className="th-wires" data-intro={intro ? "" : undefined} aria-hidden="true">
          {PRODUCTS.map((id) => (
            <path key={id} pathLength={1} />
          ))}
          <path className="th-wire-on" pathLength={1} />
        </svg>

        <p className="sr-only" role="status" aria-live="polite">
          {said}
        </p>

        {/* The two street places' own counts, measured once the listings are in. */}
        {points &&
          HERO_AREAS.filter((a) => own[a.key] == null).map((a) => (
            <PlaceCount key={a.key} area={a} basemap={basemaps[a.key]} points={points} onCount={onOwnCount} />
          ))}
      </div>
    </section>
  );
}
