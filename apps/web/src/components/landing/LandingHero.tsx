import PlaceSearch from "./PlaceSearch";
import TownTour from "./TownTour";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { MIN_LISTINGS } from "@/lib/landing/areaLines";
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
 * The landing's first screen: the headline, one sentence, and a box that asks the visitor for their own place
 * (PlaceSearch, which hands it to the stage below). Beside them a picture that moves by itself: a tour of six
 * towns, each a drawn map made from open map data (scripts/build-hero-town.mjs), on which the listings appear
 * and three areas a few streets wide are drawn one after another, each with how full its short-lets are and
 * what a night in them costs pinned beside it (TownTour). The figures are asked for here, on the server.
 */
export default async function LandingHero() {
  const towns = await Promise.all(HERO_TOWNS.map((town) => Promise.all(DRAWN[town.key].areas.map((area) => measured(town, area)))));
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
          {/* The name is in the headline: "Plot" (the verb, what the visitor does on the map) and "sights" wear the
              mark's colour, so Plotsights is read out of the sentence in order. It is read out as plain words. */}
          <h1 className="th-h1 m-0" aria-label="Plot an area on the map. Get the insights.">
            <span className="lh-name">Plot</span> an area on the map. Get the in<span className="lh-name">sights</span>.
          </h1>
          {/* Two beats: the daily update and the three markets as a fact (owner, 2026-10-10: "show that our database is
              updated daily"), then the gesture (which is what the picture beside it is doing) and the promise in bold. */}
          <p className="th-lede m-0">
            <b>Updated every day:</b> every short-&#8288;let, long-&#8288;let and sale in Cyprus. Draw a line round any streets and see{" "}
            <b>what they earn, rent for and sell for.</b>
          </p>
          <PlaceSearch />
        </div>
      </div>
      <TownTour stops={stops} demo={towns.some((areas) => areas.some((m) => m.demo))} />
    </section>
  );
}
