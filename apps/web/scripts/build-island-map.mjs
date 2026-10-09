// Builds the drawn map of the whole island that the landing page's second
// screen (the stage) shows under its own layers when it opens:
//
//   public/landing/island.svg   the map: sea, woodland, built-up ground, inland
//                               water, the main roads and the coast. The land
//                               itself is left clear, so what the page draws
//                               under the picture shows through. No text and
//                               no boundary of any kind.
//
// The picture's 800 × 600 view is the stage's own: every coordinate in it is
// project(viewOf(ISLAND_AREA), lat, lng) of the real place, to a tenth of a
// unit, because the page also shows this picture enlarged about six times.
//
// Rerun from apps/web after changing ISLAND_AREA's frame, the view in
// areaView.ts, the colours or what is drawn:
//
//   node scripts/build-island-map.mjs
//
// Needs Node 23.6+ (it imports the two .ts files below directly) and network
// access: it downloads z10 vector tiles from OpenFreeMap (OpenMapTiles schema,
// OpenStreetMap data), 40 for the island. Set LANDING_MAPS_CACHE=<dir> to keep
// the tiles between runs (the same cache the other map scripts use). The page
// itself never requests a tile.
//
// The colours are the page's tokens, baked in: an SVG shown as an image cannot
// read CSS variables. If a token changes, change it here and rerun.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { ISLAND_AREA } from "../src/lib/landing/compare.ts";
import { VIEW_H, VIEW_W, project, unproject, viewOf } from "../src/lib/landing/areaView.ts";

const TILEJSON = "https://tiles.openfreemap.org/planet";
const Z = 10;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_SVG = join(ROOT, "public/landing/island.svg");
const CACHE = process.env.LANDING_MAPS_CACHE;
const MAX_BYTES = 520_000;

// The ground the tiles are fetched for: Cyprus's own bounds and a little round
// them. The view is wider (it reaches the Turkish coast in the north), but all
// of it that is not Cyprus is drawn as sea, so no tile beyond is needed.
const GROUND = { south: 34.56, north: 35.7, west: 32.27, east: 34.6 };
const GROUND_MARGIN = 0.03; // degrees
// A piece of land is Cyprus's when its middle is south of this latitude and between these longitudes.
const CYPRUS = { north: 35.78, west: 32.2, east: 34.7 };
const CYPRUS_KM2 = 9251;

const COLOUR = {
  water: "#C2DADF",
  shore: "#6F929B",
  green: "#DFE7CF",
  built: "#E3DCCB",
  motorway: "#A69F8A",
  primary: "#B7B09C",
  secondary: "#CBC5B3",
};
const GREEN_OPACITY = 0.8;
const BUILT_OPACITY = 0.85;
// Line widths are in the picture's own pixels however large it is shown (non-scaling strokes).
const COAST_WIDTH = 1;
const LAKE_EDGE_WIDTH = 0.6;
const MOTORWAY_WIDTH = 1.5;
const PRIMARY_WIDTH = 1.1;
const SECONDARY_WIDTH = 0.7;

// What is taken from the tiles (OpenMapTiles layer → classes). The `boundary`
// layer is never read, and nor is `park` (protected areas, which would lie
// over a third of the island as one flat shape).
const GREEN_LANDCOVER = new Set(["wood", "grass"]);
const BUILT_LANDUSE = new Set(["residential", "commercial", "industrial", "retail", "garages", "school", "university", "college", "kindergarten", "hospital", "library", "bus_station", "suburb", "quarter", "neighbourhood"]);
const INLAND_WATER = new Set(["lake", "pond", "river"]);
const ROADS = { motorway: "motorway", trunk: "motorway", primary: "primary", secondary: "secondary" };

const TILE_OVERLAP = 32; // tile units (of 4096) a filled shape keeps beyond its tile's edge, so neighbours overlap and leave no seam
const LINE_TOLERANCE = 0.08; // Douglas–Peucker, in view units: coast, water's edge and roads
const AREA_TOLERANCE = 0.15; // green and built-up
// The smallest shapes kept, in units² (a unit² is about 0.14 km²). A shape its tile cut is kept whatever its size: it is part of a larger one.
const MIN_AREA = 0.6; // green and built-up
const MIN_WATER_AREA = 0.3;
const MIN_ISLET = 0.03;
const MIN_PIECE = 0.05; // what a cut and rounded piece must still cover to be written
const SNAP = 0.3; // view units: how far apart two tiles may put the point where a line crosses from one to the other
const SIDE = 0.01; // view units: how far to each side of an edge the ground is tested for water

// ── The view: the stage's own window on the island ──

const view = viewOf(ISLAND_AREA);
/** [lat, lng] to view units. */
const toXY = (lat, lng) => project(view, lat, lng);
const KM_PER_UNIT = 111.2 / view.sy; // both ways, at the island's middle latitude

// ── Mapbox Vector Tile decoding (protobuf, just the fields used here) ──

function reader(buf, pos = 0, end = buf.length) {
  const r = {
    get more() {
      return pos < end;
    },
    varint() {
      let v = 0;
      let shift = 1;
      for (;;) {
        const b = buf[pos++];
        v += (b & 0x7f) * shift;
        if (b < 0x80) return v;
        shift *= 128;
      }
    },
    bytes() {
      const len = r.varint();
      pos += len;
      return reader(buf, pos - len, pos);
    },
    string() {
      const len = r.varint();
      pos += len;
      return buf.toString("utf8", pos - len, pos);
    },
    skip(wire) {
      if (wire === 0) r.varint();
      else if (wire === 1) pos += 8;
      else if (wire === 2) pos += r.varint();
      else if (wire === 5) pos += 4;
      else throw new Error(`wire type ${wire}`);
    },
    double() {
      pos += 8;
      return buf.readDoubleLE(pos - 8);
    },
    float() {
      pos += 4;
      return buf.readFloatLE(pos - 4);
    },
    packed() {
      const sub = r.bytes();
      const out = [];
      while (sub.more) out.push(sub.varint());
      return out;
    },
  };
  return r;
}

const zigzag = (n) => (n % 2 ? -(n + 1) / 2 : n / 2);

function readValue(r) {
  let v = null;
  while (r.more) {
    const tag = r.varint();
    const field = tag >> 3;
    if (field === 1) v = r.string();
    else if (field === 2) v = r.float();
    else if (field === 3) v = r.double();
    else if (field === 4 || field === 5) v = r.varint();
    else if (field === 6) v = zigzag(r.varint());
    else if (field === 7) v = r.varint() !== 0;
    else r.skip(tag & 7);
  }
  return v;
}

/** Feature geometry as rings/lines of [x, y] in tile units. */
function readGeometry(cmds) {
  const parts = [];
  let part = null;
  let x = 0;
  let y = 0;
  for (let i = 0; i < cmds.length; ) {
    const cmd = cmds[i] & 7;
    let count = cmds[i++] >> 3;
    if (cmd === 7) continue; // ClosePath: rings are closed when drawn
    while (count--) {
      x += zigzag(cmds[i++]);
      y += zigzag(cmds[i++]);
      if (cmd === 1) parts.push((part = []));
      part.push([x, y]);
    }
  }
  return parts;
}

/** { layerName: { extent, features: [{ type, props, geometry }] } } for the wanted layers. */
function readTile(buf, wanted) {
  const layers = {};
  const tile = reader(buf);
  while (tile.more) {
    const tag = tile.varint();
    if (tag >> 3 !== 3) {
      tile.skip(tag & 7);
      continue;
    }
    const r = tile.bytes();
    const layer = { name: "", extent: 4096, keys: [], values: [], raw: [] };
    while (r.more) {
      const t = r.varint();
      const field = t >> 3;
      if (field === 1) layer.name = r.string();
      else if (field === 2) layer.raw.push(r.bytes());
      else if (field === 3) layer.keys.push(r.string());
      else if (field === 4) layer.values.push(readValue(r.bytes()));
      else if (field === 5) layer.extent = r.varint();
      else r.skip(t & 7);
    }
    if (!wanted.includes(layer.name)) continue;
    const features = layer.raw.map((f) => {
      let type = 0;
      let tags = [];
      let cmds = [];
      while (f.more) {
        const t = f.varint();
        const field = t >> 3;
        if (field === 2) tags = f.packed();
        else if (field === 3) type = f.varint();
        else if (field === 4) cmds = f.packed();
        else f.skip(t & 7);
      }
      const props = {};
      for (let i = 0; i < tags.length; i += 2) props[layer.keys[tags[i]]] = layer.values[tags[i + 1]];
      return { type, props, geometry: readGeometry(cmds) };
    });
    layers[layer.name] = { extent: layer.extent, features };
  }
  return layers;
}

// ── Geometry ──

const lngToTile = (lng) => ((lng + 180) / 360) * 2 ** Z;
const latToTile = (lat) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** Z;
};
const tileToLng = (x) => (x / 2 ** Z) * 360 - 180;
const tileToLat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** Z))) * 180) / Math.PI;

/** Whether a point lies on a side of the box. */
const onSide = (p, [lo, hi]) => [0, 1].some((k) => [lo[k], hi[k]].some((side) => Math.abs(p[k] - side) < 1e-6));

/** The pieces of a line that fall inside the box (Liang–Barsky per segment). */
function clipLine(line, lo, hi) {
  const out = [];
  let cur = null;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    let t0 = 0;
    let t1 = 1;
    let inside = true;
    for (const k of [0, 1]) {
      const d = b[k] - a[k];
      for (const [p, q] of [
        [-d, a[k] - lo[k]],
        [d, hi[k] - a[k]],
      ]) {
        if (p === 0) {
          if (q < 0) inside = false;
        } else if (p < 0) t0 = Math.max(t0, q / p);
        else t1 = Math.min(t1, q / p);
      }
    }
    if (!inside || t0 > t1) {
      cur = null;
      continue;
    }
    const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    if (!cur || t0 > 0) out.push((cur = [at(t0)]));
    cur.push(at(t1));
    if (t1 < 1) cur = null;
  }
  return out;
}

/** A ring cut to the box (Sutherland–Hodgman against each side). */
function clipRing(ring, lo, hi) {
  if (ring.every((p) => p[0] >= lo[0] && p[0] <= hi[0] && p[1] >= lo[1] && p[1] <= hi[1])) return ring;
  let pts = ring;
  for (const k of [0, 1]) {
    for (const [bound, keepBelow] of [
      [lo[k], false],
      [hi[k], true],
    ]) {
      const inside = (p) => (keepBelow ? p[k] <= bound : p[k] >= bound);
      const next = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const cross = () => {
          const t = (bound - a[k]) / (b[k] - a[k]);
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        };
        if (inside(a)) {
          next.push(a);
          if (!inside(b)) next.push(cross());
        } else if (inside(b)) next.push(cross());
      }
      pts = next;
      if (!pts.length) return pts;
    }
  }
  return pts;
}

function simplify(pts, tolerance) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = pts[i];
    const dx = pts[j][0] - ax;
    const dy = pts[j][1] - ay;
    const len = Math.hypot(dx, dy);
    let worst = 0;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      // From the chord; where a closed line's two ends are one point, from that point (or a loop would shrink to nothing).
      const d = len ? Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / len : Math.hypot(pts[k][0] - ax, pts[k][1] - ay);
      if (d > worst) {
        worst = d;
        at = k;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([i, at], [at, j]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Points as whole tenths of a view unit, which is how the file holds them; repeats dropped. */
const toTenths = (pts) => {
  const out = [];
  for (const [x, y] of pts) {
    const p = [Math.round(x * 10), Math.round(y * 10)];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
};

/** A ring simplified and in tenths, its closing point not repeated. */
function tidyRing(ring, tolerance) {
  const pts = toTenths(simplify(ring, tolerance));
  const last = pts[pts.length - 1];
  if (pts.length > 1 && last[0] === pts[0][0] && last[1] === pts[0][1]) pts.pop();
  return pts;
}

const ringArea = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};
/** The same for a ring in tenths, in units². */
const tenthsArea = (pts) => ringArea(pts) / 100;

/** A ring's middle, weighted by area (the mean of its points where it has none). */
function centroid(pts) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const w = x1 * y2 - x2 * y1;
    a += w;
    cx += (x1 + x2) * w;
    cy += (y1 + y2) * w;
  }
  if (Math.abs(a) < 1e-9) return [0, 1].map((k) => pts.reduce((s, p) => s + p[k], 0) / pts.length);
  return [cx / (3 * a), cy / (3 * a)];
}

const key = (p) => `${p[0]},${p[1]}`;

/** Joins lines that meet end to end at the very same point. */
function mergeLines(lines) {
  const ends = new Map();
  const add = (line) => {
    for (const p of [line[0], line[line.length - 1]]) {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, new Set());
      ends.get(k).add(line);
    }
  };
  const remove = (line) => {
    for (const p of [line[0], line[line.length - 1]]) ends.get(key(p))?.delete(line);
  };
  lines.forEach(add);
  const done = new Set();
  const out = [];
  for (let line of lines) {
    if (done.has(line)) continue;
    remove(line);
    for (let grew = true; grew; ) {
      grew = false;
      for (const atEnd of [true, false]) {
        const p = atEnd ? line[line.length - 1] : line[0];
        const others = ends.get(key(p));
        // Only a plain join: at a junction of three or more the lines stay apart.
        if (!others || others.size !== 1) continue;
        const [other] = others;
        remove(other);
        done.add(other);
        const same = key(other[0]) === key(p);
        const tail = atEnd ? (same ? other : [...other].reverse()) : same ? [...other].reverse() : other;
        line = atEnd ? [...line, ...tail.slice(1)] : [...tail.slice(0, -1), ...line];
        grew = true;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * Brings together the ends two tiles left a hair apart. Each tile cuts a line
 * at its own edge from its own rounded copy of it, so the two halves end a few
 * hundredths of a unit from each other, and more where the line crosses the
 * edge at a shallow angle: every end a tile cut (`cut` holds them, each with
 * its tile) meets the nearest such end from another tile within `SNAP`, half
 * way, closest pairs first.
 */
function joinCuts(lines, cut) {
  const ends = [];
  for (const line of lines) for (const i of [0, line.length - 1]) if (cut.has(line[i])) ends.push({ line, i, tile: cut.get(line[i]) });
  const cell = (v) => Math.floor(v / SNAP);
  const grid = new Map();
  ends.forEach((e, n) => {
    const p = e.line[e.i];
    const k = `${cell(p[0])},${cell(p[1])}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(n);
  });
  const pairs = [];
  ends.forEach((e, n) => {
    const p = e.line[e.i];
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        for (const m of grid.get(`${cell(p[0]) + dx},${cell(p[1]) + dy}`) ?? []) {
          if (m <= n || ends[m].tile === e.tile) continue;
          const q = ends[m].line[ends[m].i];
          const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
          if (d <= SNAP) pairs.push([d, n, m]);
        }
      }
    }
  });
  pairs.sort((a, b) => a[0] - b[0]);
  const used = new Set();
  for (const [, n, m] of pairs) {
    if (used.has(n) || used.has(m)) continue;
    used.add(n).add(m);
    const p = ends[n].line[ends[n].i];
    const q = ends[m].line[ends[m].i];
    ends[n].line[ends[n].i] = ends[m].line[ends[m].i] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  }
}

/** Lines joined into the longest runs they make, within a tile and from one tile to the next. */
function stitch(lines, cut) {
  const runs = mergeLines(lines.filter((l) => l.length > 1));
  joinCuts(runs, cut);
  return mergeLines(runs);
}

const isClosed = (line) => line.length > 3 && key(line[0]) === key(line[line.length - 1]);

/** Stitched lines simplified and in tenths; one that closes on itself stays closed. */
const tidyLines = (lines, cut) =>
  stitch(lines, cut)
    .map((l) => toTenths(simplify(l, LINE_TOLERANCE)))
    .filter((l) => l.length > 1);

/** Parts ordered so each starts near the last one's start (in rows, there and back), which keeps the moves between them short. */
function nearOrder(parts) {
  const ROW = 200; // tenths
  const row = (p) => Math.floor(p[0][1] / ROW);
  return [...parts].sort((a, b) => row(a) - row(b) || (row(a) % 2 ? b[0][0] - a[0][0] : a[0][0] - b[0][0]));
}

/** Whole tenths as the shortest text: 123 → 12.3, -5 → -.5, 70 → 7. */
const tenths = (n) => {
  const s = String(Math.abs(n) / 10);
  return (n < 0 ? "-" : "") + (s.startsWith("0.") ? s.slice(1) : s);
};

/**
 * Compact path data, all relative: a move to each part's first point (a
 * path's first move counts from 0,0), then its line segments, which need no
 * letter after a relative move. Points are in tenths. A number needs no space
 * before it when it opens with a minus, or with a point after a number that
 * already has one.
 */
function toPath(parts, close) {
  let d = "";
  let from = [0, 0];
  for (const pts of parts) {
    let seg = "";
    let dotted = false; // whether the number before has a decimal point
    let prev = from;
    for (const p of pts) {
      for (const n of [p[0] - prev[0], p[1] - prev[1]]) {
        const s = tenths(n);
        seg += (seg === "" || s[0] === "-" || (s[0] === "." && dotted) ? "" : " ") + s;
        dotted = s.includes(".");
      }
      prev = p;
    }
    d += `m${seg}${close ? "z" : ""}`;
    from = close ? pts[0] : prev; // closing a part returns to its first point
  }
  return d;
}

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const bounds = (ring) => ({
  x0: Math.min(...ring.map((p) => p[0])),
  x1: Math.max(...ring.map((p) => p[0])),
  y0: Math.min(...ring.map((p) => p[1])),
  y1: Math.max(...ring.map((p) => p[1])),
});

/** Whether a point is inside the rings, filled with the nonzero rule (a hole runs the other way round). */
function covers(rings) {
  const info = rings.map((ring) => ({ ring, sign: Math.sign(ringArea(ring)), ...bounds(ring) }));
  return (pt) =>
    info.reduce(
      (n, r) => n + (pt[0] >= r.x0 && pt[0] <= r.x1 && pt[1] >= r.y0 && pt[1] <= r.y1 && pointInRing(pt, r.ring) ? r.sign : 0),
      0
    ) !== 0;
}

/** Whether a point is inside the rings, filled with the even-odd rule, as the sea's path is. */
function coversEvenOdd(rings) {
  const info = rings.map((ring) => ({ ring, ...bounds(ring) }));
  return (pt) =>
    info.reduce((n, r) => n + (pt[0] >= r.x0 && pt[0] <= r.x1 && pt[1] >= r.y0 && pt[1] <= r.y1 && pointInRing(pt, r.ring) ? 1 : 0), 0) % 2 === 1;
}

/** A cut ring's own edges: all but those the cut made, which lie along a side of the box it was cut to. */
function ownEdges(ring, [lo, hi]) {
  const along = (a, b) => [0, 1].some((k) => [lo[k], hi[k]].some((side) => Math.abs(a[k] - side) < 1e-6 && Math.abs(b[k] - side) < 1e-6));
  return ring.map((a, i) => [a, ring[(i + 1) % ring.length]]).filter(([a, b]) => !along(a, b));
}

/** The same as lines: the ring's own edges in the order they run, broken wherever the cut made one. An uncut ring is one closed line. */
function ownOutline(ring, [lo, hi]) {
  const along = (a, b) => [0, 1].some((k) => [lo[k], hi[k]].some((side) => Math.abs(a[k] - side) < 1e-6 && Math.abs(b[k] - side) < 1e-6));
  const own = ring.map((a, i) => !along(a, ring[(i + 1) % ring.length]));
  const start = own.indexOf(false);
  if (start < 0) return [[...ring, ring[0]]];
  const out = [];
  let cur = null;
  for (let step = 1; step <= ring.length; step++) {
    const i = (start + step) % ring.length;
    if (!own[i]) cur = null;
    else {
      if (!cur) out.push((cur = [ring[i]]));
      cur.push(ring[(i + 1) % ring.length]);
    }
  }
  return out;
}

/**
 * The edges that have water on one side only: a water body comes in several
 * polygons that share edges out in the open water, and those are no shore.
 */
function shoreEdges(edges, wet) {
  return edges.filter(([a, b]) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len === 0) return false;
    const n = [((b[1] - a[1]) / len) * SIDE, (-(b[0] - a[0]) / len) * SIDE];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return wet([mid[0] + n[0], mid[1] + n[1]]) !== wet([mid[0] - n[0], mid[1] - n[1]]);
  });
}

// ── Build ──

async function fetchTile(template, x, y) {
  const file = CACHE && join(CACHE, `${Z}-${x}-${y}.pbf`);
  if (file && existsSync(file)) return readFileSync(file);
  const url = template.replace("{z}", Z).replace("{x}", x).replace("{y}", y);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (file) {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, buf);
  }
  return buf;
}

const { tiles: [template] } = await (await fetch(TILEJSON)).json();

const x0 = Math.floor(lngToTile(GROUND.west - GROUND_MARGIN));
const x1 = Math.floor(lngToTile(GROUND.east + GROUND_MARGIN));
const y0 = Math.floor(latToTile(GROUND.north + GROUND_MARGIN));
const y1 = Math.floor(latToTile(GROUND.south - GROUND_MARGIN));

// Rings and lines in view units. Filled shapes are cut a little beyond their
// tile, so neighbours overlap; lines and the water's edges are cut at the
// tile's edge exactly, so nothing is drawn twice, and `cut` holds the points
// those cuts made, which are the ends to join from one tile to the next.
const raw = { green: [], built: [], water: [], coast: [], lakeEdge: [], motorway: [], primary: [], secondary: [] };
const minArea = { green: MIN_AREA, built: MIN_AREA, water: MIN_WATER_AREA };
const cut = new WeakMap(); // point → the tile that cut it
const found = {}; // "layer class kind" → features in the tiles, for the log
const used = {}; // the same → where they were drawn and how many
let tiles = 0;

for (let tx = x0; tx <= x1; tx++) {
  for (let ty = y0; ty <= y1; ty++) {
    const layers = readTile(await fetchTile(template, tx, ty), ["water", "landcover", "landuse", "transportation"]);
    tiles++;
    const sea = []; // this tile's ocean, a little beyond the tile
    const inland = { edges: [], rings: [] }; // its lakes: their rings' own edges, and the rings a little beyond the tile
    for (const [name, layer] of Object.entries(layers)) {
      const toView = ([px, py]) => toXY(tileToLat(ty + py / layer.extent), tileToLng(tx + px / layer.extent));
      // The tile's own ground and `pad` tile units round it: [lo, hi] in view units.
      const box = (pad) => [toView([-pad, -pad]), toView([layer.extent + pad, layer.extent + pad])];
      const reaches = (ring) => ring.some(([px, py]) => px <= 0 || py <= 0 || px >= layer.extent || py >= layer.extent);
      const rings = (f, pad, least) =>
        f.geometry
          .filter((ring) => reaches(ring) || Math.abs(ringArea(ring.map(toView))) >= least)
          .map((ring) => clipRing(ring.map(toView), ...box(pad)))
          .filter((ring) => ring.length > 2);
      /** Notes the ends of a line that the tile's edge made. */
      const markCuts = (line) => {
        for (const p of [line[0], line[line.length - 1]]) if (onSide(p, box(0))) cut.set(p, `${tx}/${ty}`);
      };
      const lines = (f) => {
        const got = f.geometry.flatMap((line) => clipLine(line.map(toView), ...box(0)));
        got.forEach(markCuts);
        return got;
      };

      for (const f of layer.features) {
        const cls = f.props.class ?? "";
        const more = name === "transportation" ? [f.props.brunnel, f.props.ramp ? "ramp" : ""].filter(Boolean).join(" ") : f.props.intermittent ? "intermittent" : "";
        const label = `${name} ${cls}${f.props.subclass && f.props.subclass !== cls ? `/${f.props.subclass}` : ""}${more ? ` (${more})` : ""} ${["", "point", "line", "polygon"][f.type]}`;
        found[label] = (found[label] ?? 0) + 1;
        let into = null;
        if (name === "transportation") {
          // Tunnels are drawn (at this scale a road is one line, and the Limassol to Paphos motorway has one), and so are
          // slip roads, which carry the through road at some junctions. Anything being built has a class of its own.
          if (f.type === 2) into = ROADS[cls] ?? null;
        } else if (f.type === 3) {
          if (name === "water") into = cls === "ocean" ? "coast" : INLAND_WATER.has(cls) ? "water" : null;
          else if (name === "landcover") into = GREEN_LANDCOVER.has(cls) ? "green" : null;
          else if (name === "landuse") into = BUILT_LANDUSE.has(cls) ? "built" : null;
        }
        if (!into) continue;
        let got;
        if (into === "coast") {
          // The ocean's rings, cut at the tile's edge exactly, are the coast: each one's own outline, in the order it runs.
          got = rings(f, 0, 0).flatMap((ring) => ownOutline(ring, box(0)));
          got.forEach(markCuts);
          sea.push(...rings(f, TILE_OVERLAP, 0));
        } else if (f.type === 3) {
          got = rings(f, TILE_OVERLAP, minArea[into]);
          if (into === "water" && got.length) {
            inland.rings.push(...got);
            for (const ring of rings(f, 0, minArea[into])) {
              const edges = ownEdges(ring, box(0));
              edges.forEach(markCuts);
              inland.edges.push(...edges);
            }
          }
        } else got = lines(f);
        if (!got.length) continue; // too small
        raw[into].push(...got);
        used[label] ??= { into, count: 0 };
        used[label].count++;
      }
    }
    // An inland water's edge is drawn where the water ends, not where one piece of it meets another or the sea.
    raw.lakeEdge.push(...shoreEdges(inland.edges, covers([...sea, ...inland.rings])));
  }
}

console.log(`${tiles} tiles (z${Z}, x ${x0} to ${x1}, y ${y0} to ${y1})`);
console.log(`view: ${(view.north - VIEW_H / view.sy).toFixed(4)} to ${view.north.toFixed(4)} N, ${view.west.toFixed(4)} to ${(view.west + VIEW_W / view.sx).toFixed(4)} E; a unit is ${(KM_PER_UNIT * 1000).toFixed(0)} m`);
console.log("in the tiles (layer class/subclass kind: features, with what drew them):");
for (const label of Object.keys(found).sort()) console.log(`  ${label}: ${found[label]}${used[label] ? `  → ${used[label].into} ×${used[label].count}` : ""}`);

// ── The island: the coast's closed rings that are Cyprus ──

const coastRuns = stitch(raw.coast, cut);
const openCoast = coastRuns.filter((l) => !isClosed(l));
const coastRings = coastRuns.filter(isClosed).map((ring) => ring.slice(1));
const isCyprus = (ring) => {
  const [lat, lng] = unproject(view, ...centroid(ring));
  return lat <= CYPRUS.north && lng >= CYPRUS.west && lng <= CYPRUS.east;
};
const cyprusRings = coastRings.filter(isCyprus);
const land = nearOrder(
  cyprusRings
    .filter((ring) => Math.abs(ringArea(ring)) >= MIN_ISLET)
    .map((ring) => tidyRing([...ring, ring[0]], LINE_TOLERANCE))
    .filter((ring) => ring.length > 2 && Math.abs(tenthsArea(ring)) >= MIN_ISLET)
);
/** Whether a point (in view units) is land in the picture: the sea's path leaves it clear. */
const dry = (() => {
  const inside = coversEvenOdd(land);
  return ([x, y]) => inside([x * 10, y * 10]);
})();

const areas = (rings, tolerance) =>
  nearOrder(rings.map((ring) => tidyRing(ring, tolerance)).filter((ring) => ring.length > 2 && Math.abs(tenthsArea(ring)) >= MIN_PIECE));

const layersOut = {
  land,
  green: areas(raw.green, AREA_TOLERANCE),
  built: areas(raw.built, AREA_TOLERANCE),
  water: areas(raw.water, LINE_TOLERANCE),
  lakeEdge: nearOrder(tidyLines(raw.lakeEdge, cut)),
  secondary: nearOrder(tidyLines(raw.secondary, cut)),
  primary: nearOrder(tidyLines(raw.primary, cut)),
  motorway: nearOrder(tidyLines(raw.motorway, cut)),
};
const LINES = ["lakeEdge", "secondary", "primary", "motorway"];

const landKm2 = land.reduce((sum, ring) => sum + Math.abs(tenthsArea(ring)), 0) * KM_PER_UNIT ** 2;
console.log(`coast: ${coastRings.length} rings in the tiles, ${coastRings.length - cyprusRings.length} not Cyprus, ${cyprusRings.length - land.length} too small to draw; land drawn: ${Math.round(landKm2)} km²`);
console.log("drawn:");
for (const [name, parts] of Object.entries(layersOut)) {
  console.log(`  ${name}: ${parts.length} ${LINES.includes(name) ? "lines" : "rings"}, ${parts.reduce((n, p) => n + p.length, 0)} points`);
}

// ── Checks ──

// The coast closes: every piece of it that the tiles hold joins up into rings.
for (const run of openCoast) {
  throw new Error(`the coast from ${unproject(view, ...run[0]).map((v) => v.toFixed(3))} to ${unproject(view, ...run[run.length - 1]).map((v) => v.toFixed(3))} does not close into a ring: fetch more ground, or raise SNAP`);
}
// The land is Cyprus, all of it and nothing else: its area is the island's.
if (Math.abs(landKm2 / CYPRUS_KM2 - 1) > 0.03) throw new Error(`the land drawn is ${Math.round(landKm2)} km², not Cyprus's ${CYPRUS_KM2}`);
// Sea and land the right way round, and no land but Cyprus.
const mustBe = [
  ["the open sea south of Larnaca", 34.4, 33.5, false],
  ["the sea off Paphos", 34.7, 32.2, false],
  ["Troodos", 34.93, 32.87, true],
  ["central Nicosia", 35.17, 33.36, true],
  ["Limassol", 34.69, 33.04, true],
  ["the Karpas peninsula", 35.52, 34.2, true],
  ["the Turkish coast at Anamur", 36.08, 32.85, false],
];
for (const [what, lat, lng, isLand] of mustBe) {
  if (dry(toXY(lat, lng)) !== isLand) throw new Error(`${what} is drawn as ${isLand ? "sea" : "land"}`);
}
// Everything drawn is on Cyprus's own ground, inside the view; and no filled shape is larger than the piece of
// one a tile holds (a shape lying over the whole view would be).
const [gx0, gy0] = toXY(GROUND.north + GROUND_MARGIN, GROUND.west - GROUND_MARGIN);
const [gx1, gy1] = toXY(GROUND.south - GROUND_MARGIN, GROUND.east + GROUND_MARGIN);
if (gx0 < 0 || gy0 < 0 || gx1 > VIEW_W || gy1 > VIEW_H) throw new Error("the view does not hold the whole island");
const [tx0, ty0] = toXY(tileToLat(y0), tileToLng(x0));
const [tx1, ty1] = toXY(tileToLat(y1 + 1), tileToLng(x1 + 1));
const tileUnits2 = ((tx1 - tx0) * (ty1 - ty0)) / tiles;
for (const [name, parts] of Object.entries(layersOut)) {
  for (const part of parts) {
    for (const [x, y] of part) {
      if (x < gx0 * 10 || x > gx1 * 10 || y < gy0 * 10 || y > gy1 * 10) throw new Error(`a ${name} shape leaves the island's ground at ${x / 10},${y / 10}`);
    }
    if (!LINES.includes(name) && name !== "land" && Math.abs(tenthsArea(part)) > 1.2 * tileUnits2) throw new Error(`a ${name} shape is larger than a tile's piece of one can be`);
  }
}
// Roads and water's edges are on land (a handful of points may sit on a bridge, a causeway or a harbour mole).
for (const name of LINES) {
  const pts = layersOut[name].flat();
  const offshore = pts.filter(([x, y]) => !dry([x / 10, y / 10])).length;
  if (offshore > 0.02 * pts.length) throw new Error(`${offshore} of ${pts.length} ${name} points are in the sea`);
}

// ── Write ──

const stroke = (colour, width) => `fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
const path = (attrs, parts, close, lead = "") => (parts.length ? `<path ${attrs} d="${lead}${toPath(parts, close)}"/>\n` : "");
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="none">\n` +
  `<!-- Written by scripts/build-island-map.mjs; do not edit by hand. Map data © OpenStreetMap contributors (ODbL), tiles © OpenMapTiles via OpenFreeMap. -->\n` +
  // The sea is the whole view with the island's rings as holes: the land is left clear.
  path(`fill="${COLOUR.water}" fill-rule="evenodd"`, layersOut.land, true, `M0 0H${VIEW_W}V${VIEW_H}H0z`) +
  path(`fill="${COLOUR.green}" fill-opacity="${GREEN_OPACITY}"`, layersOut.green, true) +
  path(`fill="${COLOUR.built}" fill-opacity="${BUILT_OPACITY}"`, layersOut.built, true) +
  path(`fill="${COLOUR.water}"`, layersOut.water, true) +
  path(stroke(COLOUR.shore, LAKE_EDGE_WIDTH), layersOut.lakeEdge, false) +
  path(stroke(COLOUR.secondary, SECONDARY_WIDTH), layersOut.secondary, false) +
  path(stroke(COLOUR.primary, PRIMARY_WIDTH), layersOut.primary, false) +
  path(stroke(COLOUR.motorway, MOTORWAY_WIDTH), layersOut.motorway, false) +
  path(stroke(COLOUR.shore, COAST_WIDTH), layersOut.land, true) +
  `</svg>\n`;

const bytes = Buffer.byteLength(svg);
console.log(`svg: ${bytes} bytes, ${gzipSync(svg, { level: 9 }).length} gzipped`);
if (bytes > MAX_BYTES) throw new Error(`the map is ${bytes} bytes, over the ${MAX_BYTES} budget: raise AREA_TOLERANCE or MIN_AREA, then drop the shortest secondary roads`);

mkdirSync(dirname(OUT_SVG), { recursive: true });
writeFileSync(OUT_SVG, svg);
console.log(`wrote ${OUT_SVG}`);
