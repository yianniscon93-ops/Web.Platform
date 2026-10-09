"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { InvestStats, PolygonCoords, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { areaName } from "./areaLines";
import { ISLAND_AREA, type DrawnArea } from "./compare";

/** What the three endpoints the hero asks returned for the area. Any of them may be missing. */
interface HeroFigures {
  stats: SelectionStats | null;
  rentals: RentalStats | null;
  invest: InvestStats | null;
}

/**
 * The area the visitor has on the hero's map, and what the hero knows about
 * it. The hero publishes it; the product sections below read it, so the whole
 * page is about one area.
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

/** What the sections show before the stage has published anything: the map it opens on, as first drawn, still loading. */
const DEFAULT_HERO_AREA: HeroArea = {
  place: ISLAND_AREA,
  polygon: ISLAND_AREA.polygon,
  changed: false,
  name: areaName(ISLAND_AREA.name, false),
  count: null,
  own: {},
  countsFailed: false,
  dots: null,
  figures: null,
  pending: false,
  status: "loading",
  playgroundHref: "/dashboard",
};

// Two contexts, so the hero, which only publishes, is not re-rendered by what it publishes.
const ValueContext = createContext<HeroArea>(DEFAULT_HERO_AREA);
const PublishContext = createContext<Dispatch<SetStateAction<HeroArea>> | null>(null);

const nowhere: Dispatch<SetStateAction<HeroArea>> = () => {};

export function HeroAreaProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<HeroArea>(DEFAULT_HERO_AREA);
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
