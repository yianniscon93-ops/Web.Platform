"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AreaInfo, InvestStats, PointRow, PolygonCoords, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { usePublishHeroArea } from "@/lib/landing/areaContext";
import { COUNTING, UNREACHABLE, areaName, countLine, rateFacts } from "@/lib/landing/areaLines";
import { VIEW_H, VIEW_W, areaView, project, unproject } from "@/lib/landing/areaView";
import { ArrowRight } from "lucide-react";
import { HERO_AREAS, type DrawnArea } from "@/lib/landing/compare";
import { inPolygon, type Pt } from "@/lib/landing/polygon";
import AreaMap from "./AreaMap";
import ProductPanels, { PRODUCTS, scoped, type AreaFigures, type ProductId } from "./ProductPanels";

/** How long after a release the figures are asked for, so a run of key presses asks once. */
const SETTLE_MS = 300;
/** The first-load choreography is over by now (ms after the hero mounts). */
const INTRO_MS = 2400;

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

/** The corners of a place's area as first drawn, in its street map's view units. */
function originalVerts(area: DrawnArea): Pt[] {
  const view = areaView(area.polygon);
  return area.polygon.map(([lat, lng]) => project(view, lat, lng));
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
 * Counts the listings inside a place's own area for a place the map is not showing, exactly as the map
 * would: those on its street map's land and inside the line. It mounts that place's street map out of
 * sight for the one measurement (the sea is hit-tested against its path) and is removed once it has
 * reported. So the page has one count per place, whichever is on the map.
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
    if (!svg || !sea) return; // No street map to measure against: the place stays uncounted.
    const at = svg.createSVGPoint();
    const view = areaView(area.polygon);
    const ring = area.polygon.map(([lat, lng]) => project(view, lat, lng));
    let n = 0;
    for (const p of points) {
      const [x, y] = project(view, p.lat, p.lng);
      if (x < 0 || x > VIEW_W || y < 0 || y > VIEW_H || !inPolygon(x, y, ring)) continue;
      at.x = x;
      at.y = y;
      try {
        if (sea.isPointInFill(at)) continue;
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
 * The landing hero: a headline and one sentence, then the stage. On the left
 * a street map with a hand-drawn area the visitor can reshape; on the right
 * the three products, each made from that area. `basemaps` are the
 * server-rendered street maps (AreaBasemap), one per place.
 */
export default function DrawHero({ basemaps }: { basemaps: Record<DrawnArea["key"], React.ReactNode> }) {
  const [placeKey, setPlaceKey] = useState<DrawnArea["key"]>(HERO_AREAS[0].key);
  const area = HERO_AREAS.find((a) => a.key === placeKey)!;
  const original = useMemo(() => originalVerts(area), [area]);
  // The area's corners as last released; null while it is still the place's own.
  const [moved, setMoved] = useState<Pt[] | null>(null);
  const verts = moved ?? original;
  const changed = moved != null;
  const polygon = useMemo<PolygonCoords>(() => {
    if (!moved) return area.polygon;
    const view = areaView(area.polygon);
    return moved.map(([x, y]) => unproject(view, x, y).map((v) => Math.round(v * 1e5) / 1e5) as [number, number]);
  }, [area, moved]);

  const [points, setPoints] = useState<PointRow[] | null>(null);
  const [pointsFailed, setPointsFailed] = useState(false);
  // Listings on the map's land inside the area as it stands: the one count the hero quotes.
  const [count, setCount] = useState<number | null>(null);
  // The count for each place's own area as first drawn: the map's for the place it shows, PlaceCount's for the other.
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
  const [areaIds, setAreaIds] = useState<Record<string, string>>({});
  const [said, setSaid] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const wiresRef = useRef<SVGSVGElement>(null);
  const icons = useRef<Partial<Record<ProductId, HTMLSpanElement | null>>>({});
  const openRef = useRef(open);
  openRef.current = open;
  // Answers already had, by polygon, so going back to a shape (Reset, the other place) asks nothing.
  const cache = useRef(new Map<string, AreaFigures>());
  const latest = useRef<AreaFigures | null>(null);
  // Counts the asks, so an answer can tell whether it is still the newest.
  const asked = useRef(0);
  // True until the first ask after mount or a place switch has gone out: that one does not wait.
  const askNow = useRef(true);
  // True once the visitor has moved a corner, reset the area or switched place.
  const acted = useRef(false);
  const countRef = useRef(count);
  countRef.current = count;

  // Every listing, for the dots; and the named areas, so the Playground can open on this place.
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/dashboard/points", { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`points ${r.status}`);
        return r.json();
      })
      .then((d: PointRow[]) => setPoints(d))
      .catch(() => {
        // Without listings the area is still drawn, just with no dots, and the count falls back to the API's.
        if (!ac.signal.aborted) setPointsFailed(true);
      });
    fetch("/api/dashboard/areas", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: AreaInfo[]) => {
        const ids: Record<string, string> = {};
        for (const place of HERO_AREAS) {
          const named = list
            .filter((a) => a.nameEn.toLowerCase() === place.name.toLowerCase())
            .sort((a, b) => b.listingCount - a.listingCount)[0];
          if (named) ids[place.key] = named.areaId;
        }
        setAreaIds(ids);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // The figures for the area as it stands. The first ask after the page loads
  // or the place changes goes at once; every later one waits SETTLE_MS. Only
  // the newest ask may be shown or kept: one that was overtaken (a newer shape,
  // the other place) is aborted and its answer dropped, whatever had arrived.
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
      const name = areaName(area.name, changed);
      setSaid(countRef.current == null ? `Showing ${name}.` : `${countLine(countRef.current)} ${name}.`);
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [polygon, area.name, changed]);

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
    const y0 = a.top + a.height / 2 - o.top;
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
    setMoved(next);
    setPending(true);
    setIntro(false);
    if (inside != null) setCount(inside);
  }, []);

  const onTouch = useCallback(() => {
    setTouched(true);
    setIntro(false);
  }, []);

  const onPlace = useCallback((key: DrawnArea["key"]) => {
    acted.current = true;
    askNow.current = true;
    setPlaceKey(key);
    setMoved(null);
    setCount(null);
    setDots(null);
    setFigures(null);
    latest.current = null;
    setStatus("loading");
    setPending(false);
    setIntro(false);
  }, []);

  const onReset = useCallback((inside: number | null) => {
    acted.current = true;
    setMoved(null);
    setPending(true);
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
  const playgroundHref = areaIds[placeKey] ? `/dashboard?area=${encodeURIComponent(areaIds[placeKey])}` : "/dashboard";

  // The product sections down the page are about this same area: hand them what the hero knows of it,
  // whenever any of it changes. Publishing does not re-render the hero (it only reads the setter).
  const publish = usePublishHeroArea();
  useEffect(() => {
    publish({
      place: area,
      polygon,
      changed,
      name: areaName(area.name, changed),
      count: shownCount,
      own,
      countsFailed: pointsFailed,
      dots,
      figures,
      pending,
      status,
      playgroundHref,
    });
  }, [publish, area, polygon, changed, shownCount, own, pointsFailed, dots, figures, pending, status, playgroundHref]);

  return (
    <section className="th-landing th-hero">
      <div ref={rootRef} className="th-hero-in">
        <h1 className="th-h1 m-0">The whole Cyprus property market, down to the street.</h1>
        <p className="th-lede m-0">
          We read every short&#8209;let, long&#8209;let and for&#8209;sale listing in Cyprus, every day. Explore it
          free in the Playground, have us write it up as a report, or ask it in Claude.
        </p>
        {/* Phones only: the page's one filled action, in the first screen. From 640px it is in the Playground panel. */}
        <a href={playgroundHref} className="th-go th-go-top">
          Open the Playground, it&apos;s free
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>

        <AreaMap
          key={placeKey}
          area={area}
          places={HERO_AREAS}
          onPlace={onPlace}
          basemap={basemaps[placeKey]}
          points={points}
          verts={verts}
          changed={changed}
          countText={shownCount != null ? countLine(shownCount) : pointsFailed && status === "error" ? UNREACHABLE : COUNTING}
          countPending={shownCount == null}
          // Each fact keeps to one line ("€194 a night" never breaks after "a").
          facts={facts.map((f) => `, ${f.replace(/ /g, "\u00a0")}`).join("")}
          factsPending={pending}
          demo={stats?.source === "demo"}
          intro={intro}
          cue={!touched}
          name={areaName(area.name, changed)}
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

        {/* The other place's own count, measured once the listings are in. */}
        {points &&
          HERO_AREAS.filter((a) => a.key !== placeKey && own[a.key] == null).map((a) => (
            <PlaceCount key={a.key} area={a} basemap={basemaps[a.key]} points={points} onCount={onOwnCount} />
          ))}
      </div>
    </section>
  );
}
