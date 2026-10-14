/*
 * The colours the Playground's map is drawn in, kept apart from the map code so the page can read them without
 * loading Leaflet (which needs a browser). They are the landing's tokens as values: a canvas and Leaflet's SVG
 * attributes cannot read CSS variables. If a token in globals.css or DESIGN.md changes, change it here too.
 */

/* The landing's map colours (DESIGN.md: map-land, map-sea, map-shore and the picture-* colours), as the build scripts
   (scripts/build-hero-town.mjs, build-island-map.mjs) bake them into the landing's pictures. */
export const MAP = {
  land: "#FBFAF4",
  green: "#DFE7CF",
  sand: "#F3EAD3",
  water: "#C2DADF",
  shore: "#6F929B",
  building: "#E9E3D3",
  built: "#E3DCCB",
  minor: "#D2CCBB",
  secondary: "#CBC5B3",
  primary: "#B7B09C",
  motorway: "#A69F8A",
} as const;

/* A picked place in the brand mark's hand (areaHand.ts): --th-ink, --th-a and --th-surface. */
export const HAND = {
  ink: "#161C11",
  olive: "#4A5E3A",
  paper: "#FFFFFF",
} as const;
