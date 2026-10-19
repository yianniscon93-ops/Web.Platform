import { cache } from "react";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import type { AreaInfo, DashboardSummary, InvestStats, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { getAreas, getCoverage as readCoverage, getInvest, getMarket, getRentals, getStats, getSummary, type Coverage } from "@/lib/server/marketData";
import { MIN_LISTINGS } from "./areaLines";
import { pickedArea } from "./compare";
import { HERO_TOWNS, type HeroTown } from "./heroTowns";

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

/** The data's own counts and when each source was last read (getCoverage), once per render. */
export const getCoverage = cache((): Promise<Coverage | null> => readCoverage().catch(() => null));

/** One of the six towns on the first screen, as "The market now" quotes it. */
export interface TownFigures {
  key: HeroTown["key"];
  name: string;
  /** The named place the Playground opens on, or null when the list of places has no such town. */
  areaId: string | null;
  /** Short-lets in and around the town. */
  listings: number;
  /** The median short-let's nightly rate and its share of nights booked this season; null when too few to quote. */
  rate: number | null;
  occupancy: number | null;
  /** The median long-let's monthly rent in the same ground, live data only (demo rents are one island-wide answer). */
  rent: number | null;
  source: "live" | "demo";
}

const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * The six towns of the first screen's tour, each read as the Playground's search reads a picked place: the named
 * place (by its English name or another spelling, the town before a district of the same name), the ground round
 * it that `pickedArea` draws (its own reach, 4 to 28 km), and in that ground the short-lets' count, median nightly
 * rate and occupancy this season (/stats) and the long-lets' median rent (/rentals). A town the list of places does
 * not have is read round the middle of its street map instead and links to the Playground's own search. Demo data
 * answers rents for the whole island, which is no town's answer, so a demo town has no rent.
 */
export const getTowns = cache(async (): Promise<TownFigures[]> => {
  const areas = await getAreas().catch(() => [] as AreaInfo[]);
  return Promise.all(
    HERO_TOWNS.map(async (town): Promise<TownFigures> => {
      const want = plain(town.name);
      const place = areas
        .filter((a) => a.areaType !== "country" && a.lat != null && a.lng != null)
        .filter((a) => plain(a.nameEn) === want || (a.aliases ?? []).some((x) => plain(x) === want))
        .sort((a, b) => Number(a.areaType === "district") - Number(b.areaType === "district") || b.listingCount - a.listingCount)[0];
      const centre = place
        ? { lat: place.lat as number, lng: place.lng as number, radiusKm: place.radiusKm ?? null }
        : { lat: town.north - town.height / 2 / town.perLat, lng: town.west + town.width / 2 / town.perLng, radiusKm: 5 };
      const { polygon } = pickedArea({ areaId: place?.areaId ?? town.key, name: town.name, ...centre, listingCount: place?.listingCount ?? 0 });
      const [s, rentals] = await Promise.all([
        getStats(DEFAULT_FILTERS, polygon).catch(() => null),
        getRentals(polygon, null, DEFAULT_FILTERS, { headline: true }).catch(() => null),
      ]);
      const demo = s?.source === "demo";
      const quoted = !!s && s.listingCount >= (demo ? 1 : MIN_LISTINGS);
      const rent = rentals?.source === "live" && rentals.supply >= MIN_LISTINGS ? (rentals.rentQuartiles?.[1] ?? null) : null;
      return {
        key: town.key,
        name: town.name,
        areaId: place?.areaId ?? null,
        listings: s?.listingCount ?? 0,
        rate: quoted ? s.medianRate : null,
        occupancy: quoted ? s.effOccTodate : null,
        rent,
        source: s?.source ?? "demo",
      };
    }),
  );
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
