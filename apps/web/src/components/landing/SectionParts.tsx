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
 * One product's card in the stack: a 56px header row (icon, name, the card's one action), then its body.
 * The body's parts are in the order a phone shows them: the sentence, `lead` (what drives the object and so
 * comes before it, like the Connector's questions), the working `object`, the `notes` (the product's plain
 * statements, with `aside`, a line on what the object is), and the action again at the foot (a phone's header
 * row has room for the name only). From 1024px the sentence and the notes share the first column and the
 * object takes the rest.
 *
 * `index` is the card's place in the stack (it sets how far down it pins); `arrived` and `arriving` are its
 * arrival (useArrival), which its styles and its contents key their one moment on. A card has no entrance of
 * its own beyond that moment: pinned or not, it is fully there before it and without it.
 */
export function Card({
  cardRef,
  id,
  index,
  name,
  icon,
  sentence,
  action,
  lead,
  object,
  notes,
  aside,
  arrived,
  arriving,
}: {
  cardRef: RefObject<HTMLElement | null>;
  id: string;
  index: number;
  name: string;
  icon: React.ReactNode;
  sentence: string;
  action: React.ReactNode;
  lead?: React.ReactNode;
  object: React.ReactNode;
  notes: string[];
  aside: string;
  arrived: boolean;
  arriving: boolean;
}) {
  return (
    <section
      ref={cardRef}
      id={id}
      className="ps-card"
      data-card={id}
      data-arrived={arrived ? "" : undefined}
      data-arriving={arriving ? "" : undefined}
      style={{ "--i": index } as React.CSSProperties}
      aria-labelledby={`${id}-name`}
    >
      {/* The card's own height, whatever height it is stretched to when pinned: the stack measures this. */}
      <div className="ps-card-in">
        <header className="ps-card-head">
          <span className="ps-card-icon">{icon}</span>
          <h2 id={`${id}-name`} className="ps-card-name">
            {/* The name is the way to the card: with other cards over it, its header row is all that shows. */}
            <a href={`#${id}`}>{name}</a>
          </h2>
          <div className="ps-card-action">{action}</div>
        </header>
        <div className="ps-card-body" data-lead={lead ? "" : undefined}>
          <p className="ps-lede">{sentence}</p>
          {lead && <div className="ps-card-lead">{lead}</div>}
          <div className="ps-card-object">{object}</div>
          {/* The product's statements, as plain lines, and what the object is. */}
          <div className="ps-card-foot">
            <ul className="ps-notes">
              {notes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="ps-under">{aside}</p>
          </div>
          <div className="ps-card-end">{action}</div>
        </div>
      </div>
    </section>
  );
}
