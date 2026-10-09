"use client";

import type { PolygonCoords } from "@/lib/dashboard/types";
import { VIEW_H, VIEW_W, areaView, project } from "@/lib/landing/areaView";
import type { DrawnArea } from "@/lib/landing/compare";
import { ringPath, type Pt } from "@/lib/landing/polygon";

// A listing's dot, in view units: the small map shows about half a pixel to the unit.
const DOT = 4.2;

/**
 * The drawn area on its place's street map, small and not editable: the
 * picture the connector's "show me on the map" answers with. It is a message
 * in the conversation in its own right, so it takes a bubble's corners and
 * hairline itself. `basemap` is the same server-rendered AreaBasemap the hero
 * uses, handed in as a prop so its path data stays out of the client bundle;
 * without it the area's shape is drawn on plain land. `dots` are the listings
 * the hero's map paints inside the line, in the same view units.
 */
export default function AreaMiniMap({
  place,
  polygon,
  name,
  dots,
  basemap,
  lively,
}: {
  place: DrawnArea;
  polygon: PolygonCoords;
  name: string;
  dots: Array<[number, number, number]> | null;
  basemap?: React.ReactNode;
  /** It arrives as part of an exchange being played. */
  lively?: boolean;
}) {
  // The same window the hero's map uses: the place's area as first drawn sets it.
  const view = areaView(place.polygon);
  const ring: Pt[] = polygon.map(([lat, lng]) => project(view, lat, lng));
  const outline = ringPath(ring);
  // The dots of each shade as one path (a circle is two half-turns): ink for a listing without a figure, then the four shades.
  const circle = ([x, y]: [number, number, number]) =>
    `M${(x - DOT).toFixed(1)} ${y.toFixed(1)}a${DOT} ${DOT} 0 1 0 ${DOT * 2} 0a${DOT} ${DOT} 0 1 0 ${-DOT * 2} 0`;
  const shades = [0, 1, 2, 3, 4].map((step) => (dots ?? []).filter((d) => d[2] === step).map(circle).join(""));
  const shown = dots?.length ?? 0;
  return (
    <div
      className="ps-bubble ps-minimap"
      data-play={lively ? "" : undefined}
      role="img"
      aria-label={`Street map with ${name} outlined${shown ? ` and the listings inside it marked` : ""}`}
    >
      <div className="ps-minimap-view">
        {/* The fill sits under the basemap's sea, which keeps it to the land, as in the hero. */}
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
          <path className="ps-minimap-fill" d={outline} />
        </svg>
        {basemap}
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
