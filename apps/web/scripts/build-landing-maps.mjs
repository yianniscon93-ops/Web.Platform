// Builds src/lib/landing/areaBasemaps.ts: the street basemap (sea, shoreline,
// roads and up to three place names) of each place in the landing hero.
//
// Rerun from apps/web after changing HERO_AREAS, the view in areaView.ts, or
// the map's layout in globals.css (then update FRAMES below first):
//
//   node scripts/build-landing-maps.mjs
//
// Needs Node 23.6+ (it imports the two .ts files below directly) and network
// access: it downloads z14 vector tiles from OpenFreeMap (OpenMapTiles schema,
// OpenStreetMap data), 35 per area. Set LANDING_MAPS_CACHE=<dir> to keep
// the tiles between runs. The page itself never requests a tile.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HERO_AREAS } from "../src/lib/landing/compare.ts";
import { VIEW_H, VIEW_W, areaView, project } from "../src/lib/landing/areaView.ts";
import { rightmost } from "../src/lib/landing/polygon.ts";

const TILEJSON = "https://tiles.openfreemap.org/planet";
const Z = 14;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/landing/areaBasemaps.ts");
const CACHE = process.env.LANDING_MAPS_CACHE;

const MAJOR = new Set(["motorway", "trunk", "primary", "secondary"]);
const MINOR = new Set(["tertiary", "minor"]); // "minor" is residential and unclassified
const MARGIN = 6; // units kept beyond the view so strokes run off the edge
const ROAD_TOLERANCE = 1.1; // Douglas–Peucker, in view units
const SEA_TOLERANCE = 0.8;
const MIN_WATER_AREA = 60; // units²; drops pools and ponds
const MAX_LABELS = 3; // per map: the locality, a water name if one fits, then the next biggest places
const PLACE_CLASSES = ["city", "town", "village", "suburb", "quarter", "neighbourhood"];
// The frames the map is shown in, measured on the built page at each window
// size (the layout is in globals.css; measure again if it changes). The frame
// crops the 4:3 view, so each has `u` (view units per CSS pixel), the part of
// the view left showing (`x`, `y`), and the boxes of the place switch, the
// island locator and the invitation beside the inviting corner (`cue`, per
// place: both wordings, "Drag a corner, or the whole area" and the touch one,
// taken together), all in view units. Where the invitation goes is worked out
// in globals.css (.th-cue-label) and differs from frame to frame, so its box
// is measured, not derived. Windows under 700px tall crop the view further
// (the stage is never shorter than that); a name the crop removes whole there
// is no loss, so those are not frames here.
const FRAMES = [
  { name: "1440x900 and larger", u: 1.088, x: [2, 798], y: [0, 599], switch: [543, 13, 784, 63], locator: [13, 552, 74, 589], cue: { A: [416, 122, 688, 141], B: [144, 481, 416, 500] } },
  { name: "1440x800", u: 1.095, x: [0, 800], y: [31, 568], switch: [544, 44, 787, 94], locator: [11, 520, 72, 557], cue: { A: [416, 122, 690, 141], B: [142, 481, 416, 500] } },
  { name: "1366x768", u: 1.164, x: [0, 800], y: [29, 570], switch: [528, 43, 787, 97], locator: [12, 518, 77, 559], cue: { A: [417, 122, 708, 141], B: [126, 482, 417, 502] } },
  { name: "1280x720", u: 1.255, x: [0, 799], y: [34, 565], switch: [507, 49, 784, 107], locator: [13, 508, 83, 552], cue: { A: [419, 121, 733, 142], B: [105, 483, 419, 504] } },
  { name: "1100x800", u: 1.231, x: [66, 734], y: [0, 600], switch: [446, 15, 719, 71], locator: [79, 545, 148, 588], cue: { A: [418, 111, 659, 152], B: [155, 483, 418, 523] } },
  { name: "1024x768", u: 1.317, x: [72, 727], y: [0, 600], switch: [420, 16, 711, 76], locator: [86, 541, 159, 586], cue: { A: [420, 110, 678, 153], B: [167, 484, 420, 527] } },
  { name: "768", u: 1.14, x: [0, 800], y: [0, 600], switch: [535, 14, 787, 73], locator: [11, 549, 75, 589], cue: { A: [417, 122, 702, 141], B: [132, 482, 417, 501] } },
  { name: "640", u: 1.394, x: [0, 800], y: [0, 600], switch: [475, 17, 783, 89], locator: [14, 538, 92, 587], cue: { A: [421, 119, 769, 143], B: [100, 485, 422, 531] } },
  { name: "390", u: 1.685, x: [98, 701], y: [0, 600], switch: [371, 15, 684, 89], locator: [116, 524, 211, 583], cue: { A: [429, 103, 670, 159], B: [221, 488, 427, 571] } },
  { name: "360", u: 1.841, x: [98, 701], y: [0, 600], switch: [341, 17, 683, 98], locator: [118, 517, 221, 582], cue: { A: [437, 109, 700, 169], B: [233, 490, 431, 580] } },
];
// The part of the view every frame shows: a name's own point has to be in it.
const SHOWN = {
  x: [Math.max(...FRAMES.map((f) => f.x[0])), Math.min(...FRAMES.map((f) => f.x[1]))],
  y: [Math.max(...FRAMES.map((f) => f.y[0])), Math.min(...FRAMES.map((f) => f.y[1]))],
};
const LABEL_GAP = 4; // CSS pixels kept clear around a label's box
const HANDLE = 11; // CSS pixels from a handle's centre to the edge of its focus ring

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

const LO = [-MARGIN, -MARGIN];
const HI = [VIEW_W + MARGIN, VIEW_H + MARGIN];

/** The pieces of a line that fall inside the view (Liang–Barsky per segment). */
function clipLine(line) {
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
        [-d, a[k] - LO[k]],
        [d, HI[k] - a[k]],
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

/** A ring cut to the view (Sutherland–Hodgman against each side). */
function clipRing(ring) {
  let pts = ring;
  for (const k of [0, 1]) {
    for (const [bound, keepBelow] of [
      [LO[k], false],
      [HI[k], true],
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
    const len = Math.hypot(dx, dy) || 1;
    let worst = 0;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / len;
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

/** Compact path data: absolute move, then relative line segments. */
function toPath(parts, close) {
  let d = "";
  for (const pts of parts) {
    d += `M${pts[0][0]} ${pts[0][1]}l`;
    let seg = "";
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      seg += (seg && dx >= 0 ? " " : "") + dx + (dy >= 0 ? " " : "") + dy;
    }
    d += seg + (close ? "z" : "");
  }
  return d;
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

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * The water's edge as lines. The tiles cut the sea into overlapping pieces, so
 * an edge only counts where one side of it is water and the other is not.
 */
function shoreline(rings) {
  const areas = rings.map(ringArea);
  const wet = (pt) => rings.reduce((n, ring, i) => n + (pointInRing(pt, ring) ? Math.sign(areas[i]) : 0), 0) !== 0;
  const inView = ([x, y]) => x >= 0 && x <= VIEW_W && y >= 0 && y <= VIEW_H;
  // Neighbouring tiles repeat the coast inside their shared buffer, so each rounded segment is taken once.
  const seen = new Set();
  const segments = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len === 0 || !(inView(a) || inView(b))) continue;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const n = [((b[1] - a[1]) / len) * 0.5, (-(b[0] - a[0]) / len) * 0.5];
      if (wet([mid[0] + n[0], mid[1] + n[1]]) === wet([mid[0] - n[0], mid[1] - n[1]])) continue;
      const [ra, rb] = roundPts([a, b]);
      if (!rb) continue; // rounds to a single point
      const key = [ra.join(), rb.join()].sort().join(" ");
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push([ra, rb]);
    }
  }
  return segments;
}

// Never a translated or invented name: the tile's English name, or its plain name when that is already in Latin script.
const latinName = (props) =>
  props["name:en"] ? { name: props["name:en"], field: "name:en" }
  : props.name && /^[\u0020-\u024F]+$/.test(props.name) ? { name: props.name, field: "name" }
  : null;

/**
 * Up to MAX_LABELS place names for one map: the locality the area is named
 * for, then a water name near it (the water_name layer; a marina's name in the
 * poi layer is the operator's, not the water's), then the biggest other
 * places. A label may be set a little off its point. It is only kept where, in
 * every frame the map is shown in, its box is on the map, clear of the area's
 * outline as first drawn (wholly inside or wholly beside it) and of its
 * handles, clear of the line that runs from the area's right-most corner to
 * the panels, clear of the place switch, the island locator, the invitation
 * beside the inviting corner and the labels already placed; a water name only
 * where the whole word lies on water.
 */
function chooseLabels(area, polygon, named, wet) {
  const outline = polygon.flatMap((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
    return Array.from({ length: steps }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps]);
  });
  const lead = polygon[rightmost(polygon)];
  // Half the label's box in view units. The width is an estimate of the 11px
  // semibold setting from rough letter widths (in ems), within a pixel or two
  // of the names measured in the browser; a water name adds its tracking.
  const em = (ch) =>
    "iljI".includes(ch) || ch === " " ? 0.25 : "rtf-.'".includes(ch) ? 0.36 : "mwMW".includes(ch) ? 0.87 : ch === ch.toLowerCase() ? 0.56 : 0.64;
  const widthPx = (label) =>
    11 * ([...label.name].reduce((sum, ch) => sum + em(ch), 0) + (label.kind === "water" ? 0.08 * label.name.length : 0));
  const half = (label, u) => ({ hw: (widthPx(label) * u) / 2, hh: 6 * u });
  const hits = (label, w, h, box) =>
    box && label.x + w > box[0] && label.x - w < box[2] && label.y + h > box[1] && label.y - h < box[3];
  const fits = (label, placed) =>
    FRAMES.every((frame) => {
      const { u } = frame;
      const { hw, hh } = half(label, u);
      const w = hw + LABEL_GAP * u;
      const h = hh + LABEL_GAP * u;
      return (
        label.x - w >= frame.x[0] &&
        label.x + w <= frame.x[1] &&
        label.y - h >= frame.y[0] &&
        label.y + h <= frame.y[1] &&
        !outline.some(([x, y]) => Math.abs(x - label.x) < w && Math.abs(y - label.y) < h) &&
        !polygon.some(([x, y]) => Math.abs(x - label.x) < w + HANDLE * u && Math.abs(y - label.y) < h + HANDLE * u) &&
        !(label.x + w > lead[0] && Math.abs(label.y - lead[1]) < h + 2 * u) &&
        !hits(label, w, h, frame.switch) &&
        !hits(label, w, h, frame.locator) &&
        !hits(label, w, h, frame.cue[area.key]) &&
        !placed.some((other) => {
          const o = half(other, u);
          return Math.abs(other.x - label.x) < w + o.hw && Math.abs(other.y - label.y) < h + o.hh;
        })
      );
    });
  const centre = [0, 1].map((k) => polygon.reduce((sum, v) => sum + v[k], 0) / polygon.length);
  const near = (p) => Math.hypot(p.x - centre[0], p.y - centre[1]);
  // [candidates, how many of them a map may take]
  const groups = [
    [named.filter((p) => p.layer === "place" && p.name === area.name).map((p) => ({ ...p, kind: "place" })), 1],
    [
      named
        .filter((p) => p.layer === "water_name")
        .sort((a, b) => near(a) - near(b))
        .map((p) => ({ ...p, kind: "water" })),
      1,
    ],
    [
      named
        .filter((p) => p.layer === "place" && PLACE_CLASSES.includes(p.class) && !wet([p.x, p.y]))
        .sort((a, b) => PLACE_CLASSES.indexOf(a.class) - PLACE_CLASSES.indexOf(b.class) || (a.rank ?? 99) - (b.rank ?? 99))
        .map((p) => ({ ...p, kind: "place" })),
      MAX_LABELS,
    ],
  ];
  const widest = Math.max(...FRAMES.map((f) => f.u));
  const labels = [];
  for (const [group, most] of groups) {
    let taken = 0;
    for (const p of group) {
      if (labels.length === MAX_LABELS || taken === most) break;
      if (labels.some((l) => l.name === p.name)) continue;
      const { hw, hh } = half(p, widest);
      // How far the text may sit from its point, in view units (about 13 m each):
      // far enough to stand beside a narrow area it cannot fit inside, no further.
      // A bay's name stays closer, or it would label open sea.
      const reach = p.kind === "water" ? { x: 70, y: 40 } : { x: 160, y: 40 };
      const spots = [];
      for (let dx = -reach.x; dx <= reach.x; dx += 5) {
        for (let dy = -reach.y; dy <= reach.y; dy += 5) {
          const label = { ...p, x: p.x + dx, y: p.y + dy };
          const box = [-1, -0.5, 0, 0.5, 1].flatMap((i) => [-1, 0, 1].map((j) => [label.x + i * hw, label.y + j * hh]));
          const inside = pointInRing([label.x, label.y], polygon);
          // What the text sits on decides its halo. A place name never goes on water.
          label.on = p.kind === "water" ? "water" : inside ? "area" : "land";
          const ground = p.kind === "water" ? box.every(wet) : !box.some(wet);
          if (ground && fits(label, labels)) spots.push({ label, far: Math.hypot(dx, dy) });
        }
      }
      spots.sort((a, b) => a.far - b.far);
      if (spots.length) {
        labels.push(spots[0].label);
        taken++;
      } else console.log(`  no room for "${p.name}" (${p.layer}.${p.field})`);
    }
  }
  return labels;
}

async function buildArea(area, template) {
  const view = areaView(area.polygon);
  const east = view.west + VIEW_W / view.sx;
  const south = view.north - VIEW_H / view.sy;
  const x0 = Math.floor(lngToTile(view.west));
  const x1 = Math.floor(lngToTile(east));
  const y0 = Math.floor(latToTile(view.north));
  const y1 = Math.floor(latToTile(south));

  const roads = { major: [], minor: [] };
  const sea = [];
  const rawSea = [];
  const named = [];
  let tiles = 0;
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      const layers = readTile(await fetchTile(template, tx, ty), ["water", "transportation", "place", "water_name"]);
      tiles++;
      const toView = (extent) => ([px, py]) =>
        project(view, tileToLat(ty + py / extent), tileToLng(tx + px / extent));

      for (const f of layers.transportation?.features ?? []) {
        const weight = MAJOR.has(f.props.class) ? "major" : MINOR.has(f.props.class) ? "minor" : null;
        if (!weight || f.type !== 2) continue;
        const to = toView(layers.transportation.extent);
        for (const line of f.geometry) roads[weight].push(...clipLine(line.map(to)));
      }
      for (const f of layers.water?.features ?? []) {
        if (f.type !== 3 || f.props.class === "swimming_pool") continue;
        const to = toView(layers.water.extent);
        for (const ring of f.geometry) {
          const clipped = clipRing(ring.map(to));
          const pts = roundPts(simplify(clipped, SEA_TOLERANCE));
          if (pts.length < 3 || Math.abs(ringArea(pts)) < MIN_WATER_AREA) continue;
          sea.push(pts);
          rawSea.push(clipped);
        }
      }
      for (const layer of ["place", "water_name"]) {
        for (const f of layers[layer]?.features ?? []) {
          // Only points that sit in this tile proper; the buffer repeats its neighbours'.
          const [px, py] = f.geometry[0]?.[0] ?? [-1, -1];
          const extent = layers[layer].extent;
          const found = latinName(f.props);
          if (f.type !== 1 || !found || px < 0 || py < 0 || px >= extent || py >= extent) continue;
          const [x, y] = toView(extent)([px, py]);
          // A name is only a candidate where its own point is on the map in every frame.
          if (x < SHOWN.x[0] || x > SHOWN.x[1] || y < SHOWN.y[0] || y > SHOWN.y[1]) continue;
          named.push({ ...found, layer, class: f.props.class, rank: f.props.rank, x: Math.round(x), y: Math.round(y) });
        }
      }
    }
  }

  const finish = (lines) =>
    mergeLines(lines.map(roundPts).filter((l) => l.length > 1))
      .map((l) => roundPts(simplify(l, ROAD_TOLERANCE)))
      .filter((l) => l.length > 1);
  const major = finish(roads.major);
  const minor = finish(roads.minor);
  const shore = mergeLines(shoreline(rawSea).map(roundPts).filter((l) => l.length > 1))
    .map((l) => roundPts(simplify(l, SEA_TOLERANCE)))
    .filter((l) => l.length > 1);

  const polygon = area.polygon.map(([lat, lng]) => project(view, lat, lng));
  const areas = rawSea.map(ringArea);
  const wet = (pt) => rawSea.reduce((n, ring, i) => n + (pointInRing(pt, ring) ? Math.sign(areas[i]) : 0), 0) !== 0;
  const labels = chooseLabels(area, polygon, named, wet);

  console.log(
    `${area.name}: ${tiles} tiles, ${major.length} major and ${minor.length} minor lines, ${sea.length} sea rings`
  );
  console.log(`  shoreline: ${shore.length} lines`);
  for (const l of labels) console.log(`  label: ${l.name} (${l.kind}, on ${l.on}; ${l.layer} layer, class ${l.class}, field ${l.field}) at ${l.x},${l.y}`);
  if (!labels.length) throw new Error(`${area.name}: no label fits; every map needs at least its locality`);
  return {
    sea: toPath(sea, true),
    shore: toPath(shore, false),
    major: toPath(major, false),
    minor: toPath(minor, false),
    labels: labels.map(({ name, kind, on, x, y, layer, field }) => ({ name, kind, on, x, y, source: `${layer}.${field}` })),
  };
}

const { tiles: [template] } = await (await fetch(TILEJSON)).json();
const out = {};
for (const area of HERO_AREAS) out[area.key] = await buildArea(area, template);
// The two maps swap in one frame, so they carry a similar number of names: at most one more than the sparser map.
const count = Math.min(...Object.values(out).map((a) => a.labels.length)) + 1;
for (const [key, a] of Object.entries(out)) {
  for (const dropped of a.labels.splice(count)) console.log(`${key}: left out "${dropped.name}" to stay close to the other map`);
}

const body = `// Generated by scripts/build-landing-maps.mjs. Do not edit by hand.
// Map data © OpenStreetMap contributors (ODbL), tiles © OpenMapTiles via OpenFreeMap.
// Import only from server components: this is path data, not client code.

export interface AreaBasemapData {
  /** SVG path data in the ${VIEW_W}×${VIEW_H} view of areaView.ts. The sea fills with the nonzero rule. */
  sea: string;
  /** The water's edge, as open lines. */
  shore: string;
  major: string;
  minor: string;
  /** Place names from the tiles, never invented. \`source\` is the tile layer and field each came from. */
  labels: Array<{
    name: string;
    kind: "place" | "water";
    /** What the text sits on when the area is as first drawn, which sets its halo: plain land, the area's tinted land, or water. */
    on: "land" | "area" | "water";
    x: number;
    y: number;
    source: string;
  }>;
}

export const AREA_BASEMAPS: Record<"A" | "B", AreaBasemapData> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync(OUT, body);
const pathBytes = Object.values(out).reduce((n, a) => n + a.sea.length + a.shore.length + a.major.length + a.minor.length, 0);
console.log(`wrote ${OUT}: ${body.length} bytes, ${pathBytes} of path data`);
