import { LANDING } from "./tokens";

/* The five corners of the plot, each on a point of the map's grid. Refined 2026-10-11 ("more techy and
   professional", keeping the olive line): the corners now sit exactly on the dots and are the page's own square
   handles (a ground-coloured square in an olive edge), so the mark reads as an area selected in the tool rather
   than a drawing of one. The olive line, the orange wash inside and the dots of the map in ink are kept. */
const GRID = [4, 10.5, 17, 23.5, 30];
const CORNERS: [number, number][] = [
  [4, 10.5],
  [23.5, 4],
  [30, 23.5],
  [17, 30],
  [4, 23.5],
];
const PLOT = "M4 10.5 23.5 4 30 23.5 17 30 4 23.5z";
const HANDLE = 3.6;

/**
 * The brand mark: the plot as the stage draws it, selected on the map's grid of points. `line` is the colour of
 * the drawn line and the handles' edge (olive on the page's ground); `knock` fills the handles (the ground they
 * sit on); the footer, on ink, hands in its light ink and its ink instead. `dots` is the map's grid; `grid` turns
 * it off where the mark is too small for it to read.
 */
export default function AreaMark({
  size = 34,
  line = LANDING.area,
  dots = LANDING.ink,
  knock = LANDING.ground,
  grid = true,
  handles = true,
}: {
  size?: number;
  line?: string;
  dots?: string;
  knock?: string;
  grid?: boolean;
  handles?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      {grid && (
        <g fill={dots} fillOpacity="0.3">
          {GRID.map((x) => GRID.map((y) => <circle key={`${x}.${y}`} cx={x} cy={y} r="0.6" />))}
        </g>
      )}
      <path d={PLOT} fill={LANDING.mark} fillOpacity="0.3" stroke={line} strokeWidth="1.5" strokeLinejoin="miter" />
      {handles && (
        <g fill={knock} stroke={line} strokeWidth="1.3">
          {CORNERS.map(([x, y]) => (
            <rect key={`${x}.${y}`} x={x - HANDLE / 2} y={y - HANDLE / 2} width={HANDLE} height={HANDLE} />
          ))}
        </g>
      )}
    </svg>
  );
}
