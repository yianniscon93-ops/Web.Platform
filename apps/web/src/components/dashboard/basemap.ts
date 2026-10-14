import L from "leaflet";
import { MAP } from "./mapStyle";

/*
 * The Playground's map, painted in the landing page's own map colours.
 *
 * The tiles are OpenFreeMap's vector tiles (OpenMapTiles schema, OpenStreetMap data): free, with no key, no account
 * and no limit on views, and commercial use allowed (openfreemap.org, checked 2026-10-14). They are the same tiles
 * the landing's pictures are drawn from (scripts/build-hero-town.mjs, build-island-map.mjs), and they are painted
 * here with the same colours, so the map the visitor arrives on is the map they left. CARTO's raster basemap, used
 * until then, began to answer every request with an "API key required" picture, and its free tier is not meant
 * for a commercial site.
 *
 * A Leaflet grid layer of canvases: each tile is fetched once (the browser caches it), decoded here (the Mapbox
 * Vector Tile format is a small protobuf; the build scripts read it the same way) and drawn. The data stops at zoom
 * 14; closer in, the zoom-14 tile is drawn larger, so streets stay sharp and their width follows the zoom. Like the
 * landing's maps it carries no text and no boundary lines: the names on it are the page's own.
 */

const TILEJSON = "https://tiles.openfreemap.org/planet";
const DATA_MAX_ZOOM = 14;

/* OpenFreeMap's own credit line ("OpenFreeMap © OpenMapTiles Data from OpenStreetMap"), with OpenStreetMap named as
   its licence asks: "© OpenStreetMap contributors". */
export const BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>';

// ── Where the tiles are ──────────────────────────────────────────────────────

let template: Promise<string> | null = null;

/** The tile URL template, from OpenFreeMap's TileJSON (it names the current build). Asked again after a failure. */
function tileTemplate(): Promise<string> {
  if (!template) {
    template = fetch(TILEJSON)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`basemap tilejson ${r.status}`))))
      .then((j: { tiles?: unknown[] }) => {
        const t = j.tiles?.[0];
        if (typeof t !== "string") throw new Error("basemap tilejson has no tiles");
        return t;
      });
    template.catch(() => {
      template = null;
    });
  }
  return template;
}

// ── Mapbox Vector Tile decoding (protobuf, just the fields used here) ───────

type Value = string | number | boolean | null;
interface Feature {
  type: number; // 1 point, 2 line, 3 polygon
  props: Record<string, Value>;
  /** Lines, or rings, in tile units. */
  parts: number[][];
  /** [minX, minY, maxX, maxY] in tile units, for culling at street zooms. */
  box: [number, number, number, number];
}
interface Layer {
  extent: number;
  features: Feature[];
}
type Tile = Record<string, Layer>;

const WANTED = new Set(["water", "landcover", "landuse", "building", "transportation", "aeroway"]);
const utf8 = new TextDecoder();

/* Every read is checked against the end of its message, so a cut-off or foreign answer (an error page with a 200,
   a truncated body) throws and leaves that tile blank instead of reading past the buffer. */
class Reader {
  constructor(
    private buf: Uint8Array,
    public pos = 0,
    private end = buf.length
  ) {}
  get more() {
    return this.pos < this.end;
  }
  private need(n: number) {
    if (!(n >= 0) || this.pos + n > this.end) throw new Error("basemap: truncated tile");
  }
  varint(): number {
    let v = 0;
    let shift = 1;
    for (let i = 0; i < 10; i++) {
      if (this.pos >= this.end) throw new Error("basemap: truncated tile");
      const b = this.buf[this.pos++];
      v += (b & 0x7f) * shift;
      if (b < 0x80) return v;
      shift *= 128;
    }
    throw new Error("basemap: malformed varint");
  }
  sub(): Reader {
    const len = this.varint();
    this.need(len);
    this.pos += len;
    return new Reader(this.buf, this.pos - len, this.pos);
  }
  string(): string {
    const len = this.varint();
    this.need(len);
    this.pos += len;
    return utf8.decode(this.buf.subarray(this.pos - len, this.pos));
  }
  fixed(bytes: 4 | 8): number {
    this.need(bytes);
    const view = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, bytes);
    this.pos += bytes;
    return bytes === 4 ? view.getFloat32(0, true) : view.getFloat64(0, true);
  }
  packed(): number[] {
    const sub = this.sub();
    const out: number[] = [];
    while (sub.more) out.push(sub.varint());
    return out;
  }
  skip(wire: number) {
    const n = wire === 0 ? (this.varint(), 0) : wire === 1 ? 8 : wire === 2 ? this.varint() : wire === 5 ? 4 : -1;
    if (n < 0) throw new Error(`basemap: wire type ${wire}`);
    this.need(n);
    this.pos += n;
  }
}

const zigzag = (n: number) => (n % 2 ? -(n + 1) / 2 : n / 2);

function readValue(r: Reader): Value {
  let v: Value = null;
  while (r.more) {
    const tag = r.varint();
    const field = tag >> 3;
    if (field === 1) v = r.string();
    else if (field === 2) v = r.fixed(4);
    else if (field === 3) v = r.fixed(8);
    else if (field === 4 || field === 5) v = r.varint();
    else if (field === 6) v = zigzag(r.varint());
    else if (field === 7) v = r.varint() !== 0;
    else r.skip(tag & 7);
  }
  return v;
}

/** Geometry commands to flat [x0, y0, x1, y1, …] parts, and their box. Rings are closed when drawn. */
function readGeometry(cmds: number[]): Pick<Feature, "parts" | "box"> {
  const parts: number[][] = [];
  let part: number[] = [];
  let x = 0;
  let y = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < cmds.length; ) {
    const cmd = cmds[i] & 7;
    let count = cmds[i++] >> 3;
    if (cmd === 7) continue;
    if (i + 2 * count > cmds.length) break; // a command that runs past its own geometry: keep what came before
    while (count--) {
      x += zigzag(cmds[i++]);
      y += zigzag(cmds[i++]);
      if (cmd === 1) parts.push((part = []));
      part.push(x, y);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { parts, box: [x0, y0, x1, y1] };
}

function decode(buf: Uint8Array): Tile {
  const out: Tile = {};
  const tile = new Reader(buf);
  while (tile.more) {
    const tag = tile.varint();
    if (tag >> 3 !== 3) {
      tile.skip(tag & 7);
      continue;
    }
    const r = tile.sub();
    let name = "";
    let extent = 4096;
    const keys: string[] = [];
    const values: Value[] = [];
    const raw: Reader[] = [];
    while (r.more) {
      const t = r.varint();
      const field = t >> 3;
      if (field === 1) name = r.string();
      else if (field === 2) raw.push(r.sub());
      else if (field === 3) keys.push(r.string());
      else if (field === 4) values.push(readValue(r.sub()));
      else if (field === 5) extent = r.varint();
      else r.skip(t & 7);
    }
    if (!WANTED.has(name)) continue;
    const features = raw.map((f): Feature => {
      let type = 0;
      let tags: number[] = [];
      let cmds: number[] = [];
      while (f.more) {
        const t = f.varint();
        const field = t >> 3;
        if (field === 2) tags = f.packed();
        else if (field === 3) type = f.varint();
        else if (field === 4) cmds = f.packed();
        else f.skip(t & 7);
      }
      const props: Record<string, Value> = {};
      for (let i = 0; i < tags.length; i += 2) props[keys[tags[i]]] = values[tags[i + 1]];
      return { type, props, ...readGeometry(cmds) };
    });
    out[name] = { extent, features };
  }
  return out;
}

// ── Fetching, with a small cache of decoded tiles (the street zooms share one zoom-14 tile) ──
//
// Each tile on screen leases the data tile it is drawn from. A fetch that every lease has let go of before it
// arrived (the map zoomed or moved on) is aborted; a finished one stays in the cache for the next tile that needs it.

interface Entry {
  promise: Promise<Tile>;
  ctrl: AbortController;
  users: number;
  settled: boolean;
}
interface Lease {
  promise: Promise<Tile>;
  release: () => void;
}

const decoded = new Map<string, Entry>();
const CACHE_SIZE = 32;

/** Drops the least recently used tiles that no one is waiting on, down to CACHE_SIZE. */
function trim() {
  for (const [key, e] of decoded) {
    if (decoded.size <= CACHE_SIZE) return;
    if (e.users === 0) decoded.delete(key);
  }
}

function lease(z: number, x: number, y: number): Lease {
  const key = `${z}/${x}/${y}`;
  let entry = decoded.get(key);
  if (entry) {
    decoded.delete(key);
    decoded.set(key, entry);
  } else {
    const ctrl = new AbortController();
    const promise = tileTemplate()
      .then((t) =>
        fetch(t.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)), { signal: ctrl.signal })
      )
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`basemap tile ${key} ${r.status}`))))
      .then((b) => decode(new Uint8Array(b)));
    const e: Entry = { promise, ctrl, users: 0, settled: false };
    promise.then(
      () => {
        e.settled = true;
      },
      () => {
        e.settled = true;
        if (decoded.get(key) === e) decoded.delete(key);
      }
    );
    decoded.set(key, e);
    entry = e;
  }
  const held = entry;
  held.users++;
  trim();
  let released = false;
  return {
    promise: held.promise,
    release: () => {
      if (released) return;
      released = true;
      held.users--;
      if (held.users === 0 && !held.settled) {
        held.ctrl.abort();
        if (decoded.get(key) === held) decoded.delete(key);
      }
    },
  };
}

// ── Painting ────────────────────────────────────────────────────────────────

const GREEN_LANDCOVER = new Set(["wood", "grass", "forest"]);
const GREEN_LANDUSE = new Set(["cemetery", "pitch", "stadium", "playground", "track", "park"]);
const BUILT_LANDUSE = new Set([
  "residential", "commercial", "industrial", "retail", "garages", "school", "university", "college",
  "kindergarten", "hospital", "library", "bus_station", "suburb", "quarter", "neighbourhood",
]);
const SKIP_SERVICE = new Set(["parking_aisle", "driveway"]);

/* Streets by weight, drawn lightest first. Width in CSS px at zoom 14, growing by half again at each zoom (so a
   street keeps roughly its true width close in) and never thinner than `min`; `from` is the first zoom it shows. */
const ROADS = [
  { classes: ["service", "pedestrian"], colour: MAP.minor, w14: 0.9, min: 0.5, from: 14 },
  { classes: ["minor"], colour: MAP.minor, w14: 1.4, min: 0.5, from: 12 },
  { classes: ["tertiary"], colour: MAP.minor, w14: 1.9, min: 0.5, from: 11 },
  { classes: ["secondary"], colour: MAP.secondary, w14: 2.4, min: 0.5, from: 9 },
  { classes: ["primary", "trunk"], colour: MAP.primary, w14: 3, min: 0.7, from: 7 },
  { classes: ["motorway"], colour: MAP.motorway, w14: 3.6, min: 1, from: 5 },
] as const;
const roadWidth = (w14: number, min: number, z: number) => Math.max(min, w14 * 1.5 ** (z - 14));

/** Which street weight a transportation line is drawn in, or -1. Pedestrian streets only, of the paths. */
function roadRank(p: Record<string, Value>): number {
  if (p.brunnel === "tunnel") return -1;
  const cls = p.class === "path" && p.subclass === "pedestrian" ? "pedestrian" : String(p.class ?? "");
  if (cls === "service" && SKIP_SERVICE.has(String(p.service ?? ""))) return -1;
  return ROADS.findIndex((r) => (r.classes as readonly string[]).includes(cls));
}

interface Frame {
  ctx: CanvasRenderingContext2D;
  /** Device pixels per tile unit, and the tile unit at the canvas's top-left corner. */
  k: number;
  ox: number;
  oy: number;
  /** The tile units the canvas shows, widened by a margin for strokes. */
  view: [number, number, number, number];
}

const seen = (f: Feature, v: Frame["view"]) => f.box[0] <= v[2] && f.box[2] >= v[0] && f.box[1] <= v[3] && f.box[3] >= v[1];

function trace(fr: Frame, part: number[], close: boolean) {
  const { ctx, k, ox, oy } = fr;
  ctx.moveTo((part[0] - ox) * k, (part[1] - oy) * k);
  for (let i = 2; i < part.length; i += 2) ctx.lineTo((part[i] - ox) * k, (part[i + 1] - oy) * k);
  if (close) ctx.closePath();
}

function fillAll(fr: Frame, features: Feature[], colour: string, alpha = 1) {
  if (!features.length) return;
  const { ctx } = fr;
  ctx.beginPath();
  for (const f of features) for (const ring of f.parts) trace(fr, ring, true);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function strokeAll(fr: Frame, features: Feature[], colour: string, widthPx: number, dpr: number) {
  if (!features.length) return;
  const { ctx } = fr;
  ctx.beginPath();
  for (const f of features) for (const line of f.parts) trace(fr, line, false);
  ctx.strokeStyle = colour;
  ctx.lineWidth = widthPx * dpr;
  ctx.stroke();
}

/** The water's edge: every edge of the water's rings except those the tile cut (they lie on or past its border). */
function strokeShore(fr: Frame, features: Feature[], extent: number, widthPx: number, dpr: number) {
  if (!features.length) return;
  const { ctx, k, ox, oy } = fr;
  const lo = 1;
  const hi = extent - 1;
  ctx.beginPath();
  for (const f of features) {
    for (const ring of f.parts) {
      const n = ring.length / 2;
      for (let i = 0; i < n; i++) {
        const ax = ring[2 * i];
        const ay = ring[2 * i + 1];
        const j = (i + 1) % n;
        const bx = ring[2 * j];
        const by = ring[2 * j + 1];
        if ((ax <= lo && bx <= lo) || (ax >= hi && bx >= hi) || (ay <= lo && by <= lo) || (ay >= hi && by >= hi)) continue;
        ctx.moveTo((ax - ox) * k, (ay - oy) * k);
        ctx.lineTo((bx - ox) * k, (by - oy) * k);
      }
    }
  }
  ctx.strokeStyle = MAP.shore;
  ctx.lineWidth = widthPx * dpr;
  ctx.stroke();
}

function paint(canvas: HTMLCanvasElement, tile: Tile, z: number, sub: { scale: number; sx: number; sy: number }, dpr: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = MAP.land;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const frameFor = (layer: Layer): Frame => {
    const span = layer.extent / sub.scale;
    const k = canvas.width / span;
    const ox = sub.sx * span;
    const oy = sub.sy * span;
    const m = 24 / k; // the widest stroke, in tile units
    return { ctx, k, ox, oy, view: [ox - m, oy - m, ox + span + m, oy + span + m] };
  };
  const pick = (name: string, test: (f: Feature) => boolean) => {
    const layer = tile[name];
    if (!layer) return { fr: null, features: [] as Feature[] };
    const fr = frameFor(layer);
    return { fr, features: layer.features.filter((f) => seen(f, fr.view) && test(f)) };
  };
  const cls = (f: Feature) => String(f.props.class ?? "");

  // The ground: built-up land while the town is a shape; its buildings take over from zoom 14.
  if (z < 14) {
    const built = pick("landuse", (f) => f.type === 3 && BUILT_LANDUSE.has(cls(f)));
    if (built.fr) fillAll(built.fr, built.features, MAP.built, 0.85);
  }
  const green = pick("landcover", (f) => f.type === 3 && GREEN_LANDCOVER.has(cls(f)));
  if (green.fr) fillAll(green.fr, green.features, MAP.green, z < 13 ? 0.8 : 1);
  const sand = pick("landcover", (f) => f.type === 3 && cls(f) === "sand");
  if (sand.fr) fillAll(sand.fr, sand.features, MAP.sand);
  const greenUse = pick("landuse", (f) => f.type === 3 && GREEN_LANDUSE.has(cls(f)));
  if (greenUse.fr) fillAll(greenUse.fr, greenUse.features, MAP.green);

  // The sea and inland water, and their edge.
  const water = pick("water", (f) => f.type === 3 && cls(f) !== "swimming_pool");
  if (water.fr) {
    fillAll(water.fr, water.features, MAP.water);
    strokeShore(water.fr, water.features, tile.water.extent, z < 14 ? 1 : 1.2, dpr);
  }

  if (z >= 14) {
    const buildings = pick("building", (f) => f.type === 3);
    if (buildings.fr) fillAll(buildings.fr, buildings.features, MAP.building);
  }

  // Airports: aprons and runways as paved ground, runways and taxiways as lines.
  const apron = pick("aeroway", (f) => f.type === 3 && (cls(f) === "apron" || cls(f) === "runway"));
  if (apron.fr) fillAll(apron.fr, apron.features, MAP.building);
  for (const [kind, w14, from] of [["taxiway", 2, 13], ["runway", 6, 10]] as const) {
    if (z < from) continue;
    const lines = pick("aeroway", (f) => f.type === 2 && cls(f) === kind);
    if (lines.fr) strokeAll(lines.fr, lines.features, MAP.secondary, roadWidth(w14, 0.6, z), dpr);
  }

  // Streets, lightest first, then piers in the land's colour over the water.
  const transport = tile.transportation;
  if (transport) {
    const fr = frameFor(transport);
    const buckets: Feature[][] = ROADS.map(() => []);
    const piers: Feature[] = [];
    const pierAreas: Feature[] = [];
    for (const f of transport.features) {
      if (!seen(f, fr.view)) continue;
      if (f.props.class === "pier") (f.type === 3 ? pierAreas : piers).push(f);
      else if (f.type === 2) {
        const rank = roadRank(f.props);
        if (rank >= 0 && z >= ROADS[rank].from) buckets[rank].push(f);
      }
    }
    if (z >= 14) {
      fillAll(fr, pierAreas, MAP.land);
      strokeAll(fr, piers, MAP.land, roadWidth(2.2, 1, z), dpr);
    }
    ROADS.forEach((r, i) => strokeAll(fr, buckets[i], r.colour, roadWidth(r.w14, r.min, z), dpr));
  }
}

/** A tile being drawn: cancelled once Leaflet lets go of it, which also lets go of its data tile. */
interface Job {
  cancelled: boolean;
  release: () => void;
}

async function render(canvas: HTMLCanvasElement, coords: L.Coords, dpr: number, job: Job) {
  const dz = Math.max(0, coords.z - DATA_MAX_ZOOM);
  const z = coords.z - dz;
  const scale = 2 ** dz;
  const x = Math.floor(coords.x / scale);
  const y = Math.floor(coords.y / scale);
  const held = lease(z, x, y);
  job.release = held.release;
  try {
    const tile = await held.promise;
    // Unloaded while its data was on the way: nothing to draw into.
    if (job.cancelled || !canvas.isConnected) return;
    paint(canvas, tile, coords.z, { scale, sx: coords.x - x * scale, sy: coords.y - y * scale }, dpr);
  } finally {
    held.release();
  }
}

type GridInternals = L.GridLayer & {
  _tiles: Record<string, { el: HTMLElement; coords: L.Coords; loaded?: number }>;
  _tileZoom?: number;
};

/** The basemap as a Leaflet layer (add it to the map; it goes in the tile pane). */
export function createBasemapLayer(): L.GridLayer {
  const jobs = new WeakMap<HTMLElement, Job>();
  const cancel = (el: HTMLElement) => {
    const job = jobs.get(el);
    if (!job) return;
    jobs.delete(el);
    job.cancelled = true;
    job.release();
  };
  const Basemap = L.GridLayer.extend({
    initialize(this: L.GridLayer, options: L.GridLayerOptions) {
      (L.GridLayer.prototype as unknown as { initialize: (o: L.GridLayerOptions) => void }).initialize.call(this, options);
      this.on("tileunload", (e: L.TileEvent) => cancel(e.tile));
    },
    createTile(this: L.GridLayer, coords: L.Coords, done: L.DoneCallback) {
      const canvas = document.createElement("canvas");
      const size = this.getTileSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      const job: Job = { cancelled: false, release: () => {} };
      jobs.set(canvas, job);
      render(canvas, coords, dpr, job).then(
        () => {
          jobs.delete(canvas);
          if (!job.cancelled) done(undefined, canvas);
        },
        (e: unknown) => {
          jobs.delete(canvas);
          if (!job.cancelled) done(e instanceof Error ? e : new Error(String(e)), canvas);
        }
      );
      return canvas;
    },
    // As Leaflet's TileLayer does: when the zoom settles, tiles of another zoom still being drawn are dropped.
    _abortLoading(this: GridInternals) {
      for (const key in this._tiles) {
        const t = this._tiles[key];
        if (t.coords.z === this._tileZoom || t.loaded) continue;
        cancel(t.el);
        L.DomUtil.remove(t.el);
        delete this._tiles[key];
        this.fire("tileabort", { tile: t.el, coords: t.coords });
      }
    },
  }) as unknown as new (options: L.GridLayerOptions) => L.GridLayer;
  return new Basemap({
    attribution: BASEMAP_ATTRIBUTION,
    minZoom: 0,
    maxZoom: 18,
    // Tiles are drawn on the main thread: none while a zoom is in flight, and one row kept round the view.
    updateWhenZooming: false,
    keepBuffer: 1,
  });
}
