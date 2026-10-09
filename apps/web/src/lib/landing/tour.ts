/** A point on a town's drawn map, in its view units. */
export type TownPt = [number, number];

/** One area drawn on a town's map, a few streets wide, and what the short-lets inside it come to. */
export interface TourArea {
  name: string;
  ring: TownPt[];
  /** Nights occupied this season, in %, and the median nightly rate: null when the area holds too few listings to quote, and it is then drawn without figures. */
  occupied: number | null;
  rate: number | null;
  count: number;
  /** Where its figures are pinned when the map is whole: the card's corner, the side of that corner it hangs from, and the line to it from the area's corner `from`. */
  at: TownPt;
  side: "left" | "right";
  from: number;
  to: TownPt;
}

/** One stop of the first screen's tour: a town's drawn map and the areas drawn on it. */
export interface TourStop {
  key: string;
  /** The town's name, set on its map. */
  town: string;
  src: string;
  /** The map's side in view units (it is square), and the ground it shows: [lat, lng] to units is ((lng - west) * perLng, (north - lat) * perLat). */
  size: number;
  west: number;
  north: number;
  perLng: number;
  perLat: number;
  areas: TourArea[];
  /** Where the town's name goes when the map is whole. */
  where: TownPt;
}
