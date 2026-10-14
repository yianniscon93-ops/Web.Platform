import type { AreaBoundary } from "@/lib/dashboard/types";

/*
 * A picked place, drawn in the hand the brand mark is drawn in (DESIGN.md, "The Drawn Area"): an ink line with round
 * joins, a light olive tint the streets read through, a thin white edge under the line to lift it off the streets,
 * and round olive dots at its corners, edged in white.
 *
 * The line is the place's real boundary (dim_areas.boundary, the OpenStreetMap polygon the listings are assigned
 * by). A boundary has hundreds of points, and a dot on every one would be a bead necklace, so the dots go on the
 * few points that shape it most: the boundary simplified until it has at most `max` corners. They are points of the
 * boundary itself, so every dot sits on the line.
 */

type XY = [number, number];

/** Squared distance from p to the segment a–b. */
function segDist2(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  let t = len ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  const ex = a[0] + t * dx - p[0];
  const ey = a[1] + t * dy - p[1];
  return ex * ex + ey * ey;
}

/** Douglas–Peucker over pts[i..j] (j may wrap past the end), adding kept indices to `keep`. */
function simplify(pts: XY[], i: number, j: number, tol2: number, keep: Set<number>) {
  const n = pts.length;
  const at = (k: number) => pts[k % n];
  let worst = -1;
  let worstD = tol2;
  for (let k = i + 1; k < j; k++) {
    const d = segDist2(at(k), at(i), at(j));
    if (d > worstD) {
      worst = k;
      worstD = d;
    }
  }
  if (worst < 0) return;
  keep.add(worst % n);
  simplify(pts, i, worst, tol2, keep);
  simplify(pts, worst, j, tol2, keep);
}

function ringArea(ring: number[][]): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}

/** The corners for the dots, as [lat, lng]: on the largest part's outer ring, at most `max`. */
export function plotCorners(boundary: AreaBoundary, max = 7): [number, number][] {
  const polys = boundary.type === "Polygon" ? [boundary.coordinates] : boundary.coordinates;
  let ring: number[][] | null = null;
  let best = 0;
  for (const rings of polys) {
    const a = rings[0] ? ringArea(rings[0]) : 0;
    if (a > best) {
      best = a;
      ring = rings[0];
    }
  }
  if (!ring || ring.length < 4) return [];
  const open = ring.slice(0, -1); // GeoJSON rings repeat their first point at the end
  const out = (idx: number[]) => idx.map((k) => [open[k][1], open[k][0]] as [number, number]);
  if (open.length <= max) return out(open.map((_, k) => k));

  // Work on the ground, not in degrees: a degree of longitude is shorter than one of latitude here.
  const midLat = open.reduce((s, p) => s + p[1], 0) / open.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const pts: XY[] = open.map(([lng, lat]) => [lng * kx, lat]);
  const n = pts.length;

  // Anchor on the two points farthest apart (near enough): the one farthest from the middle, and the one farthest from it.
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const far = (from: XY) => {
    let k = 0;
    let d = -1;
    pts.forEach((p, i) => {
      const e = (p[0] - from[0]) ** 2 + (p[1] - from[1]) ** 2;
      if (e > d) {
        d = e;
        k = i;
      }
    });
    return { k, d };
  };
  const a = far([cx, cy]).k;
  const { k: b, d: span2 } = far(pts[a]);
  const [lo, hi] = a < b ? [a, b] : [b, a];

  const cornersAt = (tol2: number) => {
    const keep = new Set([lo, hi]);
    simplify(pts, lo, hi, tol2, keep);
    simplify(pts, hi, lo + n, tol2, keep);
    return keep;
  };

  // The smallest tolerance that leaves at most `max` corners.
  let tLo = 0;
  let tHi = span2;
  let keep = cornersAt(tHi);
  for (let step = 0; step < 32; step++) {
    const mid = (tLo + tHi) / 2;
    const k = cornersAt(mid);
    if (k.size <= max) {
      tHi = mid;
      keep = k;
    } else tLo = mid;
  }
  return out([...keep].sort((p, q) => p - q));
}
