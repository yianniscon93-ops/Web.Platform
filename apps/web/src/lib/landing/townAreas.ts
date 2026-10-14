// The first screen's drawn areas on the six town maps, and what the stage needs to go down to street level on
// those maps: the towns' squares, how far in the stage may go over them, and the area a picked town opens on.
import type { PolygonCoords } from "@/lib/dashboard/types";
import { VIEW_H, VIEW_W, viewOf } from "./areaView";
import { ISLAND_AREA, ISLAND_BOUNDS, ZOOM_LEVELS, stageWindow, type DrawnArea, type PickedPlace, type StageWindow } from "./compare";
import { HERO_TOWNS, type HeroTown } from "./heroTowns";
import type { TourArea, TownPt } from "./tour";

export type Drawn = Pick<TourArea, "name" | "ring" | "at" | "side" | "from">;

/**
 * What the tour draws on each town's map, in that map's view units: three areas a few streets wide, each with
 * the corner its figures are pinned at when the map is whole (`at`, and the `side` of it the card hangs from)
 * and the corner of the area the line to them leaves from. `where` is the place of the town's name. All of it
 * is set by hand against the drawing, on built streets, the cards over open water where they can be. A card
 * with all three markets is about 225 by 147px (270 by 158 from 1440px): the lowest ones (Kato Paphos, Skala)
 * are pinned high enough to end above the credit row in an 800px window.
 */
export const DRAWN: Record<HeroTown["key"], { areas: Drawn[]; where: TownPt }> = {
  limassol: {
    areas: [
      { name: "Old town", ring: [[730, 990], [1010, 940], [1070, 1160], [900, 1250], [720, 1190]], at: [1545, 1110], side: "right", from: 2 },
      { name: "Anexartisias Street", ring: [[870, 830], [960, 745], [1060, 795], [1055, 905], [900, 915]], at: [1050, 455], side: "right", from: 1 },
      // Kept on land, on the streets behind the promenade (critique, 2026-10-14: its corners ran into the sea).
      { name: "Seafront", ring: [[1090, 720], [1300, 650], [1370, 790], [1230, 930], [1080, 900]], at: [1575, 440], side: "right", from: 1 },
    ],
    where: [880, 400],
  },
  // Inland, so its cards lie on streets. The old town is the part of the walled city this side of the line.
  nicosia: {
    areas: [
      { name: "Old town", ring: [[560, 560], [1040, 550], [1080, 660], [900, 790], [690, 780]], at: [1580, 470], side: "right", from: 1 },
      { name: "Makarios Avenue", ring: [[600, 850], [880, 840], [990, 1050], [820, 1180], [600, 1080]], at: [1580, 790], side: "right", from: 2 },
      { name: "Agioi Omologites", ring: [[630, 1250], [960, 1180], [1020, 1290], [900, 1380], [680, 1380]], at: [1580, 1110], side: "right", from: 2 },
    ],
    where: [1340, 330],
  },
  paphos: {
    areas: [
      { name: "Tombs of the Kings", ring: [[540, 240], [740, 215], [830, 330], [760, 480], [540, 470]], at: [900, 270], side: "left", from: 2 },
      { name: "Kato Paphos", ring: [[560, 800], [900, 770], [990, 930], [820, 1000], [560, 980]], at: [1580, 700], side: "right", from: 2 },
      { name: "Poseidonos Avenue", ring: [[850, 1120], [990, 1000], [1110, 1180], [1080, 1400], [960, 1330]], at: [1580, 1040], side: "right", from: 1 },
    ],
    where: [1180, 620],
  },
  ayianapa: {
    areas: [
      { name: "Agias Mavris", ring: [[600, 650], [720, 570], [875, 585], [878, 765], [640, 775]], at: [1040, 260], side: "right", from: 1 },
      { name: "Town centre", ring: [[900, 540], [1130, 530], [1230, 690], [1100, 820], [900, 780]], at: [1575, 280], side: "right", from: 1 },
      { name: "Harbour", ring: [[990, 880], [1170, 870], [1250, 1000], [1160, 1120], [1010, 1050]], at: [985, 800], side: "right", from: 4 },
    ],
    where: [700, 440],
  },
  larnaca: {
    areas: [
      { name: "Finikoudes", ring: [[960, 540], [1240, 520], [1250, 760], [1130, 790], [950, 680]], at: [1570, 230], side: "right", from: 1 },
      { name: "St Lazarus", ring: [[930, 820], [1180, 800], [1220, 980], [1080, 1110], [910, 1000]], at: [900, 610], side: "right", from: 4 },
      { name: "Skala", ring: [[1010, 1150], [1210, 1130], [1230, 1300], [1180, 1460], [1020, 1400]], at: [905, 930], side: "right", from: 0 },
    ],
    where: [700, 520],
  },
  protaras: {
    areas: [
      { name: "Pernera", ring: [[700, 230], [790, 170], [880, 250], [870, 490], [730, 500]], at: [1580, 270], side: "right", from: 2 },
      { name: "Protaras centre", ring: [[900, 665], [1040, 715], [1120, 810], [1100, 940], [900, 900]], at: [890, 760], side: "right", from: 4 },
      { name: "Fig Tree Bay", ring: [[1170, 700], [1260, 740], [1390, 870], [1280, 960], [1150, 840]], at: [1580, 990], side: "right", from: 3 },
    ],
    where: [600, 600],
  },
};

/** A town map's view units back to [lat, lng]: for the question asked of the server, and for the stage. */
export const townGround = (town: HeroTown, ring: TownPt[]): PolygonCoords =>
  ring.map(([x, y]) => [
    Math.round((town.north - y / town.perLat) * 1e5) / 1e5,
    Math.round((town.west + x / town.perLng) * 1e5) / 1e5,
  ]);

/** The island's own steps end here; closer in is street level, which only a town with a drawn street map has. */
export const ISLAND_MAX = 8;
/** As far in as the stage goes: about 2.4 km of ground across the window, a few streets in its middle. */
export const STREET_MAX = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
/** The whole island's window: every window the stage shows is this one, enlarged. */
const WHOLE = viewOf(ISLAND_AREA);

/** The ground a town's street map covers, in degrees. */
export function townBox(town: HeroTown) {
  return { north: town.north, south: town.north - town.height / town.perLat, west: town.west, east: town.west + town.width / town.perLng };
}

/** The town whose street map covers [lat, lng], if any. */
export function townAt(lat: number, lng: number): HeroTown | null {
  return (
    HERO_TOWNS.find((t) => {
      const b = townBox(t);
      return lat <= b.north && lat >= b.south && lng >= b.west && lng <= b.east;
    }) ?? null
  );
}

/** How far in the stage may go with its middle at [lat, lng]: to street level over a town's street map, else the island's last step. */
export const maxZoomAt = (lat: number, lng: number) => (townAt(lat, lng) ? STREET_MAX : ISLAND_MAX);

/**
 * Where the window's middle may go. On the island's steps, anywhere on the island. At street level, inside the
 * town's square, and so far inside it that the square fills the whole window: past the square there are no streets.
 */
export function centreBounds(win: StageWindow): typeof ISLAND_BOUNDS {
  const town = win.z > ISLAND_MAX ? townAt(win.lat, win.lng) : null;
  if (!town) return ISLAND_BOUNDS;
  const b = townBox(town);
  const hw = Math.min(VIEW_W / 2 / (WHOLE.sx * win.z), (b.east - b.west) / 2);
  const hh = Math.min(VIEW_H / 2 / (WHOLE.sy * win.z), (b.north - b.south) / 2);
  return { south: b.south + hh, north: b.north - hh, west: b.west + hw, east: b.east - hw };
}

const within = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v));

/** The stage's window as `stageWindow` makes it, held to street level only over a town's street map. */
export function streetWindow(z: number, lat: number, lng: number): StageWindow {
  const win = stageWindow(Math.min(z, maxZoomAt(lat, lng)), lat, lng);
  if (win.z <= ISLAND_MAX) return win;
  const c = centreBounds(win);
  return { z: win.z, lat: within(win.lat, c.south, c.north), lng: within(win.lng, c.west, c.east) };
}

// The area a picked town opens on, of the three the tour draws on its map: its old town or centre. Paphos's is
// Kato Paphos, the harbour quarter, where most of its short-lets are.
const OPENS: Partial<Record<HeroTown["key"], number>> = { paphos: 1 };
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * For a picked place that is one of the six towns with a street map: an area a few streets wide on that map (one
 * of the tour's own), named for its streets and its town, to be shown at street level. Any other place has none,
 * and the stage draws its round ring on the island instead (`pickedArea`).
 */
export function streetArea(place: PickedPlace): DrawnArea | null {
  const town = HERO_TOWNS.find((t) => plain(t.name) === plain(place.name));
  if (!town) return null;
  const drawn = DRAWN[town.key].areas[OPENS[town.key] ?? 0];
  const polygon = townGround(town, drawn.ring);
  const lats = polygon.map((p) => p[0]);
  const lngs = polygon.map((p) => p[1]);
  // The invitation goes beside the easternmost corner, where the window has the most room for it.
  const corner = lngs.indexOf(Math.max(...lngs));
  return {
    key: "PICK",
    name: `${drawn.name}, ${town.name}`,
    inGreek: "",
    frame: ISLAND_AREA.frame,
    polygon,
    centre: [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2],
    cue: { corner, side: "right" },
  };
}
