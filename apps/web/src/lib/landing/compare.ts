import type { PolygonCoords } from "@/lib/dashboard/types";

/** A hand-drawn area the landing hero starts from. */
export interface DrawnArea {
  key: "A" | "B";
  name: string;
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
   * words lie on open water, clear of the outline, the place switch and the
   * locator at every map size (globals.css, `.th-cue-label`);
   * scripts/build-landing-maps.mjs keeps the place names clear of them.
   */
  cue: { corner: number; side: "right" | "below-left" };
}

/**
 * The two places the landing hero can show: the Protaras–Pernera strip on the
 * east coast and Kato Paphos on the west. Both hold listings in demo mode
 * too, so the hero has numbers without a database.
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

/** How a request (a report on an area, the connector) travels to the access form, which reads these. */
export const QUESTION_KEY = "ps-question";
export const QUESTION_EVENT = "ps:question";
