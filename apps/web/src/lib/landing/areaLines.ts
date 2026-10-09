import type { SelectionStats, WeeklyPoint } from "@/lib/dashboard/types";

// Every sentence the hero says about the drawn area. Each is built only from
// figures the page has: the count is the listings the map shows inside the
// line; occupancy, nightly rate and the weekly series are what /stats
// returned. A missing figure shortens a sentence, it is never filled in.

/** Below this an area's medians are too thin to quote. */
export const MIN_LISTINGS = 5;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const NUMBERS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

// How the page writes a figure. The product sections use these too (sectionLines.ts), so a figure is worded one way.
export const euro = (v: number) => `€${Math.round(v).toLocaleString("en-GB")}`;
export const int = (v: number) => Math.round(v).toLocaleString("en-GB");
export const pct = (v: number) => `${Math.round(v)}%`;
export const lets = (n: number) => `${int(n)} short\u2011let${n === 1 ? "" : "s"}`;
/** A count in words where a sentence reads better for it ("six months"); figures past twelve. */
export const inWords = (n: number) => NUMBERS[n] ?? int(n);

/** What the count under the map says before there is a count. */
export const COUNTING = "Counting short\u2011lets inside";

/** What a line or a figure block says while the first answer for the area is on its way. */
export const READING = "Reading the listings inside this line";

/** What stands in for a figure when the API cannot be reached. */
export const UNREACHABLE = "The listings can’t be reached just now.";

/**
 * The period the area's occupancy covers. The figure is /stats `effOccTodate`:
 * nights really booked from the season's fixed start (1 April) to yesterday
 * (docs/DATA_ENGINEERING.md, "Occupancy model"), which the Playground labels
 * "season to date". Every sentence that states how full an area is uses that
 * figure and says so with these words; any other occupancy on the page (a
 * week, a month) names its own period.
 */
export const SEASON = "this season";

/** "41 short-lets inside": the count under the map. */
export function countLine(n: number): string {
  return `${lets(n)} inside`;
}

/** "41 inside": the count beside a corner while it moves. */
export function countChip(n: number): string {
  return `${int(n)} inside`;
}

/** The area's name: its place until the visitor reshapes it. */
export function areaName(place: string, changed: boolean): string {
  return changed ? `your area near ${place}` : place;
}

type Rates = Pick<SelectionStats, "effOccTodate" | "medianRate">;

/** How full and how dear, as short phrases; none for an area too thin to quote. */
export function rateFacts(count: number, s: Rates | null): string[] {
  if (!s || count < MIN_LISTINGS) return [];
  const out: string[] = [];
  if (s.effOccTodate != null) out.push(`${pct(s.effOccTodate)} occupied ${SEASON}`);
  if (s.medianRate != null) out.push(`${euro(s.medianRate)} a night`);
  return out;
}

/** The Playground's line: the count and how full the listings are. */
export function playgroundLine(count: number, s: Rates | null): string {
  const occ = rateFacts(count, s).find((f) => f.includes("occupied"));
  return occ ? `${countLine(count)}, ${occ}` : countLine(count);
}

/** One sentence on the area from the count, occupancy and rate. */
export function finding(count: number, s: Rates | null): string {
  if (count === 0) return "No short\u2011lets sit inside this line. Draw it over more streets.";
  if (count < MIN_LISTINGS) return `Only ${lets(count)} inside this line, too few to give a figure. Draw it wider.`;
  const occ = s?.effOccTodate == null ? null : pct(s.effOccTodate);
  const rate = s?.medianRate == null ? null : euro(s.medianRate);
  if (occ && rate) return `Short\u2011lets inside this line fill ${occ} of nights ${SEASON}, at a median ${rate} a night.`;
  if (occ) return `Short\u2011lets inside this line fill ${occ} of nights ${SEASON}.`;
  if (rate) return `Short\u2011lets inside this line ask a median ${rate} a night.`;
  return `${lets(count)} sit inside this line.`;
}

/** A week of the series, for a sentence or an axis: its day, month and year, and when it began. */
export function weekOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, t: Date.UTC(y, m - 1, d), label: `${d} ${MONTHS[m - 1]}`, month: MONTHS[m - 1] };
}

/** What the weekly series shows of occupancy: the weeks, and the fullest and quietest of them. */
export function seriesFacts(weekly: WeeklyPoint[]) {
  const weeks = weekly
    .filter((w): w is WeeklyPoint & { effOcc: number } => w.effOcc != null)
    .map((w) => ({ ...weekOf(w.weekStart), v: w.effOcc }));
  if (weeks.length < 3) return null;
  return {
    weeks,
    // The first of them, on a tie.
    fullest: weeks.reduce((a, b) => (b.v > a.v ? b : a)),
    quietest: weeks.reduce((a, b) => (b.v < a.v ? b : a)),
    range: `${weeks[0].label} to ${weeks[weeks.length - 1].label} ${weeks[weeks.length - 1].y}`,
  };
}

/** A calendar month the weekly series covers in full. */
interface MonthFigures {
  y: number;
  m: number;
  /** "Aug" */
  label: string;
  /** "August" */
  name: string;
  /** The mean of its weeks' occupancy, 0 to 100. */
  occ: number;
  /**
   * What one listing is estimated to take in the month: nightly rate ×
   * occupancy, averaged over the month's weeks, × the days in the month.
   * Null with fewer than four weeks that have both figures.
   */
  revenue: number | null;
}

// A month has four or five Mondays. With fewer than four weeks of it carrying a figure, it is not a month's figure.
const FULL_MONTH_WEEKS = 4;

/**
 * The full calendar months of the weekly series, oldest first. A week counts
 * towards a month's figure only when it carries that figure: a month is full
 * for occupancy with four or more weeks that have an occupancy, and for
 * revenue with four or more that have an occupancy and a nightly rate. A
 * month is listed when it is full for occupancy; its revenue may still be
 * null.
 */
export function monthsOf(weekly: WeeklyPoint[]): MonthFigures[] {
  const by = new Map<string, { y: number; m: number; occ: number; occN: number; take: number; takeN: number }>();
  for (const w of weekly) {
    if (w.effOcc == null) continue;
    const { y, m } = weekOf(w.weekStart);
    const k = `${y}-${m}`;
    const acc = by.get(k) ?? { y, m, occ: 0, occN: 0, take: 0, takeN: 0 };
    acc.occ += w.effOcc;
    acc.occN += 1;
    if (w.medianAdr != null) {
      acc.take += w.medianAdr * (w.effOcc / 100);
      acc.takeN += 1;
    }
    by.set(k, acc);
  }
  return [...by.values()]
    .filter((a) => a.occN >= FULL_MONTH_WEEKS)
    .sort((a, b) => a.y - b.y || a.m - b.m)
    .map((a) => ({
      y: a.y,
      m: a.m,
      label: MONTHS[a.m - 1],
      name: MONTH_NAMES[a.m - 1],
      occ: a.occ / a.occN,
      revenue: a.takeN >= FULL_MONTH_WEEKS ? (a.take / a.takeN) * new Date(Date.UTC(a.y, a.m, 0)).getUTCDate() : null,
    }));
}

/** An estimate is quoted to the nearest €10: it is not known to the euro. */
export const estimate = (v: number) => euro(Math.round(v / 10) * 10);

/**
 * Estimated revenue per listing by month, for the months that have one; null
 * with fewer than two (a series without nightly rates has none).
 */
export function revenueByMonth(weekly: WeeklyPoint[]) {
  const months = monthsOf(weekly).filter((x): x is MonthFigures & { revenue: number } => x.revenue != null);
  if (months.length < 2) return null;
  const years = new Set(months.map((x) => x.y)).size > 1;
  const first = months[0];
  const last = months[months.length - 1];
  return {
    months: months.map((x, i) => ({
      // A run into the next year carries the year on its first month and on each January.
      label: years && (i === 0 || x.m === 1) ? `${x.label} \u2019${String(x.y).slice(2)}` : x.label,
      name: `${x.name} ${x.y}`,
      v: x.revenue,
    })),
    // The first of them, on a tie.
    highest: months.reduce((a, b) => (b.revenue > a.revenue ? b : a)),
    lowest: months.reduce((a, b) => (b.revenue < a.revenue ? b : a)),
    range: `${first.label}${first.y === last.y ? "" : ` ${first.y}`} to ${last.label} ${last.y}`,
  };
}

/** The Reports line: one fact from the weekly series that the Playground's line does not carry. */
export function reportsLine(count: number, s: (Rates & Pick<SelectionStats, "weekly">) | null): string {
  const facts = s && count >= MIN_LISTINGS ? seriesFacts(s.weekly) : null;
  if (!facts) return finding(count, s);
  return `Fullest in the week of ${facts.fullest.label}, at ${pct(facts.fullest.v)}.`;
}

/**
 * The sample page's reading of its chart, in two sentences: the highest and
 * the lowest month of estimated revenue. It states what the figures show and
 * never why. Where the weekly figures carry no nightly rate the chart is
 * occupancy by week and so is the reading; without a series it is the
 * one-sentence finding.
 */
export function reading(count: number, s: (Rates & Pick<SelectionStats, "weekly">) | null): string {
  if (!s || count < MIN_LISTINGS) return finding(count, s);
  const revenue = revenueByMonth(s.weekly);
  if (revenue) {
    const { months, highest, lowest } = revenue;
    return (
      `${highest.name} was the highest of the ${inWords(months.length)} full months shown, at about ${estimate(highest.revenue)} a listing. ` +
      `${lowest.name} was the lowest, at about ${estimate(lowest.revenue)}.`
    );
  }
  const facts = seriesFacts(s.weekly);
  if (!facts) return finding(count, s);
  const { fullest, quietest } = facts;
  return (
    `The fullest week inside this line began ${fullest.label}, at ${pct(fullest.v)}. ` +
    `The quietest began ${quietest.label}, at ${pct(quietest.v)}.`
  );
}

/** The question a visitor would put to the connector, in their own voice. */
export function question(place: string, changed: boolean): string {
  return `How are short\u2011lets doing in ${changed ? `my area near ${place}` : place}?`;
}

/** The connector's answer to it, from the same figures. */
export function answer(count: number, s: Rates | null): string {
  const across = `across ${int(count)} listing${count === 1 ? "" : "s"}`;
  if (count < MIN_LISTINGS) {
    return count === 0
      ? "There are no short\u2011lets inside that area, so there is nothing to quote."
      : `Only ${int(count)} short\u2011let${count === 1 ? " sits" : "s sit"} inside that area, too few to quote a figure.`;
  }
  const occ = s?.effOccTodate == null ? null : `${pct(s.effOccTodate)} occupancy ${SEASON}`;
  const rate = s?.medianRate == null ? null : `${euro(s.medianRate)} a night`;
  if (occ && rate) return `About ${rate} at ${occ}, ${across}.`;
  if (rate) return `About ${rate}, ${across}.`;
  if (occ) return `About ${occ}, ${across}.`;
  return `There are ${int(count)} listings there, without enough bookings to quote a figure yet.`;
}
