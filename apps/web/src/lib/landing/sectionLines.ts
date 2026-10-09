import type { InvestStats, SelectionStats, WeeklyPoint } from "@/lib/dashboard/types";
import {
  MIN_LISTINGS,
  MONTHS,
  MONTH_NAMES,
  SEASON,
  answer,
  euro,
  finding,
  inWords,
  int,
  lets,
  monthsOf,
  pct,
  weekOf,
} from "./areaLines";
import type { DrawnArea } from "./compare";

// What the product sections say about the drawn area, and the series their
// charts draw. Like the hero's lines (areaLines.ts), every sentence is built
// only from figures the page has; a missing figure shortens a sentence or
// leaves it out, it is never filled in. Where the hero already has a sentence
// or a way of writing a figure, that is used here, so the page words it one way.

export { euro, int, pct };

/** A point of a chart's series: when (UTC ms), the value, and how to name the moment. */
export interface SeriesPoint {
  t: number;
  v: number;
  /** "6 Apr" */
  label: string;
  y: number;
  m: number;
}

function dated(iso: string, v: number): SeriesPoint {
  const w = weekOf(iso.slice(0, 10));
  return { t: w.t, v, label: w.label, y: w.y, m: w.m };
}

/** One field of the weekly series as chart points; weeks without the figure are left out. */
export function weeklySeries(weekly: WeeklyPoint[], field: "effOcc" | "medianAdr"): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (const w of weekly) {
    const v = w[field];
    if (v != null) out.push(dated(w.weekStart, v));
  }
  return out;
}

/** The forward price curve as chart points; dates without a price are left out. */
export function forwardSeries(curve: Array<{ date: string; medianPrice: number | null }>): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (const d of curve) if (d.medianPrice != null) out.push(dated(d.date, d.medianPrice));
  return out;
}

/** "6 Apr to 5 Oct 2026": what a series covers. */
export function seriesRange(pts: SeriesPoint[]): string {
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${first.label}${first.y === last.y ? "" : ` ${first.y}`} to ${last.label} ${last.y}`;
}

/** "Oct" or, where the year matters, "Jan ’27", for a "2026-10" month. */
export function monthLabel(ym: string, withYear = false): string {
  const [y, m] = ym.split("-").map(Number);
  return withYear ? `${MONTHS[m - 1]} \u2019${String(y).slice(2)}` : MONTHS[m - 1];
}

export function monthName(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** Why an area has no figure to quote, in the hero's words, or null when it has enough listings. */
export function tooThin(count: number): string | null {
  return count < MIN_LISTINGS ? finding(count, null) : null;
}

/** The last week the series has a figure for. */
function lastWeek(weekly: WeeklyPoint[]) {
  for (let i = weekly.length - 1; i >= 0; i--) if (weekly[i].effOcc != null) return weekOf(weekly[i].weekStart);
  return null;
}

/** "As of the week of 5 Oct 2026": the date an answer's figures refer to, where the data carries one. */
function asOf(weekly: WeeklyPoint[]): string | null {
  const w = lastWeek(weekly);
  return w ? `As of the week of ${w.label} ${w.y}` : null;
}

/**
 * An example answer in the connector's own shape: what it says, then how firm
 * that is in one plain sentence, then the date the figures refer to where the
 * data carries one.
 */
export interface Reply {
  text: string;
  /** "Firm: it rests on 24 listings." The word before the colon is the level. */
  firm: string | null;
  asOf: string | null;
}

/**
 * How firm an answer is, from the number of listings it rests on: thin below
 * MIN_LISTINGS, firm from there. `figure` is false for an answer that quotes
 * no figure (it has already said the listings are too few), so there is
 * nothing to call a rough guide.
 */
function firmness(n: number, { noun = "listing", figure = true, where = "" } = {}): string {
  const things = `${int(n)} ${noun}${n === 1 ? "" : "s"}${where}`;
  if (n === 0) return `Thin: there are no ${noun}s to go on.`;
  if (n < MIN_LISTINGS) return figure ? `Thin: only ${things}, so treat it as a rough guide.` : `Thin: only ${things}.`;
  return `Firm: it rests on ${things}.`;
}

/** "How are short-lets doing in <area>?" The answer is the hero's own sentence for it. */
export function summaryReply(count: number, s: Pick<SelectionStats, "effOccTodate" | "medianRate" | "weekly">): Reply {
  const quoted = count >= MIN_LISTINGS;
  // Enough listings but neither figure: the answer states none, so there is nothing to call firm.
  const stated = s.effOccTodate != null || s.medianRate != null;
  return {
    text: answer(count, s),
    firm: quoted && !stated ? null : firmness(count, { figure: quoted }),
    asOf: quoted ? asOf(s.weekly) : null,
  };
}

/** "How has it moved over the year?" The fullest and the quietest full month of the weekly series. */
export function trendReply(count: number, weekly: WeeklyPoint[]): Reply {
  if (count < MIN_LISTINGS) return { text: answer(count, null), firm: firmness(count, { figure: false }), asOf: null };
  const months = monthsOf(weekly);
  if (months.length < 2) {
    return {
      text: "There are not enough weeks of bookings for this area to compare months yet.",
      firm: firmness(count, { figure: false }),
      asOf: asOf(weekly),
    };
  }
  // The first of them, on a tie.
  const fullest = months.reduce((a, b) => (b.occ > a.occ ? b : a));
  const quietest = months.reduce((a, b) => (b.occ < a.occ ? b : a));
  return {
    text:
      `Over the ${inWords(months.length)} full months shown, ${fullest.name} was the fullest, with ${pct(fullest.occ)} of nights occupied. ` +
      `${quietest.name} was the quietest, at ${pct(quietest.occ)}.`,
    firm: firmness(count),
    asOf: asOf(weekly),
  };
}

/**
 * "What do places with two or more bedrooms take here?" `s` is /stats
 * filtered to two or more bedrooms; `inside` is the count the page quotes for
 * the whole area. The filtered count can only come from /stats, which in demo
 * data also counts listings the map leaves out (those in the sea). It is
 * therefore quoted, in the answer and in its firmness line alike, only when
 * it does not exceed the page's own count; otherwise the same thing is said
 * without the number.
 */
export function bedroomsReply(s: SelectionStats, inside: number | null): Reply {
  const n = s.listingCount;
  const quote = inside == null || n <= inside;
  if (n === 0) {
    return {
      text: "No short\u2011lets with two or more bedrooms sit inside this area.",
      firm: firmness(0, { figure: false }),
      asOf: null,
    };
  }
  if (n < MIN_LISTINGS) {
    return {
      text: quote
        ? `Only ${int(n)} short\u2011let${n === 1 ? "" : "s"} with two or more bedrooms ${n === 1 ? "sits" : "sit"} inside this area, too few to quote a figure.`
        : "Too few short\u2011lets with two or more bedrooms sit inside this area to quote a figure.",
      firm: quote ? firmness(n, { figure: false }) : "Thin: too few listings to rest a figure on.",
      asOf: null,
    };
  }
  const occ = s.effOccTodate == null ? null : pct(s.effOccTodate);
  const rate = s.medianRate == null ? null : euro(s.medianRate);
  const firm = quote ? firmness(n) : "Firm: it rests on the listings with two or more bedrooms inside this area.";
  const when = asOf(s.weekly);
  if (occ && rate) {
    return { text: `Places with two or more bedrooms take a median ${rate} a night and fill ${occ} of nights ${SEASON}.`, firm, asOf: when };
  }
  if (rate) return { text: `Places with two or more bedrooms take a median ${rate} a night.`, firm, asOf: when };
  if (occ) {
    return {
      text: `Places with two or more bedrooms fill ${occ} of nights ${SEASON}. There is no nightly rate for them yet.`,
      firm,
      asOf: when,
    };
  }
  return {
    text: quote
      ? `There are ${int(n)} places with two or more bedrooms here, without enough bookings to quote a figure yet.`
      : "There are places with two or more bedrooms here, without enough bookings to quote a figure yet.",
    firm: quote ? firmness(n, { figure: false }) : null,
    asOf: when,
  };
}

/**
 * "Are sellers cutting prices here?" `inside` is whether the answer is for the
 * drawn area or the whole island (the demo fallback is island-wide): the
 * firmness line says which set of homes it rests on. With fewer than
 * MIN_LISTINGS homes for sale it quotes no figure, as everywhere on the page.
 * The for-sale figures carry no date, so the answer gives none.
 */
export function cutsReply(invest: InvestStats, inside: boolean): Reply {
  const where = inside ? "Inside this area" : "Across all of Cyprus";
  const noun = "for\u2011sale listing";
  if (invest.supply === 0) {
    return {
      text: inside
        ? "No homes for sale sit inside this area, so there are no price cuts to report."
        : "There are no homes for sale on record, so there are no price cuts to report.",
      firm: firmness(0, { noun, figure: false }),
      asOf: null,
    };
  }
  if (invest.supply < MIN_LISTINGS) {
    const homes = `${int(invest.supply)} home${invest.supply === 1 ? "" : "s"} for sale`;
    return {
      text: inside
        ? `Only ${homes} ${invest.supply === 1 ? "sits" : "sit"} inside this area, too few to read price changes from.`
        : `Only ${homes} ${invest.supply === 1 ? "is" : "are"} on record, too few to read price changes from.`,
      firm: firmness(invest.supply, { noun, figure: false, where: inside ? "" : " across all of Cyprus" }),
      asOf: null,
    };
  }
  const parts: string[] = [];
  if (invest.cutsCount != null) {
    const cut = invest.cutsMedianPct == null ? "" : `, by a median ${Math.abs(invest.cutsMedianPct).toFixed(1)}%`;
    parts.push(
      invest.cutsCount === 0
        ? `${where}, no home for sale has had its price cut.`
        : `${where}, ${int(invest.cutsCount)} home${invest.cutsCount === 1 ? "" : "s"} for sale ${invest.cutsCount === 1 ? "has" : "have"} had the price cut${cut}.`
    );
  }
  if (invest.domAvg != null) {
    parts.push(
      parts.length
        ? `Homes have been on the market for ${int(invest.domAvg)} days on average.`
        : `${where}, homes for sale have been on the market for ${int(invest.domAvg)} days on average.`
    );
  }
  const firm = firmness(invest.supply, {
    noun,
    figure: parts.length > 0,
    where: inside ? "" : " across all of Cyprus, not on this area alone",
  });
  if (!parts.length) return { text: "There is no record of price changes for the homes for sale here yet.", firm, asOf: null };
  return { text: parts.join(" "), firm, asOf: null };
}

/**
 * "Show me on the map." `drawn` is whether the small map has the listings on
 * it: the sentence points at them only when they are there. The count is
 * exact, so a small one is called thin and never "a rough guide". `weekly` is
 * the area's weekly series where the page has it: the listings are shaded by
 * the same bookings, so the answer carries that series' date.
 */
export function mapReply(name: string, count: number | null, drawn: boolean, weekly?: WeeklyPoint[] | null): Reply {
  if (count == null) return { text: `Here is ${name}.`, firm: null, asOf: null };
  return {
    text: drawn ? `Here is ${name}, with ${lets(count)} inside the line.` : `Here is the outline of ${name}. It holds ${lets(count)}.`,
    firm: firmness(count, { figure: false }),
    asOf: weekly && count > 0 ? asOf(weekly) : null,
  };
}

/**
 * "What do guests say in their reviews here?" The connector has no tool for
 * reviews, and it says so instead of guessing: no figure, so no firmness line
 * and no date.
 */
export const REVIEWS_REPLY: Reply = {
  text: "I can\u2019t answer that. The connector reads listings, prices and bookings, not reviews, so it won\u2019t guess.",
  firm: null,
  asOf: null,
};

// ── GREEK ────────────────────────────────────────────────────────────────
// The connector understands place names in Greek and English; this is its
// summary answer again, asked and answered in Greek from the same figures.
// GREEK: the owner is to proofread every string from here to the end of the file
// (and the two place phrases, `inGreek`, in compare.ts).

const MONTHS_EL = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαΐ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];
const intEl = (v: number) => Math.round(v).toLocaleString("el-GR");
const euroEl = (v: number) => `€${intEl(v)}`;
const staysEl = (n: number) => `${intEl(n)} ${n === 1 ? "κατάλυμα" : "καταλύματα"}`;

/** "Πώς πάνε οι βραχυχρόνιες μισθώσεις στον Πρωταρά;" */
export function greekQuestion(place: DrawnArea, changed: boolean): string {
  return `Πώς πάνε οι βραχυχρόνιες μισθώσεις ${changed || !place.inGreek ? (place.frame ? "στην περιοχή μου" : `στην περιοχή μου κοντά ${place.inGreek}`) : place.inGreek};`;
}

/** The summary answer in Greek: the same figures as `summaryReply`, the same three parts. */
export function greekReply(count: number, s: Pick<SelectionStats, "effOccTodate" | "medianRate" | "weekly">): Reply {
  if (count === 0) {
    return {
      text: "Δεν υπάρχουν βραχυχρόνιες μισθώσεις μέσα σε αυτή την περιοχή, οπότε δεν έχω στοιχεία να αναφέρω.",
      firm: "Ενδεικτικό: δεν υπάρχουν καταλύματα.",
      asOf: null,
    };
  }
  if (count < MIN_LISTINGS) {
    return {
      text: `Μόνο ${staysEl(count)} ${count === 1 ? "βρίσκεται" : "βρίσκονται"} μέσα σε αυτή την περιοχή, πολύ λίγα για να δώσω νούμερο.`,
      firm: `Ενδεικτικό: μόνο ${staysEl(count)}.`,
      asOf: null,
    };
  }
  const w = lastWeek(s.weekly);
  const occ = s.effOccTodate == null ? null : `${pct(s.effOccTodate)} αυτή τη σεζόν`;
  const rate = s.medianRate == null ? null : `${euroEl(s.medianRate)} τη βραδιά`;
  const across = `σε ${staysEl(count)}`;
  const text =
    occ && rate
      ? `Περίπου ${rate} με πληρότητα ${occ}, ${across}.`
      : rate
        ? `Περίπου ${rate}, ${across}.`
        : occ
          ? `Πληρότητα περίπου ${occ}, ${across}.`
          : `Υπάρχουν ${staysEl(count)} εκεί, χωρίς αρκετές κρατήσεις ακόμη για να δώσω νούμερο.`;
  return {
    text,
    // As in English: with neither figure the answer states none, so there is nothing to call firm.
    firm: occ || rate ? `Αξιόπιστο: βασίζεται σε ${staysEl(count)}.` : null,
    asOf: w ? `Στοιχεία της εβδομάδας ${w.d} ${MONTHS_EL[w.m - 1]} ${w.y}` : null,
  };
}

/** What the connector says in Greek when the listings cannot be reached. */
export const GREEK_UNREACHABLE = "Δεν μπορώ να δω τις καταχωρίσεις αυτή τη στιγμή, οπότε δεν έχω νούμερο να σας δώσω.";
