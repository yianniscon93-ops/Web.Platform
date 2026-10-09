import { VIEW_H, VIEW_W, project, viewOf } from "@/lib/landing/areaView";
import { ISLAND_AREA, type DrawnArea } from "@/lib/landing/compare";
import { CYPRUS_OUTLINE } from "@/lib/landing/cyprusOutline";

// The towns named on the island's map, each set in the sea beside it, clear of the coast: [name, lat, lng].
const NAMES: Array<[string, number, number]> = [
  ["Paphos", 34.665, 32.45],
  ["Limassol", 34.53, 32.86],
  ["Larnaca", 34.83, 33.78],
  ["Ayia Napa", 34.92, 34.12],
  ["Nicosia", 35.24, 33.37],
];
// The towns named once the map is zoomed in, each at its centre: [name, lat, lng].
const TOWNS: Array<[string, number, number]> = [
  ["Polis", 35.036, 32.426],
  ["Paphos", 34.775, 32.424],
  ["Pissouri", 34.667, 32.706],
  ["Limassol", 34.685, 33.035],
  ["Troodos", 34.92, 32.88],
  ["Nicosia", 35.172, 33.365],
  ["Larnaca", 34.918, 33.63],
  ["Ayia Napa", 34.988, 34.0],
  ["Protaras", 35.012, 34.058],
];
// The island's picture is drawn once, in the whole island's window.
const WHOLE = viewOf(ISLAND_AREA);
// The coast in that window's units. The two unseen paths made from it are in those units whatever window the map
// shows, so a listing is on land or in the water once, however far in the visitor has gone.
const COAST =
  "M" + CYPRUS_OUTLINE.map(([lng, lat]) => project(WHOLE, lat, lng).map((v) => v.toFixed(1)).join(" ")).join("L") + "Z";
const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

/**
 * The stage's map: the drawn island (public/landing/island.svg, made by scripts/build-island-map.mjs: sea,
 * coast, forest, towns, lakes and main roads), in whatever window the place's view is. The whole island's window
 * shows the picture as it is; zoomed in, it is the same picture, enlarged and moved. It needs no data. Under the
 * picture are two unseen paths AreaMap tests listings against, from the outline the locator uses; they stay in
 * the whole island's units (`viewOf(ISLAND_AREA)`), not the window's.
 */
export default function IslandBasemap({ area }: { area: DrawnArea }) {
  const view = viewOf(area);
  // Where the whole island's picture falls in this window.
  const art = {
    left: pct(((WHOLE.west - view.west) * view.sx) / VIEW_W),
    top: pct(((view.north - WHOLE.north) * view.sy) / VIEW_H),
    width: pct(view.sx / WHOLE.sx),
    height: pct(view.sy / WHOLE.sy),
  };
  // The whole island names its towns out at sea. Closer in, the towns in the window are named at their centres.
  // A picked place is named at its own centre either way, and no town is named on top of it.
  const offshore = view.sx < WHOLE.sx * 1.01;
  const [lat0, lng0] = area.centre ?? [0, 0];
  const [x0, y0] = project(view, lat0, lng0);
  const far = ([, lat, lng]: [string, number, number]) => {
    const [x, y] = project(view, lat, lng);
    return Math.hypot(lat - lat0, (lng - lng0) * 0.82) > 0.07 && Math.hypot(x - x0, y - y0) > 50;
  };
  const inside = ([, lat, lng]: [string, number, number]) => {
    const [x, y] = project(view, lat, lng);
    return x > 60 && x < VIEW_W - 60 && y > 40 && y < VIEW_H - 40;
  };
  const towns = offshore ? NAMES : TOWNS.filter(inside);
  // The picked place's own name, unless the whole island already names it out at sea.
  const own = area.centre != null && !(offshore && NAMES.some((t) => t[0] === area.name));
  const names: Array<[string, number, number]> = own
    ? [[area.name, lat0, lng0], ...towns.filter((t) => t[0] !== area.name && (offshore || far(t)))]
    : towns;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a vector drawing, sized and placed by hand */}
      <img className="th-island" src="/landing/island.svg" alt="" style={art} loading="lazy" decoding="async" />
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
        {/* AreaMap finds this path to keep listings out of the water: the whole island's window, less the island.
            It is not painted; the picture has the sea. */}
        <path data-sea="" d={`M0 0H${VIEW_W}V${VIEW_H}H0Z${COAST}`} fillRule="evenodd" fill="transparent" />
        {/* This outline is simpler than the coast the picture draws, so a seafront listing can fall just outside
            it. A listing within this unseen stroke of it counts as on land. */}
        <path data-shore-slack="" d={COAST} fill="none" stroke="transparent" strokeWidth="8" />
      </svg>
      {names.map(([name, lat, lng], i) => {
        const [x, y] = project(view, lat, lng);
        const atSea = offshore && name !== "Nicosia" && !(own && i === 0);
        return (
          <span
            key={name}
            className="th-place"
            data-kind={atSea ? "offshore" : "locality"}
            style={{ left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` }}
            aria-hidden="true"
          >
            {name}
          </span>
        );
      })}
    </>
  );
}
