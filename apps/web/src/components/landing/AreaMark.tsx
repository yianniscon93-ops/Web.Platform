"use client";

import { useEffect, useRef } from "react";
import { LANDING } from "./tokens";

/* The five corners of the plot, snapped to the map's grid of points. The same shape as before (2026-10-10,
   "Actually use J"): a hairline plot in the olive the stage draws with.
   2026-10-12: the owner liked Lordicon's animated polygon (a line that runs corner to corner, corner dots that
   pop as it arrives) and left the look to us. Nothing is copied from that icon, the shape and the code are ours:
   the corners are dots larger than the line, and the map's dots are off unless asked for. The same day he asked for three more things. "Make the lines more minimal": the line is a hairline
   again. "I prefer it to be not filled with colour": the orange wash inside is gone, the plot is an outline and
   five dots. And "when you hover above it the lines form and join on each dot": the line is drawn again from the
   first corner round, where a corner used to be pulled out. He also asked for the plot to be the "o" of the
   name (Wordmark.tsx), which is why the line, the dots and the frame can be set from outside. Last, the colours:
   "Why dont we use black lines for the logo and then the dots that join these lines to be the olive green of our
   palette?" The line is the ink of the letters around it and the dots are olive; the mark carries no orange. */
/* The corners, the outline and the tight frame are also the opening's (Opening.tsx), which draws the same plot large. */
export const CORNERS: [number, number][] = [
  [7, 9.5],
  [22.5, 6],
  [29, 19],
  [19, 28],
  [7, 22],
];
const GRID = [4, 10.5, 17, 23.5, 30];
export const PLOT = `M${CORNERS.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
/* The plot and its dots with no margin round them, for the mark set as a letter. */
export const TIGHT = "3.5 2.5 29 29";

/* The intro. The line runs the outline once at an even pace, so a corner pops when the line has covered the
   share of the outline that lies before it (0, 0.228, 0.436, 0.629 and 0.821 of its length). */
const DRAW_MS = 820;
const POP_AT = (() => {
  const before: number[] = [];
  let run = 0;
  CORNERS.forEach(([x, y], i) => {
    before.push(run);
    const [nx, ny] = CORNERS[(i + 1) % CORNERS.length];
    run += Math.hypot(nx - x, ny - y);
  });
  return before.map((b) => Math.round((b / run) * DRAW_MS));
})();

/* The hover: the line goes and is drawn again at an even pace, and each dot gives a small pulse as the
   line reaches it. The dots themselves never leave. */
const REDRAW_MS = 700;
const PULSE_MS = 320;

/* The intro is CSS that ships with the markup, so it starts at first paint; started from an effect, the mark
   would sit complete, vanish when React hydrates and then redraw. The dash lives in the keyframes only (the line
   has pathLength 1, so nothing is measured): once the intro is over, and wherever it never runs, the mark is the
   plain markup. The pops peak a tenth of the way in and settle for the rest; the hover's pulse has that shape too. */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DRAW = [
  { strokeDasharray: "1", strokeDashoffset: 1 },
  { strokeDasharray: "1", strokeDashoffset: 0 },
];
const PULSE = [
  { transform: "scale(1)", easing: EASE },
  { transform: "scale(1.35)", offset: 0.1, easing: EASE },
  { transform: "scale(1)" },
];
const CSS = `
.am-corner { transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: no-preference) {
  .am-line { animation: am-draw ${DRAW_MS}ms linear backwards; }
  .am-corner { animation: am-pop 360ms ${EASE} backwards; }
  .am-corner:first-child { animation: am-pop 360ms ${EASE} backwards, am-close 320ms ${EASE}; }
}
@keyframes am-draw { from { stroke-dasharray: 1; stroke-dashoffset: 1; } to { stroke-dasharray: 1; stroke-dashoffset: 0; } }
@keyframes am-pop { 0% { opacity: 0; transform: scale(0.4); } 10% { opacity: 1; transform: scale(1.5); } 100% { transform: scale(1); } }
@keyframes am-close { 0%, 100% { transform: scale(1); } 10% { transform: scale(1.45); } }
`;

/**
 * The brand mark: the plot as the stage draws it, an outline and its five corners. `line` is the colour of the
 * drawn line: the ink of the text it sits in, so on the footer's ink ground it is that ground's light ink with
 * nothing handed in. `corners` is the colour of the five dots, the palette's olive; the footer hands in a
 * lighter olive, since the palette's own is 2.4:1 on ink. `handles` leaves them out. `grid`
 * adds the map's grid of points behind the plot, in `dots`: it is off unless asked for, since beside corners this
 * size it is noise at 24 to 32px.
 *
 * `strokeWidth` and `cornerRadius` are in the drawing's own units (34 across). `tight` frames the plot and its
 * dots with no margin, so the mark can be set as a letter; `size` then takes a length in em, and `className`
 * carries where it sits on the line.
 *
 * It draws itself once when the page first paints, and is drawn again when the link it sits in is hovered with a
 * mouse or reached with the keyboard. Neither happens for a visitor who asked for less motion.
 */
export default function AreaMark({
  size = 34,
  line = "currentColor",
  corners = LANDING.area,
  dots = LANDING.ink,
  strokeWidth = 1.25,
  cornerRadius = 2.2,
  tight = false,
  grid = false,
  handles = true,
  className,
}: {
  size?: number | string;
  line?: string;
  corners?: string;
  dots?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  tight?: boolean;
  grid?: boolean;
  handles?: boolean;
  className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    // The whole link answers, the rest of the name too; a mark that is not in a link answers for itself.
    const host: Element = el.closest("a") ?? el;
    let running: Animation[] = [];

    // These animations hold nothing when they end, so the mark is left as its markup: no dash on the line.
    // A hover that arrives while the line is still being drawn, here or in the intro, is ignored.
    const redraw = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (typeof el.getAnimations !== "function" || el.getAnimations({ subtree: true }).length > 0) return;
      const drawn = el.querySelector(".am-line");
      if (!drawn) return;
      running = [drawn.animate(DRAW, { duration: REDRAW_MS, easing: "linear" })];
      el.querySelectorAll(".am-corner").forEach((corner, i) => {
        const reached = (POP_AT[i] / DRAW_MS) * REDRAW_MS;
        running.push(corner.animate(PULSE, { duration: PULSE_MS, delay: reached }));
        // The line sets off from the first corner and closes on it: it answers both times.
        if (i === 0) running.push(corner.animate(PULSE, { duration: PULSE_MS, delay: REDRAW_MS }));
      });
    };

    // A mouse only: a finger's tap would redraw the line as the page leaves. Focus counts when the keyboard gave it.
    const onEnter = (e: Event) => {
      if ((e as PointerEvent).pointerType === "mouse") redraw();
    };
    const onFocus = () => {
      // A browser that does not know the selector throws on it; there the keyboard simply does not redraw.
      try {
        if (host.matches(":focus-visible")) redraw();
      } catch {}
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("focus", onFocus);
    return () => {
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("focus", onFocus);
      running.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <>
      {/* One copy in the head however many marks the page holds. */}
      <style href="area-mark" precedence="medium">
        {CSS}
      </style>
      {/* A corner that pops or pulses leaves the tight frame for a moment. */}
      <svg
        ref={svg}
        className={className}
        width={size}
        height={size}
        viewBox={tight ? TIGHT : "0 0 34 34"}
        fill="none"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        {grid && (
          <g fill={dots} opacity="0.35">
            {GRID.map((x) => GRID.map((y) => <circle key={`${x}.${y}`} cx={x} cy={y} r="0.75" />))}
          </g>
        )}
        <path
          className="am-line"
          d={PLOT}
          pathLength={1}
          stroke={line}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {handles && (
          <g fill={corners}>
            {CORNERS.map(([x, y], i) => (
              <circle
                key={`${x}.${y}`}
                className="am-corner"
                cx={x}
                cy={y}
                r={cornerRadius}
                // When the line reaches this corner; the first pops once more as the line closes on it.
                style={{ animationDelay: i === 0 ? `0ms, ${DRAW_MS}ms` : `${POP_AT[i]}ms` }}
              />
            ))}
          </g>
        )}
      </svg>
    </>
  );
}
