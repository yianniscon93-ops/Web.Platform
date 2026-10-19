"use client";

import { useEffect } from "react";

/**
 * The landing's scroll motion, in one small module mounted once on the page (plan 3, owner 2026-10-17: "I like the
 * motion. if it can be smoother I prefer it"). It draws nothing. Its styles are app/landing-motion.css.
 *
 * - Arrivals (`data-rv`): a heading, a sentence, a frame rises in once as it comes into view. The server sends every
 *   one of them visible; after the page has loaded this hides (`data-rv-wait`) only those wholly below the window at
 *   that moment, and shows each once as it arrives. No script, nothing is hidden; reduced motion, nothing is hidden.
 * - Moments (`data-moment`): a block whose contents play one authored moment when 35% of it is in view (the report's
 *   page laid down, the first answer streamed, the month filling, the name drawn in the close); a block with counts in
 *   it when 15% is, so its figures have landed by the time it is read. Armed the same way
 *   (`data-mwait` while it waits, then `data-on`, and `data-arriving` for the length of the moment). A block already
 *   in view when the page loads is simply shown as it is (`data-on`), so nothing in view blinks.
 * - Count-ups (`data-count` inside a moment): a true database figure counts up from 86% of itself to itself in
 *   0.9s, in tabular figures. The page is sent with the true number; it is set to where it starts only while it is out of
 *   sight below the window, and screen readers are given the true one throughout (the counting digits are hidden
 *   from them).
 * - The method story (`.mt-story`): the server sends each picture beside its own step. With motion welcome this
 *   takes the story over (`data-framed`), and on a wide window the CSS then holds the four pictures in one frame;
 *   the step across the window's middle (`data-step`) is the active one: it decides which picture shows, which dot is
 *   lit on the rail and which step's words are in ink, and its picture plays its moment, in time, the first time it
 *   arrives (2026-10-18: nothing in the story is scrubbed with the scroll any more, in any browser). On a phone each
 *   picture plays its moment as it arrives, like any block. Without script or with reduced motion the story is never
 *   framed, so every picture stays in view beside its step.
 * - Focus: anything waiting (`data-rv-wait`, `data-mwait`) that takes the keyboard's focus is shown at once and for
 *   good (the CSS shows it while it holds focus, this settles it).
 *
 * Only opacity and transform move (CSS); no scroll listener; nothing new is loaded.
 */
const COUNT_MS = 900;
const COUNT_FROM = 0.86;
const ARRIVING_MS = 3400;

const fmt = (v: number) => Math.round(v).toLocaleString("en-GB");

/** Where a count starts: 86% of it, never with fewer digits than it has, so its width holds while it counts. */
function startOf(to: number) {
  const from = Math.round(to * COUNT_FROM);
  const floor = 10 ** (String(Math.round(to)).length - 1);
  return to >= 10 ? Math.max(from, floor) : to;
}

export default function Reveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".bn");
    if (!root) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observes = typeof IntersectionObserver !== "undefined";
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const story = root.querySelector<HTMLElement>(".mt-story");
    // On a wide window with motion the story's pictures share one held frame, and the step at the middle decides which
    // shows.
    const framed = !!story && wide && !still && observes;
    const observers: IntersectionObserver[] = [];
    const timers: number[] = [];
    const frames: number[] = [];
    // Taking the story over: only with motion welcome and a way to follow the step, else it stays beside its steps.
    if (story && !still && observes) story.setAttribute("data-framed", "");

    const count = (el: HTMLElement, animate: boolean) => {
      const to = Number(el.dataset.count);
      if (!Number.isFinite(to)) return;
      if (!animate) {
        el.textContent = fmt(to);
        return;
      }
      const from = startOf(to);
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / COUNT_MS);
        const e = 1 - (1 - p) ** 3;
        el.textContent = fmt(from + (to - from) * e);
        if (p < 1) frames.push(requestAnimationFrame(step));
      };
      el.textContent = fmt(from);
      frames.push(requestAnimationFrame(step));
    };
    const settle = (m: HTMLElement) => {
      m.removeAttribute("data-mwait");
      m.setAttribute("data-on", "");
      m.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => count(c, false));
    };
    // Waiting to arrive: its moment's first state, and its counts at where they will start (it is out of sight).
    const arm = (m: HTMLElement) => {
      m.setAttribute("data-mwait", "");
      m.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
        const to = Number(c.dataset.count);
        if (Number.isFinite(to)) c.textContent = fmt(startOf(to));
      });
    };
    const play = (m: HTMLElement) => {
      if (m.hasAttribute("data-on")) return;
      m.removeAttribute("data-mwait");
      m.setAttribute("data-on", "");
      m.setAttribute("data-arriving", "");
      m.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => count(c, true));
      timers.push(window.setTimeout(() => m.removeAttribute("data-arriving"), ARRIVING_MS));
    };
    // Printing shows everything, finished.
    const printAll = () => {
      root.querySelectorAll<HTMLElement>("[data-rv-wait]").forEach((e) => e.removeAttribute("data-rv-wait"));
      root.querySelectorAll<HTMLElement>("[data-moment]").forEach(settle);
    };
    window.addEventListener("beforeprint", printAll);
    // Focus inside a part still waiting: show it now, and keep it shown once the focus moves on.
    // `data-now` holds its transitions off for one style pass, so it is simply there, with no fade.
    const onFocus = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const waits: HTMLElement[] = [];
      for (let w = t.closest<HTMLElement>("[data-rv-wait], [data-mwait]"); w; w = w.parentElement?.closest<HTMLElement>("[data-rv-wait], [data-mwait]") ?? null) waits.push(w);
      if (!waits.length) return;
      waits.forEach((w) => w.setAttribute("data-now", ""));
      waits.forEach((w) => {
        w.removeAttribute("data-rv-wait");
        if (w.hasAttribute("data-mwait")) settle(w);
      });
      void root.offsetWidth;
      waits.forEach((w) => w.removeAttribute("data-now"));
    };
    root.addEventListener("focusin", onFocus);
    const unbind = () => {
      window.removeEventListener("beforeprint", printAll);
      root.removeEventListener("focusin", onFocus);
      story?.removeAttribute("data-framed");
    };

    // The story's step: whichever is across the window's middle (the framed picture, the rail and its dots).
    if (story && observes) {
      const steps = Array.from(story.querySelectorAll<HTMLElement>("[data-st]"));
      const pics = Array.from(story.querySelectorAll<HTMLElement>(".mt-pic[data-moment]"));
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const n = (e.target as HTMLElement).dataset.st;
            if (!n) continue;
            story.dataset.step = n;
            // Its picture plays its moment the first time its step arrives.
            if (framed && n !== "1") {
              const pic = pics.find((p) => p.dataset.pic === n);
              if (pic) (still ? settle : play)(pic);
            }
          }
        },
        { rootMargin: "-50% 0px -50% 0px" },
      );
      steps.forEach((s) => io.observe(s));
      observers.push(io);
    }

    if (still || !observes) {
      root.querySelectorAll<HTMLElement>("[data-moment]").forEach(settle);
      return () => {
        observers.forEach((o) => o.disconnect());
        unbind();
      };
    }

    const fold = window.innerHeight;
    try {
      // Arrivals: only what lies wholly below the window now is hidden, and each is shown once as it comes in.
      const rv = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.removeAttribute("data-rv-wait");
            rv.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      observers.push(rv);
      root.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
        if (el.getBoundingClientRect().top > fold) {
          el.setAttribute("data-rv-wait", "");
          rv.observe(el);
        }
      });

      // Moments: 35% in view (15% for a block with counts in it, 20% for a block over 560px tall), or half the window's
      // height of a block taller than the window.
      const mo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const tall = e.rootBounds ? e.intersectionRect.height >= e.rootBounds.height * 0.5 : false;
            // A tall block (a chapter, the conversation) starts at a fifth in view, so its card is never seen waiting.
            const need = (e.target as HTMLElement).querySelector("[data-count]") ? 0.15 : e.boundingClientRect.height > 560 ? 0.2 : 0.35;
            if (e.intersectionRatio >= need || tall) {
              play(e.target as HTMLElement);
              mo.unobserve(e.target);
            }
          }
        },
        { threshold: [0, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5] },
      );
      observers.push(mo);
      root.querySelectorAll<HTMLElement>("[data-moment]").forEach((m) => {
        // The story's pictures in the held frame: the step observer above plays each as its step arrives. They wait
        // only if the story is still below the window. The first is in view as soon as the frame is, so it plays as
        // any block does: its count never stands at its starting figure on screen.
        if (framed && m.classList.contains("mt-pic") && m.dataset.pic !== "1") {
          if (story!.getBoundingClientRect().top > fold * 0.6) arm(m);
          else settle(m);
          return;
        }
        if (m.getBoundingClientRect().top > fold * 0.85) {
          arm(m);
          mo.observe(m);
        } else {
          settle(m);
        }
      });
    } catch {
      root.querySelectorAll<HTMLElement>("[data-rv-wait]").forEach((e) => e.removeAttribute("data-rv-wait"));
      root.querySelectorAll<HTMLElement>("[data-moment]").forEach(settle);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => window.clearTimeout(t));
      frames.forEach((f) => cancelAnimationFrame(f));
      unbind();
    };
  }, []);
  return null;
}
