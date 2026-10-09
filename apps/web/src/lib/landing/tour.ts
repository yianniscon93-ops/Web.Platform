/** A point on a town's drawn map, in its view units. */
export type TownPt = [number, number];

/** One of the other two markets inside an area: how many listings, and their median (null when too few to quote). */
export interface TourMarket {
  count: number;
  median: number | null;
}

/** One area drawn on a town's map, a few streets wide, and what the listings inside it come to in each of the three markets. */
export interface TourArea {
  name: string;
  ring: TownPt[];
  /** Short-lets: nights occupied this season, in %, and the median nightly rate: null when the area holds too few listings to quote, and it is then drawn without figures. */
  occupied: number | null;
  rate: number | null;
  count: number;
  /** Long-lets inside, with the median monthly rent, and homes for sale inside, with the median asking price. Null when the answer is not for this area (demo data answers for the whole island), and the card then leaves that market out. */
  rent: TourMarket | null;
  sale: TourMarket | null;
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
