// Written by scripts/build-hero-town.mjs; do not edit by hand.
/** One of the first screen's drawn town maps: its file, its size in view units, and where a place falls on it. */
export interface HeroTown {
  key: "limassol" | "nicosia" | "paphos" | "ayianapa" | "larnaca" | "protaras";
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
  { key: "limassol", name: "Limassol", src: "/landing/town-limassol.svg", width: 1600, height: 1600, west: 33.021759, north: 34.695, perLng: 43858.277, perLat: 53333.333 },
  { key: "nicosia", name: "Nicosia", src: "/landing/town-nicosia.svg", width: 1600, height: 1600, west: 33.34565, north: 35.184, perLng: 43597.688, perLat: 53333.333 },
  { key: "paphos", name: "Paphos", src: "/landing/town-paphos.svg", width: 1600, height: 1600, west: 32.399742, north: 34.775, perLng: 43815.863, perLat: 53333.333 },
  { key: "ayianapa", name: "Ayia Napa", src: "/landing/town-ayianapa.svg", width: 1600, height: 1600, west: 33.976691, north: 35.002, perLng: 43695.048, perLat: 53333.333 },
  { key: "larnaca", name: "Larnaca", src: "/landing/town-larnaca.svg", width: 1600, height: 1600, west: 33.609708, north: 34.928, perLng: 43734.508, perLat: 53333.333 },
  { key: "protaras", name: "Protaras", src: "/landing/town-protaras.svg", width: 1600, height: 1600, west: 34.027685, north: 35.028, perLng: 43681.167, perLat: 53333.333 },
];
/** [lat, lng] to a town map's view units. */
export const townXY = (town: HeroTown, lat: number, lng: number): [number, number] => [(lng - town.west) * town.perLng, (town.north - lat) * town.perLat];
