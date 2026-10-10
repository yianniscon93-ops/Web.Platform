import { LANDING } from "./tokens";

/* The five corners of the plot, snapped to the map's grid of points. The same shape as before (2026-10-10,
   "Actually use J"): a hairline plot drawn on the map's dots, its line and corners in the olive the stage draws
   with, the orange wash of a set area inside, and the dots of the map in ink. */
const CORNERS: [number, number][] = [
  [7, 9.5],
  [22.5, 6],
  [29, 19],
  [19, 28],
  [7, 22],
];
const PLOT = "M7 9.5 22.5 6l6.5 13-10 9L7 22z";
const GRID = [4, 10.5, 17, 23.5, 30];

/**
 * The brand mark: the plot as the stage draws it, snapped to the map's grid of points. `line` is the colour of
 * the drawn line and its corners (olive on the page's ground); the footer, on ink, hands in its own light ink
 * instead. `dots` is the map's grid (ink on the ground, the footer's ink there); `grid` turns it off where the
 * mark is too small for it to read.
 */
export default function AreaMark({
  size = 34,
  line = LANDING.area,
  dots = LANDING.ink,
  grid = true,
  handles = true,
}: {
  size?: number;
  line?: string;
  dots?: string;
  grid?: boolean;
  handles?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      {grid && (
        <g fill={dots} fillOpacity="0.35">
          {GRID.map((x) => GRID.map((y) => <circle key={`${x}.${y}`} cx={x} cy={y} r="0.75" />))}
        </g>
      )}
      <path d={PLOT} fill={LANDING.mark} fillOpacity="0.3" stroke={line} strokeWidth="1.5" strokeLinejoin="miter" />
      {handles && (
        <g fill={line}>
          {CORNERS.map(([x, y]) => (
            <circle key={`${x}.${y}`} cx={x} cy={y} r="1.6" />
          ))}
        </g>
      )}
    </svg>
  );
}
