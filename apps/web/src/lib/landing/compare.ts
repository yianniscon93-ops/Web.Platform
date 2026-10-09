import type { PolygonCoords } from "@/lib/dashboard/types";
// A type only: scripts/build-*.mjs run this file in Node as it is, so it imports nothing at run time.
import type { AreaView } from "./areaView";

/** A hand-drawn area the landing's stage starts from, and the map it is drawn on. */
export interface DrawnArea {
  key: "CY" | "A" | "B" | "PICK";
  name: string;
  /**
   * The ground the map shows, where that is fixed and not fitted round the area: the whole island. On such a
   * map the area can be taken anywhere, so once moved it is no longer "near" the place it started on. It also
   * marks the island's kind of map (one picture of the island, no street map), whatever window it is seen through.
   */
  frame?: PolygonCoords;
  /** The window the map shows just now, where the visitor can zoom and move it (the stage); `viewOf` returns it. */
  view?: AreaView;
  /** For a place the visitor picked: its centre [lat, lng], where its name goes on the map, and how many short-lets the list of places gives it. */
  centre?: [number, number];
  listed?: number;
  /**
   * "In <place>" in Greek, with its article and case ("στον Πρωταρά"), for the
   * connector's Greek example. GREEK: the owner is to proofread these.
   */
  inGreek: string;
  polygon: PolygonCoords;
  /**
   * Which corner invites the first drag (it pulses, and the invitation is set
   * beside it), and on which side of it the words go: to its right, level
   * with it, or under it and running left. Both are picked by hand so the
   * words lie on open water, clear of the outline and the locator at every
   * map size (globals.css, `.th-cue-label`);
   * scripts/build-landing-maps.mjs keeps the place names clear of them.
   */
  cue: { corner: number; side: "right" | "below-left" };
}

/**
 * The whole island, with an area drawn round Limassol and the hills behind it: the map the stage opens on. The
 * frame is the island's own bounds.
 */
export const ISLAND_AREA: DrawnArea = {
  key: "CY",
  name: "Limassol",
  inGreek: "στη Λεμεσό",
  frame: [
    [35.695, 32.272],
    [35.695, 34.59],
    [34.569, 34.59],
    [34.569, 32.272],
  ],
  polygon: [
    [34.9, 32.74],
    [34.93, 33.1],
    [34.8, 33.33],
    [34.6, 33.07],
    [34.63, 32.72],
  ],
  cue: { corner: 3, side: "right" },
};

/**
 * The two places the page has street maps of: the Protaras–Pernera strip on the
 * east coast and Kato Paphos on the west. The stage no longer shows them; the
 * Playground card's head to head still compares them with the area on the map,
 * so the stage counts the listings in each (PlaceCount in DrawHero). Both hold
 * listings in demo mode too.
 */
export const HERO_AREAS: [DrawnArea, DrawnArea] = [
  {
    key: "A",
    name: "Protaras",
    inGreek: "στον Πρωταρά",
    polygon: [
      [35.044, 34.026],
      [35.044, 34.045],
      [35.02, 34.064],
      [35.005, 34.064],
      [35.005, 34.048],
    ],
    cue: { corner: 1, side: "right" },
  },
  {
    key: "B",
    name: "Kato Paphos",
    inGreek: "στην Κάτω Πάφο",
    polygon: [
      [34.786, 32.4],
      [34.786, 32.44],
      [34.758, 32.444],
      [34.742, 32.42],
      [34.75, 32.398],
    ],
    cue: { corner: 3, side: "below-left" },
  },
];

/** The stage's window on the island: how far in it is (1 is the whole island) and the [lat, lng] at its middle. */
export interface StageWindow {
  z: number;
  lat: number;
  lng: number;
}
/** The steps the map's plus and minus go through. */
export const ZOOM_LEVELS = [1, 2, 4, 8];
/** The middle of the window stays on the island, between these. */
export const ISLAND_BOUNDS = { south: 34.56, north: 35.7, west: 32.27, east: 34.6 };
const within = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v));
const FRAME_LATS = ISLAND_AREA.frame!.map((p) => p[0]);
const FRAME_LNGS = ISLAND_AREA.frame!.map((p) => p[1]);
/** The whole island: the window the stage opens on. Its middle is the middle of the island's frame. */
export const WHOLE_ISLAND: StageWindow = {
  z: 1,
  lat: (Math.min(...FRAME_LATS) + Math.max(...FRAME_LATS)) / 2,
  lng: (Math.min(...FRAME_LNGS) + Math.max(...FRAME_LNGS)) / 2,
};
/**
 * A window the stage can show: no closer than the last step and no further out than the whole island, with its
 * middle on the island. At 1 there is nothing to move, so the middle is the island's.
 */
export function stageWindow(z: number, lat: number, lng: number): StageWindow {
  const zoom = within(z, 1, ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
  if (zoom <= 1) return WHOLE_ISLAND;
  return {
    z: zoom,
    lat: within(lat, ISLAND_BOUNDS.south, ISLAND_BOUNDS.north),
    lng: within(lng, ISLAND_BOUNDS.west, ISLAND_BOUNDS.east),
  };
}

/** A place the visitor picked in the first screen's search box: what the stage needs to show it. */
export interface PickedPlace {
  areaId: string;
  name: string;
  lat: number;
  lng: number;
  /** How far the place reaches from its centre, where that is known. */
  radiusKm: number | null;
  /** The short-lets the list of places gives it. */
  listingCount: number;
}
/** How the search box hands a picked place to the stage: the event's detail is a PickedPlace. */
export const PICK_EVENT = "ps:pick";

const KM_PER_DEG = 111.2;
/**
 * The stage's area for a picked place, drawn round the place itself: a rough ring of the place's own reach
 * (never under 4 km, so its corners can be held), not its boundary. It is on the island's map; the stage sets
 * the window to the ground round it (DrawHero).
 */
export function pickedArea(place: PickedPlace): DrawnArea {
  const reach = Math.min(28, Math.max(4, place.radiusKm ?? 5));
  const kx = Math.cos((place.lat * Math.PI) / 180);
  const at = (km: number, bearing: number): [number, number] => [
    Math.round((place.lat + (km * Math.cos(bearing)) / KM_PER_DEG) * 1e4) / 1e4,
    Math.round((place.lng + (km * Math.sin(bearing)) / (KM_PER_DEG * kx)) * 1e4) / 1e4,
  ];
  // Five corners, clockwise from the north-west, a little uneven, as a hand would draw them.
  const polygon = [1, 0.92, 1.06, 0.94, 1.02].map((f, i) => at(reach * f, ((-54 + 72 * i) * Math.PI) / 180));
  // The line to the panels leaves the easternmost corner, so the invitation stands beside the one below it.
  return {
    key: "PICK",
    name: place.name,
    inGreek: "",
    frame: ISLAND_AREA.frame,
    polygon,
    centre: [place.lat, place.lng],
    listed: place.listingCount,
    cue: { corner: 3, side: "right" },
  };
}

/** How a request (a report on an area, the connector) travels to the access form, which reads these. */
export const QUESTION_KEY = "ps-question";
export const QUESTION_EVENT = "ps:question";
