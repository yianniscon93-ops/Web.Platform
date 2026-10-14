import { cache } from "react";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import type { DashboardSummary, InvestStats, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { getInvest, getMarket, getRentals, getStats, getSummary } from "@/lib/server/marketData";

/**
 * What the landing page quotes about the whole island, read once per render on the server: the short-lets
 * (/stats), the long-lets (/rentals), the homes for sale (/invest, with the medians the Playground's
 * "Airbnb it or rent it out?" rests on), the median listing's occupancy this season (the Market tab's snapshot,
 * the figure that verdict compares its tipping point with) and when the data was last synced. Any part that
 * cannot be had is null. With no DATABASE_URL every part is the deterministic demo answer.
 */
export interface Island {
  stats: SelectionStats | null;
  rentals: RentalStats | null;
  invest: InvestStats | null;
  /** The median short-let's share of nights booked this season (Market snapshot), or null. */
  occMedian: number | null;
  summary: DashboardSummary | null;
}

/** The Monday of today's week, as the Market query wants a week range; its snapshot does not depend on it. */
const thisWeek = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export const getIsland = cache(async (): Promise<Island> => {
  const week = thisWeek();
  const [stats, rentals, invest, market, summary] = await Promise.all([
    getStats(DEFAULT_FILTERS, null).catch(() => null),
    getRentals(null).catch(() => null),
    getInvest(null).catch(() => null),
    getMarket({ selection: { kind: "all" }, filters: {}, weekStart: week, weekEnd: week }).catch(() => null),
    getSummary().catch(() => null),
  ]);
  return {
    stats,
    rentals,
    // The cards do not use the two lists of single homes, so they are not sent to the browser.
    invest: invest && { ...invest, screener: [], movers: [] },
    occMedian: market?.snapshot?.occQuartiles?.[1] ?? null,
    summary,
  };
});

/** "14 October at 06:10", in Cyprus time: when the data was last read. */
export const readOn = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Nicosia",
      }).replace(", ", " at ")
    : null;
