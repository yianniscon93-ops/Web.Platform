// Geometry for the hero's drawn area. scripts/build-landing-maps.mjs imports
// this file too and Node runs it directly, so it keeps to syntax that needs no compiling.

/** A point or vertex in the street map's view-box units (areaView.ts). */
export type Pt = [number, number];

/** Even-odd test: is (x, y) inside the ring? */
export function inPolygon(x: number, y: number, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Do the open segments ab and cd properly cross? */
function crosses(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Distance from p to the segment ab. */
function toSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * True when the ring neither crosses nor touches itself: no two edges cross,
 * no corner sits within `minGap` of another, and no corner lies on (within
 * `edgeGap` of) an edge it does not belong to, which also rules out an edge
 * folded back along its neighbour. The hero keeps a dragged area simple, so
 * "inside" stays one region and the polygon the API receives is a valid one
 * (PostGIS treats a ring that touches itself as invalid). The gaps are in view
 * units and are wider than the rounding the polygon gets on its way to the API.
 */
export function isSimple(ring: Pt[], minGap = 8, edgeGap = 2): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(ring[i][0] - ring[j][0], ring[i][1] - ring[j][1]) < minGap) return false;
      // Edges that share a corner cannot cross each other.
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (crosses(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) return false;
    }
    // Corner i against every edge that does not end at it.
    for (let e = 0; e < n; e++) {
      const f = (e + 1) % n;
      if (e === i || f === i) continue;
      if (toSegment(ring[i], ring[e], ring[f]) < edgeGap) return false;
    }
  }
  return true;
}

/** Index of the right-most corner (the first of them on a tie): where the lines to the products leave the area. */
export function rightmost(ring: Pt[]): number {
  let at = 0;
  for (let i = 1; i < ring.length; i++) if (ring[i][0] > ring[at][0] + 0.5) at = i;
  return at;
}

/** SVG path data for the closed ring. */
export function ringPath(ring: Pt[]): string {
  return "M" + ring.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z";
}
