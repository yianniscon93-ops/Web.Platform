// Builds the drawn town maps that the landing page's first screen shows as
// pictures, one for each town in TOWNS (its old streets and seafront, about
// 3.3 km square), and the projections that go with them:
//
//   public/landing/town-<key>.svg   a town's map: land, green, sand, sea and
//                                   its shoreline, piers, buildings, roads. No
//                                   text. All are drawn the same way, so they
//                                   read as one set.
//   src/lib/landing/heroTowns.ts    each map's file, size and projection, so
//                                   the page can pin a place on it by latitude
//                                   and longitude.
//
// Rerun from apps/web after changing the towns or the ground shown (TOWNS), the
// colours or what is drawn; one run builds every town, and writes nothing if
// any town fails a check:
//
//   node scripts/build-hero-town.mjs
//
// Needs Node 18+ and network access: it downloads z14 vector tiles from
// OpenFreeMap (OpenMapTiles schema, OpenStreetMap data), 6 or 9 for each town.
// Set LANDING_MAPS_CACHE=<dir> to keep the tiles between runs (the same cache
// build-landing-maps.mjs uses). The page itself never requests a tile.
//
// The colours are the page's tokens, baked in: an SVG shown as an image cannot
// read CSS variables. If a token changes, change it here and rerun.
//
// This script first drew Limassol alone, as public/landing/hero-town.svg with
// src/lib/landing/heroTown.ts. It no longer writes those two: town-limassol.svg
// is the same drawing, and they can go once nothing imports heroTown.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const TILEJSON = "https://tiles.openfreemap.org/planet";
const Z = 14;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public/landing"); // town-<key>.svg, one for each town
const OUT_TS = join(ROOT, "src/lib/landing/heroTowns.ts");
const CACHE = process.env.LANDING_MAPS_CACHE;

// The towns and the ground shown of each: the latitudes `south` to `north`, and
// as far west and east of the longitude `lng` as makes that ground square (see
// the projection below). `sea` and `land` are [lat, lng] of a point in the open
// sea and of one in the built-up town, for the check that the water is the
// right way round. The order here is the order in heroTowns.ts.
const TOWNS = [
  // The old port and castle are near 34.672 N 33.042 E, the marina just west of them; the seafront runs north-east from there.
  { key: "limassol", name: "Limassol", south: 34.665, north: 34.695, lng: 33.04, sea: [34.667, 33.052], land: [34.69, 33.03] },
  // Kato Paphos: the harbour and castle are near 34.7545 N 32.4075 E, the hotel seafront runs east from there.
  { key: "paphos", name: "Paphos", south: 34.745, north: 34.775, lng: 32.418, sea: [34.748, 32.405], land: [34.77, 32.425] },
  // The Finikoudes promenade and the marina are near 34.915 N 33.6385 E; the sea is to the east.
  { key: "larnaca", name: "Larnaca", south: 34.898, north: 34.928, lng: 33.628, sea: [34.91, 33.644], land: [34.915, 33.625] },
  // Fig Tree Bay is near 35.0122 N 34.0585 E; the sea is to the north-east (a headland closes the bay on its east, so the sea point is off the long beach north of it).
  { key: "protaras", name: "Protaras", south: 34.998, north: 35.028, lng: 34.046, sea: [35.022, 34.058], land: [35.015, 34.05] },
];
const VIEW = 1600; // each view is VIEW × VIEW units, about 2.1 m to a unit
const MAX_BYTES = 450_000;

const COLOUR = {
  land: "#FBFAF4",
  green: "#DFE7CF",
  sand: "#F3EAD3",
  water: "#C2DADF",
  shore: "#6F929B",
  building: "#E9E3D3",
  minor: "#D2CCBB",
  major: "#B7B09C",
};
const SHORE_WIDTH = 1.2;
const MINOR_WIDTH = 2.2;
const MAJOR_WIDTH = 5;

// What is taken from the tiles (OpenMapTiles layer → classes).
const GREEN_LANDCOVER = new Set(["grass", "wood"]);
const GREEN_LANDUSE = new Set(["cemetery", "pitch", "stadium", "playground", "track"]);
const MAJOR = new Set(["motorway", "trunk", "primary", "secondary"]);
const MINOR = new Set(["tertiary", "minor", "service"]); // "minor" is residential and unclassified
// Of the `path` class only pedestrian streets are drawn: at street width, footways and steps read as streets that are not there.
const MINOR_PATHS = new Set(["pedestrian"]);
// Service ways that are yards, not streets.
const SKIP_SERVICE = new Set(["parking_aisle", "driveway"]);

const MARGIN = 4; // units kept beyond the view so strokes run off the edge
const TILE_OVERLAP = 16; // tile units (of 4096) a filled shape keeps beyond its tile's edge, so neighbours overlap and leave no seam
const ROAD_TOLERANCE = 0.6; // Douglas–Peucker, in view units
const SEA_TOLERANCE = 0.5;
const AREA_TOLERANCE = 0.8; // green and sand
const BUILDING_TOLERANCE = 0.6;
// The smallest shapes kept, in units² (a unit² is about 4.3 m²), measured before the tiles and the view cut them.
const MIN_WATER_AREA = 60; // drops pools and fountains
const MIN_AREA = 12; // green and sand
const MIN_BUILDING_AREA = 3;
const MIN_PIECE = 1; // what a cut and rounded piece must still cover to be written

// ── Projection: equirectangular, longitude scaled by the cosine of the middle latitude ──
// Scale is set by the town's latitudes; the longitudes are then centred on its
// `lng`, so the view is true to shape: as wide on the ground as it is tall.

const round = (v, places) => Number(v.toFixed(places));
/** A town's view: its edges in degrees, its scale, and `project`, [lat, lng] to view units (the same sum heroTowns.ts exports as townXY). */
function projection(town) {
  const midLat = (town.south + town.north) / 2;
  const perLat = round(VIEW / (town.north - town.south), 3);
  const perLng = round(perLat * Math.cos((midLat * Math.PI) / 180), 3);
  const north = town.north;
  const west = round(town.lng - VIEW / perLng / 2, 6);
  const south = north - VIEW / perLat;
  const east = west + VIEW / perLng;
  const project = (lat, lng) => [(lng - west) * perLng, (north - lat) * perLat];
  return { west, east, south, north, perLng, perLat, project };
}

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

const VIEW_LO = [-MARGIN, -MARGIN];
const VIEW_HI = [VIEW + MARGIN, VIEW + MARGIN];

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

const roundPts = (pts) => {
  const out = [];
  for (const [x, y] of pts) {
    const p = [Math.round(x), Math.round(y)];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
};

/** A ring simplified and rounded, its closing point not repeated. */
function tidyRing(ring, tolerance) {
  const pts = roundPts(simplify(ring, tolerance));
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

/** Joins lines that meet end to end, so shared points are written once. */
function mergeLines(lines) {
  const key = (p) => `${p[0]},${p[1]}`;
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

/** Lines merged end to end, simplified and rounded. */
const tidyLines = (lines, tolerance) =>
  mergeLines(lines.map(roundPts).filter((l) => l.length > 1))
    .map((l) => roundPts(simplify(l, tolerance)))
    .filter((l) => l.length > 1);

/** Parts ordered so each starts near the last one's start (in rows, there and back), which keeps the moves between them short. */
function nearOrder(parts) {
  const ROW = 40;
  const row = (p) => Math.floor(p[0][1] / ROW);
  return [...parts].sort((a, b) => row(a) - row(b) || (row(a) % 2 ? b[0][0] - a[0][0] : a[0][0] - b[0][0]));
}

/**
 * Compact path data, all relative: a move to each part's first point (a
 * path's first move counts from 0,0), then its line segments, which need no
 * letter after a relative move.
 */
function toPath(parts, close) {
  let d = "";
  let from = [0, 0];
  for (const pts of parts) {
    let seg = "";
    let prev = from;
    for (const p of pts) {
      for (const n of [p[0] - prev[0], p[1] - prev[1]]) seg += (seg && n >= 0 ? " " : "") + n;
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

/** Whether a point is inside the rings, filled with the nonzero rule as their path fills them. */
function covers(rings) {
  const info = rings.map((ring) => ({
    ring,
    sign: Math.sign(ringArea(ring)),
    x0: Math.min(...ring.map((p) => p[0])),
    x1: Math.max(...ring.map((p) => p[0])),
    y0: Math.min(...ring.map((p) => p[1])),
    y1: Math.max(...ring.map((p) => p[1])),
  }));
  return (pt) =>
    info.reduce(
      (n, r) => n + (pt[0] >= r.x0 && pt[0] <= r.x1 && pt[1] >= r.y0 && pt[1] <= r.y1 && pointInRing(pt, r.ring) ? r.sign : 0),
      0
    ) !== 0;
}

/** A cut ring's own edges: all but those the cut made, which lie along a side of the box it was cut to. */
function ownEdges(ring, [lo, hi]) {
  const along = (a, b) => [0, 1].some((k) => [lo[k], hi[k]].some((side) => Math.abs(a[k] - side) < 1e-6 && Math.abs(b[k] - side) < 1e-6));
  return ring.map((a, i) => [a, ring[(i + 1) % ring.length]]).filter(([a, b]) => !along(a, b));
}

/**
 * The water's edge as lines: the parts of the edges (of water and of pier
 * areas) that have open water on one side only. A pier lies over water or runs
 * onto land and water bodies overlap, so no ring's own outline will do; and an
 * edge can pass from shore to not, so it is judged a short step at a time.
 */
function shoreline(edges, sea) {
  const STEP = 2; // view units
  const seen = new Set(); // overlapping shapes can share an edge: each rounded segment is taken once
  const segments = [];
  for (const [a, b] of edges) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len === 0) continue;
    const n = [((b[1] - a[1]) / len) * 0.3, (-(b[0] - a[0]) / len) * 0.3];
    const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const steps = Math.ceil(len / STEP);
    let from = -1; // the step a run of shore began at
    for (let i = 0; i <= steps; i++) {
      const mid = at((i + 0.5) / steps);
      const shore = i < steps && sea([mid[0] + n[0], mid[1] + n[1]]) !== sea([mid[0] - n[0], mid[1] - n[1]]);
      if (shore && from < 0) from = i;
      if (shore || from < 0) continue;
      const [ra, rb] = roundPts([from === 0 ? a : at(from / steps), i === steps ? b : at(i / steps)]);
      from = -1;
      if (!rb) continue; // rounds to a single point
      const key = [ra.join(), rb.join()].sort().join(" ");
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push([ra, rb]);
    }
  }
  return segments;
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

/** One town's map and its entry in heroTowns.ts: { file, svg, entry }. Throws if a check fails; logs what it found and drew. */
async function build(town) {
  const { west, east, south, north, perLng, perLat, project } = projection(town);

  const x0 = Math.floor(lngToTile(west));
  const x1 = Math.floor(lngToTile(east));
  const y0 = Math.floor(latToTile(north));
  const y1 = Math.floor(latToTile(south));

  // Rings and lines in view units, cut to their tile and the view. The shoreline
  // is read from the water and pier rings cut at the tile's edge exactly, so it is
  // not drawn twice where tiles overlap: `coast` is those rings' own edges, and
  // `waterExact` and `pierExact` the rings, to tell which side of an edge is sea.
  const raw = { green: [], sand: [], water: [], building: [], pierArea: [], pier: [], minor: [], major: [], coast: [], waterExact: [], pierExact: [] };
  const minArea = { green: MIN_AREA, sand: MIN_AREA, water: MIN_WATER_AREA, building: MIN_BUILDING_AREA, pierArea: MIN_PIECE };
  const found = {}; // "layer class kind" → features in the tiles, for the log
  const used = {}; // the same → where they were drawn and how many
  let tiles = 0;

  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      const layers = readTile(await fetchTile(template, tx, ty), ["water", "landcover", "landuse", "park", "building", "transportation"]);
      tiles++;
      for (const [name, layer] of Object.entries(layers)) {
        const toView = ([px, py]) => project(tileToLat(ty + py / layer.extent), tileToLng(tx + px / layer.extent));
        // The tile's own ground and `pad` tile units round it, no further than the view: [lo, hi] in view units.
        const box = (pad) => {
          const lo = toView([-pad, -pad]);
          const hi = toView([layer.extent + pad, layer.extent + pad]);
          return [VIEW_LO.map((v, k) => Math.max(v, lo[k])), VIEW_HI.map((v, k) => Math.min(v, hi[k]))];
        };
        const rings = (f, pad, least) =>
          f.geometry
            .map((ring) => ring.map(toView))
            .filter((ring) => Math.abs(ringArea(ring)) >= least)
            .map((ring) => clipRing(ring, ...box(pad)))
            .filter((ring) => ring.length > 2);
        const lines = (f) => f.geometry.flatMap((line) => clipLine(line.map(toView), ...box(0)));

        for (const f of layer.features) {
          const cls = f.props.class ?? "";
          const label = `${name} ${cls}${f.props.subclass && f.props.subclass !== cls ? `/${f.props.subclass}` : ""} ${["", "point", "line", "polygon"][f.type]}`;
          found[label] = (found[label] ?? 0) + 1;
          let into = null;
          if (name === "transportation") {
            if (f.props.brunnel === "tunnel") continue;
            if (f.type === 2) {
              if (cls === "pier") into = "pier";
              else if (MAJOR.has(cls)) into = "major";
              else if (cls === "service" ? !SKIP_SERVICE.has(f.props.service) : MINOR.has(cls)) into = "minor";
              else if (cls === "path" && MINOR_PATHS.has(f.props.subclass)) into = "minor";
            } else if (f.type === 3 && cls === "pier") into = "pierArea";
          } else if (f.type === 3) {
            if (name === "water") into = cls === "swimming_pool" ? null : "water";
            else if (name === "building") into = "building";
            else if (name === "park") into = "green";
            else if (name === "landcover") into = GREEN_LANDCOVER.has(cls) ? "green" : cls === "sand" ? "sand" : null;
            else if (name === "landuse") into = GREEN_LANDUSE.has(cls) ? "green" : null;
          }
          if (!into) continue;
          const got = f.type === 3 ? rings(f, TILE_OVERLAP, minArea[into]) : lines(f);
          if (!got.length) continue; // outside the view, or too small
          raw[into].push(...got);
          if (into === "water" || into === "pierArea") {
            for (const ring of rings(f, 0, minArea[into])) {
              raw[into === "water" ? "waterExact" : "pierExact"].push(ring);
              raw.coast.push(...ownEdges(ring, box(0)));
            }
          }
          used[label] ??= { into, count: 0 };
          used[label].count++;
        }
      }
    }
  }

  const areas = (rings, tolerance) =>
    nearOrder(rings.map((ring) => tidyRing(ring, tolerance)).filter((ring) => ring.length > 2 && Math.abs(ringArea(ring)) >= MIN_PIECE));

  const wet = covers(raw.waterExact);
  const onPier = covers(raw.pierExact);
  const layersOut = {
    green: areas(raw.green, AREA_TOLERANCE),
    sand: areas(raw.sand, AREA_TOLERANCE),
    water: areas(raw.water, SEA_TOLERANCE),
    shore: tidyLines(shoreline(raw.coast, (pt) => wet(pt) && !onPier(pt)), SEA_TOLERANCE),
    pierArea: areas(raw.pierArea, SEA_TOLERANCE),
    pier: tidyLines(raw.pier, ROAD_TOLERANCE),
    building: areas(raw.building, BUILDING_TOLERANCE),
    minor: tidyLines(raw.minor, ROAD_TOLERANCE),
    major: tidyLines(raw.major, ROAD_TOLERANCE),
  };

  // Sea and land the right way round: the town's point in the open sea is water, its point in the town is not.
  const sea = project(...town.sea);
  const land = project(...town.land);
  for (const v of [...sea, ...land]) {
    if (v < 0 || v > VIEW) throw new Error(`${town.name}: a sea or land check point is outside the view`);
  }
  if (!wet(sea) || wet(land)) throw new Error(`${town.name}: the water layer has sea and land swapped`);
  // No shape but the sea may cover a large part of the view (a protected area drawn as a park would).
  for (const key of ["green", "sand", "building"]) {
    for (const ring of layersOut[key]) {
      if (Math.abs(ringArea(ring)) > 0.25 * VIEW * VIEW) throw new Error(`${town.name}: a ${key} shape covers over a quarter of the view`);
    }
  }

  const line = (colour, width) => `fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
  const path = (attrs, parts, close) => (parts.length ? `<path ${attrs} d="${toPath(parts, close)}"/>\n` : "");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}">\n` +
    `<!-- Written by scripts/build-hero-town.mjs; do not edit by hand. Map data © OpenStreetMap contributors (ODbL), tiles © OpenMapTiles via OpenFreeMap. -->\n` +
    `<rect width="${VIEW}" height="${VIEW}" fill="${COLOUR.land}"/>\n` +
    path(`fill="${COLOUR.green}"`, layersOut.green, true) +
    path(`fill="${COLOUR.sand}"`, layersOut.sand, true) +
    path(`fill="${COLOUR.water}"`, layersOut.water, true) +
    // Piers are land: areas under the shoreline, which runs round them, and lines cased to match it.
    path(`fill="${COLOUR.land}"`, layersOut.pierArea, true) +
    path(line(COLOUR.shore, SHORE_WIDTH), layersOut.shore, false) +
    path(line(COLOUR.shore, MINOR_WIDTH + 2 * SHORE_WIDTH), layersOut.pier, false) +
    path(line(COLOUR.land, MINOR_WIDTH), layersOut.pier, false) +
    path(`fill="${COLOUR.building}"`, layersOut.building, true) +
    path(line(COLOUR.minor, MINOR_WIDTH), layersOut.minor, false) +
    path(line(COLOUR.major, MAJOR_WIDTH), layersOut.major, false) +
    `</svg>\n`;

  console.log(`\n${town.name}: ${tiles} tiles (z${Z}, x ${x0} to ${x1}, y ${y0} to ${y1})`);
  console.log(`view: ${south.toFixed(6)} to ${north} N, ${west} to ${east.toFixed(6)} E`);
  console.log("in the tiles (layer class/subclass kind: features, with what drew them):");
  for (const label of Object.keys(found).sort()) console.log(`  ${label}: ${found[label]}${used[label] ? `  → ${used[label].into} ×${used[label].count}` : ""}`);
  console.log("drawn:");
  for (const [key, parts] of Object.entries(layersOut)) {
    console.log(`  ${key}: ${parts.length} ${["shore", "pier", "minor", "major"].includes(key) ? "lines" : "rings"}, ${parts.reduce((n, p) => n + p.length, 0)} points`);
  }
  const bytes = Buffer.byteLength(svg);
  console.log(`svg: ${bytes} bytes, ${gzipSync(svg, { level: 9 }).length} gzipped`);
  if (bytes > MAX_BYTES) throw new Error(`${town.name}: the map is ${bytes} bytes, over the ${MAX_BYTES} budget: raise BUILDING_TOLERANCE or MIN_BUILDING_AREA`);

  const entry = `{ key: "${town.key}", name: "${town.name}", src: "/landing/town-${town.key}.svg", width: ${VIEW}, height: ${VIEW}, west: ${west}, north: ${north}, perLng: ${perLng}, perLat: ${perLat} }`;
  return { file: join(OUT_DIR, `town-${town.key}.svg`), svg, entry };
}

// Every town is built and checked before anything is written, so a failed check leaves the last good set in place.
const built = [];
for (const town of TOWNS) built.push(await build(town));

const ts = `// Written by scripts/build-hero-town.mjs; do not edit by hand.
/** One of the first screen's drawn town maps: its file, its size in view units, and where a place falls on it. */
export interface HeroTown {
  key: ${TOWNS.map((t) => `"${t.key}"`).join(" | ")};
  name: string;
  src: string;
  width: number;
  height: number;
  west: number;
  north: number;
  /** View units per degree of longitude and of latitude. */
  perLng: number;
  perLat: number;
}
export const HERO_TOWNS: HeroTown[] = [
${built.map((b) => `  ${b.entry},\n`).join("")}];
/** [lat, lng] to a town map's view units. */
export const townXY = (town: HeroTown, lat: number, lng: number): [number, number] => [(lng - town.west) * town.perLng, (town.north - lat) * town.perLat];
`;

mkdirSync(OUT_DIR, { recursive: true });
console.log("");
for (const { file, svg } of built) {
  writeFileSync(file, svg);
  console.log(`wrote ${file}`);
}
writeFileSync(OUT_TS, ts);
console.log(`wrote ${OUT_TS}`);
