import PlaceSearch from "./PlaceSearch";
import TownTour from "./TownTour";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import type { PolygonCoords } from "@/lib/dashboard/types";
import { MIN_LISTINGS } from "@/lib/landing/areaLines";
import { HERO_TOWNS, type HeroTown } from "@/lib/landing/heroTowns";
import type { TourArea, TourMarket, TourStop, TownPt } from "@/lib/landing/tour";
import { getInvest, getRentals, getStats } from "@/lib/server/marketData";

type Drawn = Pick<TourArea, "name" | "ring" | "at" | "side" | "from">;

/**
 * What the tour draws on each town's map, in that map's view units: three areas a few streets wide, each with
 * the corner its figures are pinned at when the map is whole (`at`, and the `side` of it the card hangs from)
 * and the corner of the area the line to them leaves from. `where` is the place of the town's name. All of it
 * is set by hand against the drawing, on built streets, the cards over open water where they can be.
 */
const DRAWN: Record<HeroTown["key"], { areas: Drawn[]; where: TownPt }> = {
  limassol: {
    areas: [
      { name: "Old town", ring: [[730, 990], [1010, 940], [1070, 1160], [900, 1250], [720, 1190]], at: [1545, 1200], side: "right", from: 2 },
      { name: "Anexartisias Street", ring: [[870, 830], [960, 745], [1060, 795], [1055, 905], [900, 915]], at: [1070, 480], side: "right", from: 1 },
      { name: "Seafront", ring: [[1100, 740], [1350, 680], [1440, 860], [1260, 1010], [1090, 940]], at: [1575, 440], side: "right", from: 1 },
    ],
    where: [880, 400],
  },
  // Inland, so its cards lie on streets. The old town is the part of the walled city this side of the line.
  nicosia: {
    areas: [
      { name: "Old town", ring: [[560, 560], [1040, 550], [1080, 660], [900, 790], [690, 780]], at: [1580, 470], side: "right", from: 1 },
      { name: "Makarios Avenue", ring: [[600, 850], [880, 840], [990, 1050], [820, 1180], [600, 1080]], at: [1580, 840], side: "right", from: 2 },
      { name: "Agioi Omologites", ring: [[630, 1250], [960, 1180], [1020, 1290], [900, 1380], [680, 1380]], at: [1580, 1180], side: "right", from: 2 },
    ],
    where: [1340, 330],
  },
  paphos: {
    areas: [
      { name: "Tombs of the Kings", ring: [[540, 240], [740, 215], [830, 330], [760, 480], [540, 470]], at: [900, 270], side: "left", from: 2 },
      { name: "Kato Paphos", ring: [[560, 800], [900, 770], [990, 930], [820, 1000], [560, 980]], at: [830, 1240], side: "right", from: 4 },
      { name: "Poseidonos Avenue", ring: [[850, 1120], [990, 1000], [1110, 1180], [1080, 1400], [960, 1330]], at: [1580, 800], side: "right", from: 1 },
    ],
    where: [1180, 620],
  },
  ayianapa: {
    areas: [
      { name: "Agias Mavris", ring: [[600, 650], [720, 570], [875, 585], [878, 765], [640, 775]], at: [870, 830], side: "right", from: 4 },
      { name: "Town centre", ring: [[900, 540], [1130, 530], [1230, 690], [1100, 820], [900, 780]], at: [1575, 280], side: "right", from: 1 },
      { name: "Harbour", ring: [[990, 880], [1170, 870], [1250, 1000], [1160, 1120], [1010, 1050]], at: [940, 1180], side: "right", from: 4 },
    ],
    where: [700, 440],
  },
  larnaca: {
    areas: [
      { name: "Finikoudes", ring: [[960, 540], [1240, 520], [1250, 760], [1130, 790], [950, 680]], at: [1570, 230], side: "right", from: 1 },
      { name: "St Lazarus", ring: [[930, 820], [1180, 800], [1220, 980], [1080, 1110], [910, 1000]], at: [880, 900], side: "right", from: 4 },
      { name: "Skala", ring: [[1010, 1150], [1210, 1130], [1230, 1300], [1180, 1460], [1020, 1400]], at: [990, 1230], side: "right", from: 4 },
    ],
    where: [700, 520],
  },
  protaras: {
    areas: [
      { name: "Pernera", ring: [[700, 230], [790, 170], [880, 250], [870, 490], [730, 500]], at: [1580, 270], side: "right", from: 2 },
      { name: "Protaras centre", ring: [[900, 665], [1040, 715], [1120, 810], [1100, 940], [900, 900]], at: [870, 760], side: "right", from: 4 },
      { name: "Fig Tree Bay", ring: [[1170, 700], [1260, 740], [1390, 870], [1280, 960], [1150, 840]], at: [1580, 990], side: "right", from: 3 },
    ],
    where: [600, 600],
  },
};

/** A town map's view units back to [lat, lng], for the question asked of the server. */
const ground = (town: HeroTown, ring: TownPt[]): PolygonCoords =>
  ring.map(([x, y]) => [
    Math.round((town.north - y / town.perLat) * 1e5) / 1e5,
    Math.round((town.west + x / town.perLng) * 1e5) / 1e5,
  ]);

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
  const corners = ground(town, area.ring);
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
          {/* The name is in the headline: "Prop" and "sights" wear the mark's colour. It is read out as plain words. */}
          <h1 className="th-h1 m-0" aria-label="Property data and insights for every street in Cyprus.">
            <span className="lh-name">Prop</span>erty data and in<span className="lh-name">sights</span> for every street in Cyprus.
          </h1>
          <p className="th-lede m-0">
            We are a small data team in Cyprus. Every day we read the island&rsquo;s short&#8209;let, long&#8209;let
            and for&#8209;sale listings and turn them into property insights: what a place earns, rents for and
            sells for.
          </p>
          <PlaceSearch />
        </div>
      </div>
      <TownTour stops={stops} demo={towns.some((areas) => areas.some((m) => m.demo))} />
    </section>
  );
}
