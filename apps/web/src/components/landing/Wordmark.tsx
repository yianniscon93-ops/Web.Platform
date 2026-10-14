import { BRAND } from "@/lib/brand";
import AreaMark from "./AreaMark";

/* The name with the plot as its "o" (owner, 2026-10-12: "lets use the O of plotsights for the logo instead of
   outside of it"). The name is split at its first "o", so the halves follow the brand's name wherever it is set. */
const AT = BRAND.name.indexOf("o");
const BEFORE = BRAND.name.slice(0, AT);
const AFTER = BRAND.name.slice(AT + 1);
/* The two halves and the plot's weights, for the opening (Opening.tsx), which sets the same name large. */
export const NAME_BEFORE = BEFORE;
export const NAME_AFTER = AFTER;
export const WORDMARK_PLOT = { strokeWidth: 2.1, cornerRadius: 3.2 } as const;

/* The plot is set as a letter: in its tight frame, a touch larger than the round letters since an outline with
   dots reads smaller than a filled bowl, and dropped so its lowest dot overshoots the baseline as an "o" does.
   The margins leave the gaps the type's own "o" has: 0.07em from the "l" to the two left dots (the type's is
   0.065em), and the right dot 0.115em from the stem of the "t" (0.095em), under its bar. The right margin is
   a little under zero because the plot ends in a single dot there, and a point reads farther off than a bowl.
   The line and the dots are heavier than the standalone mark's hairline, in the mark's own units, to hold
   beside the display weight.
   The letter itself stays in the text, set at no size just before the plot, so the name is written once and
   whole: what is read aloud, found, copied or taken as the link's text is "Plotsights", and only the plot is for
   the eye alone. It is kept inline (not lifted out of the flow), since a block in the middle of a word is read
   as a gap. */
const CSS = `
.wm { display: inline-block; font-weight: var(--th-wordmark-weight, 600); letter-spacing: -0.035em; white-space: nowrap; }
.wm-letter { font-size: 0; }
.wm-o { display: inline-block; flex: none; vertical-align: -0.125em; margin: 0 -0.01em 0 0.03em; }
`;

/**
 * The wordmark: the name in the display role, its "o" the brand mark (AreaMark, which brings the drawing and its
 * motion). `size` is the type's size in px; without it the wordmark takes the size of where it is set. The plot's
 * line is the colour of the letters. `corners` is the colour of its dots where the palette's olive would not
 * show: the footer, on ink, hands in a lighter one.
 */
export default function Wordmark({ size, corners }: { size?: number; corners?: string }) {
  return (
    <>
      <style href="wordmark" precedence="medium">
        {CSS}
      </style>
      <span className="wm" style={size ? { fontSize: size } : undefined}>
        {AT < 0 ? (
          BRAND.name
        ) : (
          <>
            {BEFORE}
            <span className="wm-letter">o</span>
            <AreaMark className="wm-o" size="0.76em" tight corners={corners} {...WORDMARK_PLOT} />
            {AFTER}
          </>
        )}
      </span>
    </>
  );
}
