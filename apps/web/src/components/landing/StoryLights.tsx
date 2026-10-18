"use client";

import { useEffect, useRef, useState } from "react";
import type { PointRow } from "@/lib/dashboard/types";
import { project, viewOf } from "@/lib/landing/areaView";
import { ISLAND_AREA } from "@/lib/landing/compare";
import { CYPRUS_OUTLINE } from "@/lib/landing/cyprusOutline";
import { HERO_TOWNS, townXY } from "@/lib/landing/heroTowns";
import { listingPoints } from "@/lib/landing/listingPoints";
import { PAPHOS_CROP } from "@/lib/landing/story";

/* The lights of "How it works" (HowSection.tsx): every short-let the database holds, from the same listings the first
   screen's tour draws (/api/dashboard/points; demo listings without DATABASE_URL), each a light in the page's one blue
   scale, brighter where it has been fuller this season. Nothing shows until they have arrived; each picture reads
   whole without them. */

/** How full a listing has been this season, in the page's four classes (TownTour's): 0 no figure, 1 under 60%, 4 80%+. */
const stepOf = (occ: number | null | undefined) => (occ == null || Number.isNaN(occ) ? 0 : 1 + [60, 70, 80].filter((e) => occ >= e).length);
/** The scale (DESIGN.md "The data scale"), and the faint ring of a listing with no figure. */
const COLS = ["#8996A5", "#5A7DA6", "#7894B3", "#AFC5DC", "#EDF3F9"];

const PAPHOS = HERO_TOWNS.find((t) => t.key === "paphos")!;
const inCrop = ([x, y]: [number, number]) =>
  x >= PAPHOS_CROP.x - 80 && x <= PAPHOS_CROP.x + PAPHOS_CROP.w + 80 && y >= PAPHOS_CROP.y - 80 && y <= PAPHOS_CROP.y + PAPHOS_CROP.h + 80;

function usePoints(): PointRow[] | null {
  const [points, setPoints] = useState<PointRow[] | null>(null);
  useEffect(() => {
    let live = true;
    listingPoints()
      .then((p) => live && setPoints(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return points;
}

/** A soft round light of one colour, drawn once and stamped for every listing of its class. */
function sprite(colour: string, px: number) {
  const c = document.createElement("canvas");
  c.width = c.height = px * 2;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(px, px, 0, px, px, px);
  grad.addColorStop(0, `${colour}38`);
  grad.addColorStop(0.45, `${colour}14`);
  grad.addColorStop(1, `${colour}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, px * 2, px * 2);
  return c;
}

/**
 * The whole island at night, every short-let a light: a canvas laid exactly over island.svg (the same 800 by 600
 * window, `viewOf(ISLAND_AREA)`), so it scales with the picture. Listings that fall in the sea (the demo data has
 * some) are left off. The halos add up, the dots never do (Brighter Is Fuller).
 */
export function IslandLights() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const points = usePoints();

  useEffect(() => {
    const el = canvas.current;
    if (!el || !points) return;
    const view = viewOf(ISLAND_AREA);
    const coast = new Path2D(`M${CYPRUS_OUTLINE.map(([lng, lat]) => project(view, lat, lng).join(" ")).join("L")}Z`);
    const probe = document.createElement("canvas").getContext("2d")!;
    const lights: Array<[number, number, number]> = [];
    for (const p of points) {
      const [x, y] = project(view, p.lat, p.lng);
      if (probe.isPointInPath(coast, x, y)) lights.push([x, y, stepOf(p.effOccTodate)]);
    }
    const draw = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      const g = el.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const k = w / 800;
      const halo = Math.max(4, 7 * k);
      const dot = Math.max(0.6, 0.85 * k);
      const sprites = COLS.map((c) => sprite(c, Math.ceil(halo * dpr)));
      g.globalCompositeOperation = "screen";
      for (const [x, y, s] of lights) if (s > 0) g.drawImage(sprites[s], x * k - halo, y * k - halo, halo * 2, halo * 2);
      g.globalCompositeOperation = "source-over";
      for (const [x, y, s] of lights) {
        g.fillStyle = COLS[s];
        g.globalAlpha = s > 0 ? 1 : 0.5;
        g.beginPath();
        g.arc(x * k, y * k, dot, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [points]);

  return <canvas ref={canvas} className="mt-lights" aria-hidden="true" />;
}

/** The Paphos short-lets in the story's crop, in the town map's view units. */
function paphosLights(points: PointRow[] | null): Array<[number, number, number]> {
  if (!points) return [];
  const out: Array<[number, number, number]> = [];
  for (const p of points) {
    const xy = townXY(PAPHOS, p.lat, p.lng);
    if (inCrop(xy)) out.push([xy[0], xy[1], stepOf(p.effOccTodate)]);
  }
  return out;
}

/** Kato Paphos's short-lets as lights on the town map (step 2): an SVG group inside the picture's own drawing. */
export function PaphosLights() {
  const lights = paphosLights(usePoints());
  return (
    <g className="mt-town-lights">
      {lights.map(([x, y, s], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={s >= 3 ? 6.5 : 5.5} fill={COLS[s]} opacity={s > 0 ? 0.9 : 0.5} />
      ))}
    </g>
  );
}

/** Where step 4's example home for sale stands on the Paphos map, inside Kato Paphos. */
const HOME: [number, number] = [760, 880];
/**
 * Long-lets of its size near the example home. The listings API places short-lets only, so these four are drawn
 * where long-lets might be and the picture says it is an example (its caption).
 */
const LONG_LETS: Array<[number, number]> = [
  [640, 762],
  [912, 958],
  [688, 1012],
  [868, 752],
];

/**
 * Step 4: one home for sale matched with the short-lets nearest it (the real listings', from the API) and with
 * long-lets of its size (drawn, as above). Every line has pathLength 1, so the stylesheet can draw it.
 */
export function MatchLines() {
  const lights = paphosLights(usePoints());
  const near = [...lights]
    .filter(([, , s]) => s > 0)
    .sort((a, b) => Math.hypot(a[0] - HOME[0], a[1] - HOME[1]) - Math.hypot(b[0] - HOME[0], b[1] - HOME[1]))
    .slice(0, 6);
  return (
    <g className="mt-match-g">
      {lights.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="5" className="mt-faint" />
      ))}
      {near.map(([x, y, s], i) => (
        <g key={`s${i}`}>
          <path className="mt-mline" pathLength={1} d={`M${HOME[0]} ${HOME[1]}L${x.toFixed(1)} ${y.toFixed(1)}`} style={{ "--i": i } as React.CSSProperties} />
          <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="9" fill={COLS[Math.max(3, s)]} />
        </g>
      ))}
      {LONG_LETS.map(([x, y], i) => (
        <g key={`l${i}`}>
          <path className="mt-mline mt-mline-lt" pathLength={1} d={`M${HOME[0]} ${HOME[1]}L${x} ${y}`} style={{ "--i": i + 6 } as React.CSSProperties} />
          <rect x={x - 8} y={y - 8} width="16" height="16" rx="3" className="mt-lt" />
        </g>
      ))}
      <circle cx={HOME[0]} cy={HOME[1]} r="15" className="mt-home" />
    </g>
  );
}
