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
 * Under the search: what the database holds, from getIsland, with each figure said for what it is. "Backed by
 * 14,512 short-lets, 10,140 long-lets and 29,530 for-sale ads." (plan 3, owner 2026-10-17: the headline's "backed
 * by data", literally true here). The for-sale count is every ad seen (expiry is not tracked yet), so it says ads,
 * not homes on the market. The one time the database gives is the short-let sync (sync_meta.last_run_at), so it is
 * attached to the short-lets alone and says no cadence: "Short-let calendars last read 14 October at 06:10." (the
 * cadence is in "How it works" and the questions; nothing is read daily, so no line says so). On demo data there is
 * no true time, and the line says it is sample data instead. Left out when the counts cannot be had.
 */
function Fresh({ island }: { island: Island }) {
  const { stats, rentals, invest, summary } = island;
  if (!stats || !rentals || !invest) return null;
  const demo = stats.source === "demo";
  const when = demo ? null : readOn(summary?.lastRunAt);
  return (
    <p className="lh-fresh m-0">
      {demo ? "Sample data: " : "Backed by "}
      <b>{int(stats.listingCount)}</b> short-&#8288;lets, <b>{int(rentals.supply)}</b> long-&#8288;lets and{" "}
      <b>{int(invest.supply)}</b> for-sale ads.
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
    // The hero is a card of night inset in the page (Blue Night, owner 2026-10-17): its roles are the night's.
    <section className="th-landing lh bn-night">
      {/* The night itself: a soft blue glow rising behind the town, and a faint grain. Nothing in it moves but the glow's
          slow breath, and that not with reduced motion. */}
      <div className="lh-sky" aria-hidden="true">
        <span className="bn-glow" />
      </div>
      <div className="lh-in">
        <div className="lh-copy">
          {/* The reference's small label over the headline (owner, 2026-10-17: eyebrows on). The category, in the
              owner's word ("intelligent"): what Plotsights is, before what it lets you do. */}
          <p className="bn-eb lh-eb m-0">Cyprus property intelligence</p>
          {/* The owner's headline (plan 3, option A, 2026-10-17), three thin lines. The name is read out of it: "Plot"
              and "sights" (of "Insights") are in the night's ink and every other word in mist, so Plotsights is spelt
              in order as the opening has just struck it ("make sure the plot and sights strike differently";
              direction G's device, set in Blue Night's two tones instead of a colour). Each line is set as a line, and
              read out as one plain sentence. */}
          <h1 className="th-h1 m-0" aria-label="Plot your next move in Cyprus property. Insights backed by data.">
            <span className="lh-line">
              <span className="lh-name">Plot</span> your next move
            </span>{" "}
            <span className="lh-line">in Cyprus property.</span>{" "}
            <span className="lh-line">
              In<span className="lh-name">sights</span> backed by data.
            </span>
          </h1>
          {/* Two sentences with two jobs, set as two tiers: what is tracked and modelled (all four kinds of listing,
              the owner's "str ltr home sales and PLOTS"), in ink; then what it is for, in mist. The modelled part is
              what a street earns, rents for and sells for, which plots are not claimed to have. */}
          <p className="th-lede m-0">
            <span className="lh-what">
              We track short-&#8288;lets, long-&#8288;lets, homes and plots for&nbsp;sale across Cyprus, and model what any
              street earns, rents for and sells for.
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
