import { LANDING as C } from "./tokens";

// The three product icons, in the brand mark's vocabulary (AreaMark): a 2px ink
// line with round joins, small square white nodes stroked in ink, and exactly
// one element filled with the mark's colour. Drawn on a 32px grid; they are
// shown at 40px in the panels and 24px in the phone menu. The th-ic-* classes
// name the one part of each that moves when its panel is opened (globals.css).

type IconProps = { size?: number; className?: string };

function Frame({ size = 40, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={C.ink}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NODE = { fill: C.surface, strokeWidth: 1.7, strokeLinejoin: "miter" } as const;

/** Playground: a hand-drawn area with its square corners, and a pointer on one of them. */
export function PlaygroundIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M5 11 17 5l5 11-13 7z" fill={C.mark} />
      <g {...NODE}>
        <rect x="2.75" y="8.75" width="4.5" height="4.5" />
        <rect x="14.75" y="2.75" width="4.5" height="4.5" />
        <rect x="6.75" y="20.75" width="4.5" height="4.5" />
      </g>
      <path className="th-ic-pointer" d="M20.5 14.5v13.2l3.5-3.3 2.6 5.3 2.4-1.2-2.6-5.2h4.8z" fill={C.surface} strokeWidth="1.8" />
    </Frame>
  );
}

/** Reports: a sheet with a folded corner, two lines of text and a short chart line (both in white, on the fill). */
export function ReportsIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M6 3h12.5L26 10.5V29H6z" fill={C.mark} />
      <path d="M18.5 3v7.5H26z" fill={C.surface} />
      {/* What is written on the sheet is drawn in white: an ink line on the mark's colour goes muddy at 24px. */}
      <path d="M10.5 10h4M10.5 14.5h7" stroke={C.surface} />
      <path className="th-ic-line" d="M10.5 24.5l3.6-4.2 3 2.2 3.4-3.9" stroke={C.surface} pathLength={1} />
      <rect className="th-ic-node" x="18.4" y="16.5" width="4.2" height="4.2" {...NODE} />
    </Frame>
  );
}

/** Connector: a speech bubble with a cable plugged into it, the cable ending in a square node. */
export function ConnectorIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path
        d="M8 4h15a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H13.5L8 24.5V20a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"
        fill={C.mark}
      />
      <g className="th-ic-cable">
        <path d="M19 12v9.5a5 5 0 0 0 5 5h5.5" />
        <rect x="16.4" y="8.9" width="5.2" height="5.2" {...NODE} />
      </g>
    </Frame>
  );
}
