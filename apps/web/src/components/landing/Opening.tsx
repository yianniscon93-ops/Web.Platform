"use client";

import { useEffect, useRef } from "react";
import { OPENING_LATEST_MS, OPENING_TOUR_LEAD_MS, endOpening, landOpening, openingState } from "@/lib/landing/opening";
import { CORNERS, PLOT, TIGHT } from "./AreaMark";
import { LANDING } from "./tokens";
import { NAME_AFTER, NAME_BEFORE, WORDMARK_PLOT } from "./Wordmark";

/* The opening's times. Up to the closed "o" it is the stylesheet's, so it plays from the first paint whether or
   not the page's script has arrived (app/landing-hero.css has the keyframes; the two times below are theirs, for
   the corners' delays). From there it is played here. */
const DRAW_AT_MS = 620;
/** The line takes as long as the mark's own intro (AreaMark). */
const DRAW_MS = 820;
/* The whole name stays to be read before it leaves (owner, 2026-10-12: "can we keep it for some more time?"). In
   that time the pointer rests on the corner it closed, then crosses to the map and waits on the first area's
   first corner (owner, 2026-10-13: "the pointer walks to the map"). */
const HOLD_MS = 1200;
const REST_MS = 250;
const WALK_MS = 760;
const LIFT_MS = 620;
/** The words come in when the name has cleared the headline; this is only how long to wait if that cannot be read. */
const WORDS_LATEST_MS = 360;
/** The tour's own pointer shows on its first corner this long before it moves (TownTour's POINTER_IN). */
const SWAP_MS = 250;
/** A page that comes alive this long after the "o" closed has no time left for the pointer's walk. */
const WALK_LATEST_MS = 400;
/** The pointer drawn inside the plot, in the mark's units: the tour's 22px pointer at about that size on a 110px name. */
const PEN_SCALE = 0.36;
const POINTER_PX = 22;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const PULSE: Keyframe[] = [{ transform: "scale(1)" }, { transform: "scale(1.4)", offset: 0.15 }, { transform: "scale(1)" }];
const outQuart = (t: number) => 1 - (1 - t) ** 4;

/* The plot's outline as one run: how far round each corner lies (0 to 1), which is when the line reaches it. */
const [VIEW_X, VIEW_Y, VIEW_W, VIEW_H] = TIGHT.split(" ").map(Number);
const SIDES = CORNERS.map(([x, y], i) => {
  const [nx, ny] = CORNERS[(i + 1) % CORNERS.length];
  return Math.hypot(nx - x, ny - y);
});
const ROUND = SIDES.reduce((a, b) => a + b, 0);
const REACHED_MS = SIDES.map((_, i) => Math.round(DRAW_AT_MS + (SIDES.slice(0, i).reduce((a, b) => a + b, 0) / ROUND) * DRAW_MS));

/* How many of these are mounted: React's development double mount takes one down and puts it straight back,
   which must not end the opening; a page that has really gone must. */
let mounted = 0;

/**
 * The first screen's opening, played where the words will be (lib/landing/opening.ts has the whole of it). The
 * name is the wordmark's own markup at the size of the column, so when it has gone up it lies exactly on the
 * nav's. Its "o" is drawn by the tour's pointer, corner by corner, by the stylesheet alone; what is played here
 * is what follows: the pointer crosses to the map, the name goes up, the words come in as it clears them, and
 * the tour takes the pointer over. Any scroll, key or press ends it at once. Nothing here is shown unless the
 * document was marked before the first paint, and the page under it is whole without it.
 */
export default function Opening() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || openingState() !== "on") return;
    const name = el.querySelector<HTMLElement>(".op-name");
    const plot = el.querySelector<SVGSVGElement>(".wm-o");
    const pen = el.querySelector<SVGGElement>(".op-pen");
    const pointer = el.querySelector<HTMLElement>(".op-pointer");
    if (!name || !plot || !pen || !pointer) return;
    const words = [...document.querySelectorAll<HTMLElement>(".lh-copy > :not(.op)")];

    mounted++;
    // From here a press is this component's to answer, not the document's own script's (OPENING_SCRIPT).
    el.dataset.live = "";
    let live = true;
    let landed = false;
    const timers: number[] = [];
    const running: Animation[] = [];
    const wait = (ms: number) => new Promise<void>((done) => timers.push(window.setTimeout(done, ms)));
    const tween = (ms: number, draw: (k: number) => void) =>
      new Promise<void>((done) => {
        const from = performance.now();
        const step = (now: number) => {
          if (!live) return;
          const t = Math.min(1, Math.max(0, (now - from) / ms));
          draw(outQuart(t));
          if (t < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      });

    // The words come in one after another, and the tour is told it may draw.
    const land = () => {
      if (landed) return;
      landed = true;
      landOpening();
      words.forEach((w, i) =>
        running.push(w.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: i * 90, easing: EASE, fill: "backwards" })),
      );
    };
    const skip = () => finish(true);
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    const unlisten = () => EVENTS.forEach((type) => window.removeEventListener(type, skip));
    function finish(cut = false) {
      if (!live) return;
      live = false;
      timers.forEach((t) => window.clearTimeout(t));
      unlisten();
      const done = () => {
        land();
        endOpening();
      };
      // Cut short, the name is gone before the words begin, so the one never lies over the other.
      if (cut) el!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: "forwards" }).finished.then(done, done);
      else done();
    }

    // A page that came alive too late shows itself as it is.
    if (performance.now() > OPENING_LATEST_MS) {
      finish(true);
      return () => void mounted--;
    }
    EVENTS.forEach((type) => window.addEventListener(type, skip, { passive: true }));

    (async () => {
      // The name and its "o" are the stylesheet's: wait for the line to close, and see how long ago it did.
      const drawn = name.getAnimations({ subtree: true });
      await Promise.all(drawn.map((a) => a.finished)).catch(() => {});
      if (!live) return;
      const closedAt = Math.max(0, ...drawn.map((a) => Number(a.startTime ?? 0) + Number(a.effect?.getComputedTiming().endTime ?? 0)));
      const since = () => Number(document.timeline.currentTime ?? 0) - closedAt;

      // The pointer leaves the plot for the map. The one that drew the "o" is part of the name and would go up
      // with it, so the tour's own pointer (in this box, not in the name) takes its place, at its size.
      // Where it is going is read from the layout, not from the corner as drawn: that corner has not dropped in yet.
      const node = document.querySelector<HTMLElement>(".lh-stop .lh-node");
      const host = node?.offsetParent instanceof HTMLElement ? node.offsetParent : null;
      const sheet = host?.getBoundingClientRect();
      if (drawn.length > 0 && since() < WALK_LATEST_MS && node && host && sheet && sheet.width > 0) {
        await wait(REST_MS);
        if (!live) return;
        const box = el.getBoundingClientRect();
        const o = plot.getBoundingClientRect();
        const from: [number, number] = [o.left - box.left + ((CORNERS[0][0] - VIEW_X) / VIEW_W) * o.width, o.top - box.top + ((CORNERS[0][1] - VIEW_Y) / VIEW_H) * o.height];
        const unit = sheet.width / host.offsetWidth;
        const to: [number, number] = [
          sheet.left + (node.offsetLeft + node.offsetWidth / 2) * unit - box.left,
          sheet.top + (node.offsetTop + node.offsetHeight / 2) * unit - box.top,
        ];
        const small = (PEN_SCALE * o.width) / VIEW_W;
        const put = (k: number) => {
          pointer.style.transform = `translate(${from[0] + (to[0] - from[0]) * k}px, ${from[1] + (to[1] - from[1]) * k}px) scale(${small + (1 - small) * k})`;
        };
        put(0);
        pointer.style.opacity = "1";
        pen.style.visibility = "hidden";
        await tween(WALK_MS, put);
      } else {
        running.push(pen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }));
      }
      await wait(Math.max(0, HOLD_MS - since()));
      if (!live) return;

      // The name goes up to the nav's, shrinking about its own top left corner, so it ends lying on it. It leaves
      // at once, and the words come in when its foot has cleared the headline's head.
      const target = document.querySelector("header.th-landing .wm");
      if (!target) return finish();
      const top = (words[0]?.getBoundingClientRect().top ?? 0) - 6;
      const at = name.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const lift = name.animate([{ transform: "none" }, { transform: `translate(${to.left - at.left}px, ${to.top - at.top}px) scale(${to.width / at.width})` }], {
        duration: LIFT_MS,
        easing: EASE,
        fill: "forwards",
      });
      running.push(lift);
      const lifted = performance.now();
      const clear = () => {
        if (!live || landed) return;
        if (name.getBoundingClientRect().bottom <= top || performance.now() - lifted > WORDS_LATEST_MS) {
          land();
          // The tour's pointer shows on the same corner as the drawing starts: this one gives way to it.
          if (pointer.style.opacity === "1")
            timers.push(
              window.setTimeout(
                () => running.push(pointer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SWAP_MS, fill: "forwards" })),
                Math.max(0, OPENING_TOUR_LEAD_MS - SWAP_MS),
              ),
            );
        } else requestAnimationFrame(clear);
      };
      requestAnimationFrame(clear);
      const handed = wait(OPENING_TOUR_LEAD_MS + WORDS_LATEST_MS);
      await lift.finished.catch(() => {});
      if (!live) return;
      // It is seated: its corners answer, one after another, as the mark's do when its line closes.
      el.querySelectorAll(".op-corner").forEach((c, i) => running.push(c.animate(PULSE, { duration: 320, delay: i * 40, easing: EASE })));
      // The nav's own name takes over once the pointer has been handed to the tour.
      await handed;
      finish();
    })();

    return () => {
      const playing = live;
      live = false;
      timers.forEach((t) => window.clearTimeout(t));
      unlisten();
      running.forEach((a) => a.cancel());
      // Left as the markup was, for a second mount to start again from.
      pen.style.visibility = "";
      pointer.style.opacity = pointer.style.transform = "";
      mounted--;
      if (playing) window.setTimeout(() => mounted === 0 && openingState() && endOpening(), 0);
    };
  }, []);

  return (
    <div ref={root} className="op" aria-hidden="true">
      {/* The wordmark's own classes (Wordmark.tsx), so the two are one drawing at two sizes. */}
      <span className="wm op-name">
        <span className="op-half">{NAME_BEFORE}</span>
        <svg className="wm-o" width="0.76em" height="0.76em" viewBox={TIGHT} fill="none" style={{ overflow: "visible" }}>
          <path
            className="op-line"
            d={PLOT}
            pathLength={1}
            stroke="currentColor"
            strokeWidth={WORDMARK_PLOT.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <g fill={LANDING.area}>
            {CORNERS.map(([x, y], i) => (
              // Each drops in as the line reaches it; the first answers once more as the line closes on it.
              <circle
                key={`${x}.${y}`}
                className="op-corner"
                cx={x}
                cy={y}
                r={WORDMARK_PLOT.cornerRadius}
                style={{ animationDelay: i === 0 ? `${REACHED_MS[0]}ms, ${DRAW_AT_MS + DRAW_MS}ms` : `${REACHED_MS[i]}ms` }}
              />
            ))}
          </g>
          {/* The tour's pointer (TownTour.tsx), riding the end of the line: the hand that draws the areas draws the name. */}
          <g className="op-pen" style={{ offsetPath: `path("${PLOT}")` }}>
            <path transform={`scale(${PEN_SCALE}) translate(-4 -2.5)`} d="M4 2.5v15l4.2-3.9 2.9 6 2.7-1.3-2.9-5.9h5.6z" />
          </g>
        </svg>
        <span className="op-half">{NAME_AFTER}</span>
      </span>
      {/* The same pointer once it has left the name for the map. */}
      <span className="lh-pointer op-pointer">
        <svg width={POINTER_PX} height={POINTER_PX} viewBox="0 0 22 22" fill="none">
          <path d="M4 2.5v15l4.2-3.9 2.9 6 2.7-1.3-2.9-5.9h5.6z" />
        </svg>
      </span>
    </div>
  );
}
