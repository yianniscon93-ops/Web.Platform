"use client";

import { useEffect, useState, type RefObject } from "react";
import { READING, UNREACHABLE } from "@/lib/landing/areaLines";
import { QUESTION_EVENT, QUESTION_KEY } from "@/lib/landing/compare";

/** What stands in for a chart or table that has nothing to draw. */
export const NO_FIGURES = "No figures for this area yet";
// What a figure block says while its first answer is on its way, and when the API cannot be reached: the hero's words.
export { READING, UNREACHABLE };

/**
 * Whether an answer is for the drawn area. Every live query is filtered by
 * the polygon. Of the demo fallbacks only /stats and /pricing are (they
 * never come through here); demoRentals, demoInvest and demoPace in
 * marketData.ts take no polygon and return one island-wide answer.
 */
export const inside = (r: { source: "live" | "demo" } | null | undefined) => r?.source === "live";

/** Hands a request to the access form at the foot of the page, which shows it beside the email field. */
export function carryRequest(line: string) {
  try {
    sessionStorage.setItem(QUESTION_KEY, line);
  } catch {}
  window.dispatchEvent(new CustomEvent(QUESTION_EVENT, { detail: line }));
}

/** Under a figure block: a mark when its answer is demo data, and what the figures cover. */
export function Covers({
  demo,
  scope,
  children,
}: {
  demo: boolean;
  /** "inside the line", "all of Cyprus", or nothing when the block says it elsewhere. */
  scope?: string;
  children?: React.ReactNode;
}) {
  if (!demo && !scope && !children) return null;
  return (
    <p className="ps-covers">
      {demo && <span className="ps-tag">Demo data</span>}
      {scope && <span>{scope}</span>}
      {children}
    </p>
  );
}

/** A line of words where a figure block has no figures: still loading, unreachable, or nothing to draw. */
export function Standin({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <p className="ps-standin" aria-busy={busy || undefined} data-busy={busy ? "" : undefined}>
      {children}
    </p>
  );
}

/** True when the visitor has asked for less motion: then nothing on the cards plays. */
export const stillPreferred = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long a card's arrival is "playing": while it is, its first-time moments run at their full length.
const ARRIVING_MS = 1800;

/**
 * A card's arrival: `arrived` turns true, for good, the first time 40% of the card is in view (or half the
 * window's height of it, for a card much taller than the window), and `arriving` is true for the short while
 * after that in which the card's contents play their one authored moment. Everything on the card is in its
 * final state without it; under reduced motion `arriving` never turns true.
 */
export function useArrival(ref: RefObject<Element | null>): { arrived: boolean; arriving: boolean } {
  const [arrived, setArrived] = useState(false);
  const [arriving, setArriving] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || arrived) return;
    if (typeof IntersectionObserver === "undefined") {
      setArrived(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const tall = entry.rootBounds ? entry.intersectionRect.height >= entry.rootBounds.height * 0.5 : false;
        if (entry.intersectionRatio >= 0.4 || tall) setArrived(true);
      },
      { threshold: [0.1, 0.2, 0.3, 0.4, 0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, arrived]);
  useEffect(() => {
    if (!arrived || stillPreferred()) return;
    setArriving(true);
    const t = setTimeout(() => setArriving(false), ARRIVING_MS);
    return () => clearTimeout(t);
  }, [arrived]);
  return { arrived, arriving };
}

/**
 * One product's section: a panel on its own ground, with the product's name as its heading (its icon beside it),
 * one claim under the name, a sentence or two, the product's one action and, at most, one line of small print.
 * Beside them, the one working thing that shows the product (`object`), and for the Connector the questions that
 * drive it (`lead`). The panels follow one another; none covers another (owner, 2026-10-14).
 *
 * `layout` sets how the panel is composed from 1024px, so neighbours never share a composition: "split" (the words,
 * then the object to their right), "mirror" (the object first, the words to its right), "stack" (the words across
 * the top, the object and the lead under them). Below 1024px every panel is one column: the words, the object, the
 * lead, and the action again at the foot (the one beside the words shows from 1024px only). `arrived` and `arriving` are its arrival (useArrival), which its contents key their one moment on.
 */
export function Card({
  cardRef,
  id,
  layout,
  name,
  icon,
  claim,
  body,
  action,
  note,
  lead,
  object,
  arrived,
  arriving,
}: {
  cardRef: RefObject<HTMLElement | null>;
  id: string;
  layout: "split" | "mirror" | "stack";
  name: string;
  icon: React.ReactNode;
  /** What the product does for the visitor, in one sentence under its name. */
  claim: string;
  body: React.ReactNode;
  action: React.ReactNode;
  /** The panel's one line of small print, where it needs one. */
  note?: React.ReactNode;
  lead?: React.ReactNode;
  object: React.ReactNode;
  arrived: boolean;
  arriving: boolean;
}) {
  return (
    <section
      ref={cardRef}
      id={id}
      className="ps-card"
      data-card={id}
      data-layout={layout}
      data-arrived={arrived ? "" : undefined}
      data-arriving={arriving ? "" : undefined}
      aria-labelledby={`${id}-name`}
    >
      <div className="ps-card-text">
        <div className="ps-card-intro">
          <h2 id={`${id}-name`} className="ps-card-name">
            <span className="ps-card-icon">{icon}</span>
            {name}
          </h2>
          <p className="ps-claim">{claim}</p>
        </div>
        <div className="ps-card-say">
          <div className="ps-lede">{body}</div>
          <div className="ps-card-action">{action}</div>
          {note && <p className="ps-under">{note}</p>}
        </div>
      </div>
      <div className="ps-card-object">{object}</div>
      {lead && <div className="ps-card-lead">{lead}</div>}
      {/* Below 1024px the action comes after the working thing, so the visitor sees it before being asked to act. */}
      <div className="ps-card-end">{action}</div>
    </section>
  );
}
