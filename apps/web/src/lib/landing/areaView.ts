// Shared by the hero's street maps and by scripts/build-landing-maps.mjs, which
// Node runs directly, so this file keeps to syntax that needs no compiling.

/** Street-map view box, in units. 4:3; one unit is about 13 m on the ground. */
export const VIEW_W = 800;
export const VIEW_H = 600;

/** Share of the view's limiting side that the drawn area spans. */
const FILL = 0.56;
/**
 * The same share for a map that is fitted round fixed ground (the whole island) and not round its area: every
 * frame the map is shown in keeps at least the middle 603 of the view's 800 units, so 0.7 keeps all of it in.
 */
const FRAME_FILL = 0.7;

export interface AreaView {
  west: number;
  north: number;
  /** View-box units per degree of longitude and of latitude. */
  sx: number;
  sy: number;
}

/**
 * The window a place's map shows: its own `view` when it carries one (the stage's map, zoomed and moved), else
 * round its `frame` when it has one, else round its area as first drawn.
 */
export function viewOf(place: { polygon: Array<[number, number]>; frame?: Array<[number, number]>; view?: AreaView }): AreaView {
  if (place.view) return place.view;
  return place.frame ? areaView(place.frame, FRAME_FILL) : areaView(place.polygon);
}

/**
 * `whole` enlarged `z` times, with [lat, lng] at its middle. It is the same projection, only closer, so a picture
 * drawn for `whole` still fits the ground in it.
 */
export function zoomedView(whole: AreaView, z: number, lat: number, lng: number): AreaView {
  const sx = whole.sx * z;
  const sy = whole.sy * z;
  return { west: lng - VIEW_W / 2 / sx, north: lat + VIEW_H / 2 / sy, sx, sy };
}

/** The 4:3 window around a drawn area ([lat, lng] pairs), centred on its bounding box. */
export function areaView(polygon: Array<[number, number]>, fill = FILL): AreaView {
  const lats = polygon.map((p) => p[0]);
  const lngs = polygon.map((p) => p[1]);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const midLat = (south + north) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // longitude shrink at this latitude
  // Height of the view in degrees of latitude, set by whichever side of the area is tighter.
  const h = Math.max((north - south) / fill, (((east - west) * kx) / fill) * (VIEW_H / VIEW_W));
  const sy = VIEW_H / h;
  const sx = sy * kx;
  return { west: (west + east) / 2 - VIEW_W / 2 / sx, north: midLat + h / 2, sx, sy };
}

/** [lat, lng] → view-box units. */
export function project(view: AreaView, lat: number, lng: number): [number, number] {
  return [(lng - view.west) * view.sx, (view.north - lat) * view.sy];
}

/** View-box units → [lat, lng]. */
export function unproject(view: AreaView, x: number, y: number): [number, number] {
  return [view.north - y / view.sy, view.west + x / view.sx];
}
