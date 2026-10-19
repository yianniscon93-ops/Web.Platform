"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { InvestStats, PolygonCoords, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { areaName } from "./areaLines";
import { CYPRUS_AREA, type DrawnArea } from "./compare";

/** What the three endpoints the hero asks returned for the area. Any of them may be missing. */
interface HeroFigures {
  stats: SelectionStats | null;
  rentals: RentalStats | null;
  invest: InvestStats | null;
  /** The median short-let's share of nights booked this season (the Playground's Market snapshot), when known. */
  occMedian?: number | null;
}

/**
 * The place the page is about, and what is known of it. The second screen (PlaceNumbers) publishes it: the whole
 * island at first, then the place the visitor picks. The product sections below read it, so the whole page is
 * about one place. Until 2026-10-13 the stage's map published a hand-drawn area here (DrawHero); the fields a
 * drawn area needed (`changed`, `own`, `dots`) are kept for the cards and are now always at rest.
 */
export interface HeroArea {
  place: DrawnArea;
  /** The area's corners as last released, [lat, lng]. */
  polygon: PolygonCoords;
  /** True once the visitor has moved a corner. */
  changed: boolean;
  /** "Protaras", or "your area near Protaras" once changed. */
  name: string;
  /** Listings inside the line: the figure the map shows. Null until it is known. */
  count: number | null;
  /**
   * The same count for each place's own area as first drawn, whichever place is on the map: what the map
   * shows, or would show, inside it. A place is missing until it has been counted; all are missing when the
   * listings could not be fetched (`countsFailed`), and then only the API's own counts exist.
   */
  own: Partial<Record<DrawnArea["key"], number>>;
  countsFailed: boolean;
  /**
   * Where the map paints the listings inside the line, in the place's street-map
   * view units (areaView.ts), each with its shade of "how full" (0 for none, 1
   * to 4 emptier to fuller), for the small map in the Connector section. Null
   * until the listings are placed. Set on release, never while a corner moves.
   */
  dots: Array<[number, number, number]> | null;
  figures: HeroFigures | null;
  /** The area moved and its figures have not arrived yet; the old ones are still in `figures`. */
  pending: boolean;
  status: "loading" | "ready" | "error";
  playgroundHref: string;
}

/** What the sections show when the page has handed nothing over: the whole island, still loading. */
const DEFAULT_HERO_AREA: HeroArea = {
  place: CYPRUS_AREA,
  polygon: CYPRUS_AREA.polygon,
  changed: false,
  name: areaName(CYPRUS_AREA.name, false),
  count: null,
  own: {},
  countsFailed: false,
  dots: null,
  figures: null,
  pending: false,
  status: "loading",
  playgroundHref: "/dashboard",
};

/** The island's figures as the server read them (getIsland in island.ts). */
export interface IslandFigures {
  stats: SelectionStats | null;
  rentals: RentalStats | null;
  invest: InvestStats | null;
  occMedian: number | null;
}

/** The whole island with the figures the server read for it: the place the product chapters are about. */
function islandArea({ stats, rentals, invest, occMedian }: IslandFigures): HeroArea {
  return {
    place: CYPRUS_AREA,
    polygon: CYPRUS_AREA.polygon,
    changed: false,
    name: CYPRUS_AREA.name,
    count: stats?.listingCount ?? null,
    own: {},
    // No map on this page counts the listings, so the API's own counts stand for every place.
    countsFailed: true,
    dots: null,
    figures: stats && { stats, rentals, invest, occMedian },
    pending: false,
    status: stats ? "ready" : "error",
    playgroundHref: "/dashboard",
  };
}

// Two contexts, so the hero, which only publishes, is not re-rendered by what it publishes.
const ValueContext = createContext<HeroArea>(DEFAULT_HERO_AREA);
const PublishContext = createContext<Dispatch<SetStateAction<HeroArea>> | null>(null);

const nowhere: Dispatch<SetStateAction<HeroArea>> = () => {};

/**
 * Holds the place the sections are about. Given the island's figures from the server (app/page.tsx), the chapters
 * are rendered with their answers already in, so they read without script and nothing shows "Reading the listings
 * here" while the page loads (until 2026-10-18 a client effect handed them over after hydration: IslandSource and
 * PublishIsland).
 */
export function HeroAreaProvider({ island, children }: { island?: IslandFigures; children: ReactNode }) {
  const [value, setValue] = useState<HeroArea>(() => (island ? islandArea(island) : DEFAULT_HERO_AREA));
  return (
    <PublishContext.Provider value={setValue}>
      <ValueContext.Provider value={value}>{children}</ValueContext.Provider>
    </PublishContext.Provider>
  );
}

/** The setter the hero calls with its area. Stable for the provider's life; does nothing outside one. */
export function usePublishHeroArea(): Dispatch<SetStateAction<HeroArea>> {
  return useContext(PublishContext) ?? nowhere;
}

/** The area as last published, or the default when nothing has been. */
export function useHeroArea(): HeroArea {
  return useContext(ValueContext);
}
