"use client";

import type { RefObject } from "react";
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
      {demo && <span className="ps-tag">Sample data</span>}
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

/**
 * One product's section (Blue Night, plan 3): the product's icon, a small label over its heading (eyebrows on), and
 * the heading itself in two tones, the product's name in ink and its claim, what it does for the visitor, in the
 * second tone ("Playground. Street-level analytics for all three markets."); a sentence or two, its one action and,
 * at most, one line of small print. Beside or under them the one working thing that shows the product (`object`), on
 * a navy card or a pale tile, and for the Connector the questions that drive it (`lead`). `aside` is a pale tile
 * under the words. The section sits in its band (ProductSections); none covers another (owner, 2026-10-14).
 *
 * `layout` sets how the section is composed from 1024px, so neighbours never share a composition: "chapter" (the
 * heading on the left and the words on the right, then the object the full width under them: Linear's chapter),
 * "mirror" (the object first, the words to its right), "stack" (the words across the top, the object and the lead
 * under them). Below 1024px every section is one column: the words with their action, then the object, then the lead.
 *
 * Its parts arrive once as they come into view and the section plays its one moment when it is a third in view
 * (`data-rv`, `data-moment`: Reveal.tsx and app/landing-motion.css); everything is in its final state without that.
 */
export function Card({
  cardRef,
  id,
  layout,
  eyebrow,
  name,
  icon,
  claim,
  body,
  action,
  note,
  aside,
  lead,
  object,
}: {
  cardRef?: RefObject<HTMLElement | null>;
  id: string;
  layout: "chapter" | "mirror" | "stack";
  /** The small label over the heading: how the visitor uses this product. */
  eyebrow: string;
  name: string;
  icon: React.ReactNode;
  /** What the product does for the visitor, in one sentence: the heading's second tone. */
  claim: string;
  body: React.ReactNode;
  action: React.ReactNode;
  /** The section's one line of small print, where it needs one. */
  note?: React.ReactNode;
  aside?: React.ReactNode;
  lead?: React.ReactNode;
  object: React.ReactNode;
}) {
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
  return (
    <section ref={cardRef} id={id} className="ps-card" data-card={id} data-layout={layout} data-moment="" aria-labelledby={`${id}-name`}>
      <div className="ps-card-text">
        <div className="ps-card-intro">
          <span className="ps-card-icon" data-rv="eb">
            {icon}
          </span>
          <p className="bn-eb" data-rv="eb" style={at(1)}>
            {eyebrow}
          </p>
          <h2 id={`${id}-name`} className="ps-card-name" data-rv="" style={at(1)}>
            {name}.{" "}
            <span className="ps-pay" data-rv="pay" style={at(3)}>
              {claim}
            </span>
          </h2>
        </div>
        <div className="ps-card-say">
          <div className="ps-lede" data-rv="" style={at(2)}>
            {body}
          </div>
          <div className="ps-card-action" data-rv="" style={at(3)}>
            {action}
          </div>
          {note && (
            <p className="ps-under" data-rv="" style={at(4)}>
              {note}
            </p>
          )}
          {aside}
        </div>
      </div>
      <div className="ps-card-object" data-rv="frame" style={at(2)}>
        {object}
      </div>
      {lead && (
        <div className="ps-card-lead" data-rv="frame" style={at(3)}>
          {lead}
        </div>
      )}
    </section>
  );
}
