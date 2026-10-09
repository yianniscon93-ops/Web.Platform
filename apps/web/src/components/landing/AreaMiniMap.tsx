"use client";

import type { PolygonCoords } from "@/lib/dashboard/types";
import { VIEW_H, VIEW_W, viewOf, project, unproject, zoomedView } from "@/lib/landing/areaView";
import { ISLAND_AREA, ZOOM_LEVELS, type DrawnArea } from "@/lib/landing/compare";
import { ringPath, type Pt } from "@/lib/landing/polygon";
import IslandBasemap from "./IslandBasemap";

// A listing's dot, in view units: the small map shows about half a pixel to the unit.
const DOT = 4.2;
// The island's own window, which every window of the stage's map enlarges.
const WHOLE = viewOf(ISLAND_AREA);
// Share of the view's limiting side the area spans when the small map is fitted round it.
const FIT = 0.56;

/**
 * The drawn area on its map, small and not editable: the picture the
 * connector's "show me on the map" answers with. It is a message in the
 * conversation in its own right, so it takes a bubble's corners and hairline
 * itself. The island is drawn here, for the window the small map shows.
 * `dots` are the listings the hero's map paints inside the line, in the view
 * units of the hero's window.
 */
export default function AreaMiniMap({
  place,
  polygon,
  name,
  dots,
  lively,
}: {
  place: DrawnArea;
  polygon: PolygonCoords;
  name: string;
  dots: Array<[number, number, number]> | null;
  /** It arrives as part of an exchange being played. */
  lively?: boolean;
}) {
  // The same window the hero's map shows, while that has the whole area in it. Once the visitor has zoomed or
  // moved the hero's map off part of it, a window fitted round the area, so the answer still shows all of it.
  const stage = viewOf(place);
  const cut = place.frame != null && polygon.some(([lat, lng]) => {
    const [x, y] = project(stage, lat, lng);
    return x < 0 || x > VIEW_W || y < 0 || y > VIEW_H;
  });
  let view = stage;
  if (cut) {
    const whole = polygon.map(([lat, lng]) => project(WHOLE, lat, lng));
    const xs = whole.map((p) => p[0]);
    const ys = whole.map((p) => p[1]);
    const z = Math.min((FIT * VIEW_W) / (Math.max(...xs) - Math.min(...xs)), (FIT * VIEW_H) / (Math.max(...ys) - Math.min(...ys)));
    const [lat, lng] = unproject(WHOLE, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
    view = zoomedView(WHOLE, Math.min(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], Math.max(1, z)), lat, lng);
  }
  const seen: DrawnArea = cut ? { ...place, view } : place;
  const ring: Pt[] = polygon.map(([lat, lng]) => project(view, lat, lng));
  const outline = ringPath(ring);
  // The hero's dots are in its own window's units: in another window each is placed again from its ground. They
  // were spaced for the hero's window, which is closer in, so here one is kept to each square a dot and a bit
  // across: beads, not a blot.
  const cells = new Set<number>();
  const placed = !cut
    ? (dots ?? [])
    : (dots ?? [])
        .map(([x, y, step]): [number, number, number] => {
          const [lat, lng] = unproject(stage, x, y);
          return [...project(view, lat, lng), step];
        })
        .filter(([x, y]) => {
          const cell = Math.floor(x / (DOT * 2.6)) * 4096 + Math.floor(y / (DOT * 2.6));
          return cells.has(cell) ? false : (cells.add(cell), true);
        });
  // The dots of each shade as one path (a circle is two half-turns): ink for a listing without a figure, then the four shades.
  const circle = ([x, y]: [number, number, number]) =>
    `M${(x - DOT).toFixed(1)} ${y.toFixed(1)}a${DOT} ${DOT} 0 1 0 ${DOT * 2} 0a${DOT} ${DOT} 0 1 0 ${-DOT * 2} 0`;
  const shades = [0, 1, 2, 3, 4].map((step) => placed.filter((d) => d[2] === step).map(circle).join(""));
  const shown = dots?.length ?? 0;
  const fill = (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
      <path className="ps-minimap-fill" d={outline} />
    </svg>
  );
  return (
    <div
      className="ps-bubble ps-minimap"
      data-play={lively ? "" : undefined}
      role="img"
      aria-label={`Map with ${name} outlined${shown ? ` and the listings inside it marked` : ""}`}
    >
      <div className="ps-minimap-view">
        {/* The island's picture, placed for the window shown, with the fill over it, as on the stage. */}
        <IslandBasemap area={seen} />
        {fill}
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
          <path className="ps-minimap-line" d={outline} vectorEffect="non-scaling-stroke" />
          {shades.map((d, step) => d && <path key={step} className="ps-minimap-dots" data-step={step} d={d} />)}
        </svg>
        {ring.map(([x, y], i) => (
          <i key={i} className="ps-minimap-node" style={{ left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
