import { AREA_BASEMAPS } from "@/lib/landing/areaBasemaps";
import { VIEW_H, VIEW_W } from "@/lib/landing/areaView";
import type { DrawnArea } from "@/lib/landing/compare";
import { CYPRUS_OUTLINE } from "@/lib/landing/cyprusOutline";
import { LANDING as C } from "./tokens";

// The whole island, for the locator. Units are thousandths of a degree of latitude.
const KX = Math.cos((35 * Math.PI) / 180);
const LNGS = CYPRUS_OUTLINE.map(([lng]) => lng);
const LATS = CYPRUS_OUTLINE.map(([, lat]) => lat);
const WEST = Math.min(...LNGS);
const NORTH = Math.max(...LATS);
const ISLAND_W = (Math.max(...LNGS) - WEST) * KX * 1000;
const ISLAND_H = (NORTH - Math.min(...LATS)) * 1000;
const island = (lat: number, lng: number) => [(lng - WEST) * KX * 1000, (NORTH - lat) * 1000];
const DOT = (ISLAND_W / 44) * 3; // 3px on the 44px-wide locator
const ISLAND = "M" + CYPRUS_OUTLINE.map(([lng, lat]) => island(lat, lng).map((v) => v.toFixed(0)).join(" ")).join("L") + "Z";

/**
 * Everything on one place's street map that needs no data and never changes:
 * sea, shoreline, roads, place names and the island locator. Rendered on the
 * server so the path data stays out of the client bundle and the map is there
 * at first paint; the drawn area, its handles and the listings are AreaMap's.
 */
export default function AreaBasemap({ area }: { area: DrawnArea }) {
  const map = AREA_BASEMAPS[area.key];
  const lat = area.polygon.reduce((sum, p) => sum + p[0], 0) / area.polygon.length;
  const lng = area.polygon.reduce((sum, p) => sum + p[1], 0) / area.polygon.length;
  const [x, y] = island(lat, lng);
  return (
    <>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
        {/* AreaMap finds this path to keep listings out of the water. It covers the area's fill, which sits beneath it. */}
        <path data-sea="" d={map.sea} fill={C.mapSea} />
        <path className="th-shore" d={map.shore} vectorEffect="non-scaling-stroke" />
        <path className="th-road" d={map.minor} vectorEffect="non-scaling-stroke" />
        <path className="th-road-major" d={map.major} vectorEffect="non-scaling-stroke" />
      </svg>
      {map.labels.map((label) => (
        <span
          key={label.name}
          className="th-place"
          data-kind={label.kind}
          // AreaMap keeps this in step with the area as it is redrawn; it sets the halo to the tinted land.
          data-in={label.on === "area" ? "" : undefined}
          style={{ left: `${(label.x / VIEW_W) * 100}%`, top: `${(label.y / VIEW_H) * 100}%` }}
          aria-hidden="true"
        >
          {label.name}
        </span>
      ))}
      <span className="th-locator" aria-hidden="true">
        <svg viewBox={`0 0 ${ISLAND_W.toFixed(0)} ${ISLAND_H.toFixed(0)}`}>
          <path d={ISLAND} fill={C.muted} fillOpacity="0.5" />
          <circle cx={x.toFixed(0)} cy={y.toFixed(0)} r={DOT} fill={C.area} stroke={C.ground} strokeWidth={DOT * 0.4} />
        </svg>
      </span>
    </>
  );
}
