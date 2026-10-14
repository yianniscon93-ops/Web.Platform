import { LANDING as C } from "./tokens";

// The three product icons, line drawings in the brand mark's vocabulary (AreaMark): one ink line of a single weight
// with round joins, small square white nodes stroked in ink, and exactly one element filled with the data's lime
// (--th-mark), always inside an ink line, since lime alone does not hold on a light ground (G, 2026-10-14; they were
// filled with saffron until then, which the owner found childish). Drawn on a 32px grid; shown at 36px beside a
// product's name and 24px in the phone menu. The th-ic-* classes name the one part of each that moves as its panel
// arrives (landing-sections.css).

type IconProps = { size?: number; className?: string };

function Frame({ size = 36, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={C.ink}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NODE = { fill: C.surface, strokeWidth: 1.4, strokeLinejoin: "miter" } as const;

/** Playground: the product's window, a plot drawn in it with its square corners, and one listing lit inside. */
export function PlaygroundIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <rect x="2.8" y="4.8" width="26.4" height="22.4" rx="2.5" />
      <path d="M8.5 20.5 11 11.5l9-2.5 3.5 8-7 5z" />
      <g {...NODE}>
        <rect x="6.8" y="18.8" width="3.4" height="3.4" />
        <rect x="18.3" y="7.3" width="3.4" height="3.4" />
      </g>
      <circle className="th-ic-pointer" cx="15.5" cy="15.5" r="2.4" fill={C.mark} strokeWidth="1.3" />
    </Frame>
  );
}

/** Reports: a sheet with a folded corner, and a short bar chart on it whose tallest bar is the finding. */
export function ReportsIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M6.5 3h12L25.5 10v19h-19z" />
      <path d="M18.5 3v7h7" />
      <path className="th-ic-line" d="M10.5 24.5v-3.5M14.25 24.5v-6" pathLength={1} />
      <rect className="th-ic-node" x="17.2" y="13.2" width="3.6" height="11.3" fill={C.mark} strokeWidth="1.3" strokeLinejoin="miter" />
    </Frame>
  );
}

/** Connector: a speech bubble with a cable plugged into it, the cable ending in a square node. */
export function ConnectorIcon(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M8 4h15a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H13.5L8 24.5V20a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
      <g className="th-ic-cable">
        <path d="M19 12v9.5a5 5 0 0 0 5 5h5.5" />
        <rect x="16.6" y="9.1" width="4.8" height="4.8" fill={C.mark} strokeWidth="1.3" strokeLinejoin="miter" />
      </g>
    </Frame>
  );
}
