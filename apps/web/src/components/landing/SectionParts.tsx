"use client";

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
