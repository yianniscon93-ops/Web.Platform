import Opening from "./Opening";
import PlaceSearch from "./PlaceSearch";
import TownTour from "./TownTour";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { MIN_LISTINGS, int } from "@/lib/landing/areaLines";
import { getIsland, readOn, type Island } from "@/lib/landing/island";
import { HERO_TOWNS, type HeroTown } from "@/lib/landing/heroTowns";
import { DRAWN, townGround, type Drawn } from "@/lib/landing/townAreas";
import type { TourArea, TourMarket, TourStop, TownPt } from "@/lib/landing/tour";
import { getInvest, getRentals, getStats } from "@/lib/server/marketData";

/** One of the other two markets inside an area: its count, and its median when there are enough listings to quote one. */
const market = (count: number, median: number | null | undefined): TourMarket => ({
  count,
  median: count >= MIN_LISTINGS && median != null ? median : null,
});

/**
 * One area with what the listings inside it come to, and whether that came from demo data. The short-lets are
 * the area's own figures: an area too thin to quote has none and is drawn without a card; demo data is thin
 * everywhere, so there one listing is enough. The long-lets and the homes for sale inside are asked for with the
 * same corners, by the questions the stage's table asks, so a card and the table agree. Demo data answers those
 * two for the whole island, which is not this area's answer, so it is left out.
 */
async function measured(town: HeroTown, area: Drawn): Promise<{ area: TourArea; demo: boolean }> {
  // The line to the card ends a little way inside it, wherever the card's far edges fall at this size of map.
  const to: TownPt = [area.at[0] + (area.side === "left" ? 40 : -40), area.at[1] + 35];
  const bare = { ...area, to, occupied: null, rate: null, count: 0, rent: null, sale: null };
  const corners = townGround(town, area.ring);
  try {
    const [s, rentals, invest] = await Promise.all([
      getStats(DEFAULT_FILTERS, corners),
      getRentals(corners, null, DEFAULT_FILTERS, { headline: true }).catch(() => null),
      getInvest(corners, null, DEFAULT_FILTERS, { headline: true }).catch(() => null),
    ]);
    const demo = s.source === "demo";
    const quoted = s.listingCount >= (demo ? 1 : MIN_LISTINGS) && s.effOccTodate != null && s.medianRate != null;
    return {
      area: {
        ...bare,
        count: s.listingCount,
        ...(quoted && { occupied: s.effOccTodate, rate: s.medianRate }),
        rent: rentals?.source === "live" ? market(rentals.supply, rentals.rentQuartiles?.[1]) : null,
        sale: invest?.source === "live" ? market(invest.supply, invest.priceQuartiles?.[1]) : null,
      },
      demo,
    };
  } catch {
    return { area: bare, demo: false };
  }
}

/**
 * Under the search: what the database holds, from getIsland, with each figure said for what it is. "Read daily: 3,431
 * short-lets, 1,420 long-lets and 3,184 for-sale ads seen." The for-sale count is every ad seen (expiry is not
 * tracked yet), so it says "seen". The one time the database gives is the short-let sync (sync_meta.last_run_at),
 * so it is attached to the short-lets alone: "Short-let calendars last read 14 October at 06:10." On demo data
 * there is no true time, and the line says it is demo data instead. Left out when the counts cannot be had.
 */
function Fresh({ island }: { island: Island }) {
  const { stats, rentals, invest, summary } = island;
  if (!stats || !rentals || !invest) return null;
  const demo = stats.source === "demo";
  const when = demo ? null : readOn(summary?.lastRunAt);
  return (
    <p className="lh-fresh m-0">
      {demo ? "Demo data: " : "Read daily: "}
      <b>{int(stats.listingCount)}</b> short-&#8288;lets, <b>{int(rentals.supply)}</b> long-&#8288;lets and{" "}
      <b>{int(invest.supply)}</b> for-sale ads seen.
      {when && <> Short-&#8288;let calendars last read {when}.</>}
    </p>
  );
}

/**
 * The landing's first screen: the headline, one sentence, and a box that asks the visitor for their own place
 * (PlaceSearch, which hands it to the figures below). Beside them a picture that moves by itself: a tour of six
 * towns, each a drawn map made from open map data (scripts/build-hero-town.mjs), on which the listings appear
 * and three areas a few streets wide are drawn one after another, each with how full its short-lets are and
 * what a night in them costs pinned beside it (TownTour). The figures are asked for here, on the server.
 */
export default async function LandingHero() {
  const [island, towns] = await Promise.all([
    getIsland(),
    Promise.all(HERO_TOWNS.map((town) => Promise.all(DRAWN[town.key].areas.map((area) => measured(town, area))))),
  ]);
  const stops: TourStop[] = HERO_TOWNS.map((town, i) => ({
    key: town.key,
    town: town.name,
    src: town.src,
    size: town.width,
    west: town.west,
    north: town.north,
    perLng: town.perLng,
    perLat: town.perLat,
    areas: towns[i].map((m) => m.area),
    where: DRAWN[town.key].where,
  }));

  return (
    <section className="th-landing lh">
      <div className="lh-in">
        <div className="lh-copy">
          {/* The name is in the headline: "Plot" and "sights" wear the mark's colour, so Plotsights is read out of the
              sentence in order. It is read out as plain words. The owner chose this wording on 2026-10-13, of four
              put to him after "plot an area and get insights" was found to undersell the work: "Plot" is now what
              the visitor does with a decision. Each of its three lines is set as a line (landing-hero.css sizes
              the type so the longest fits its column). */}
          <h1 className="th-h1 m-0" aria-label="Plot your next move in Cyprus property. Get the insights.">
            <span className="lh-line">
              <span className="lh-name">Plot</span> your next move
            </span>{" "}
            <span className="lh-line">in Cyprus property.</span>{" "}
            <span className="lh-line">
              Get the in<span className="lh-name">sights</span>.
            </span>
          </h1>
          {/* Two sentences with two jobs, set as two tiers and not as one paragraph with words picked out of it: what
              is here (all four kinds of listing, the owner's "str ltr home sales and PLOTS", one view, every day),
              in ink; then what it is for, quieter, a size down. */}
          <p className="th-lede m-0">
            <span className="lh-what">
              Short-&#8288;lets, long-&#8288;lets, homes and plots for sale: the whole market in one view, updated every day.
            </span>{" "}
            <span className="lh-for">Decide where to buy, what to charge and what to advise.</span>
          </p>
          <PlaceSearch />
          <Fresh island={island} />
          {/* On the first page of a visit the name is drawn here before the words come in (lib/landing/opening.ts). */}
          <Opening />
        </div>
      </div>
      <TownTour stops={stops} demo={towns.some((areas) => areas.some((m) => m.demo))} />
    </section>
  );
}
