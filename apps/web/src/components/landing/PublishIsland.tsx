"use client";

import { useEffect } from "react";
import type { InvestStats, RentalStats, SelectionStats } from "@/lib/dashboard/types";
import { usePublishHeroArea } from "@/lib/landing/areaContext";
import { CYPRUS_AREA } from "@/lib/landing/compare";

/**
 * Hands the product cards the place they are about: the whole island, with the figures the server read for it.
 * It draws nothing. Until 2026-10-13 the stage's map did this for a hand-drawn area (DrawHero).
 */
export default function PublishIsland({
  stats,
  rentals,
  invest,
}: {
  stats: SelectionStats | null;
  rentals: RentalStats | null;
  invest: InvestStats | null;
}) {
  const publish = usePublishHeroArea();
  useEffect(() => {
    publish({
      place: CYPRUS_AREA,
      polygon: CYPRUS_AREA.polygon,
      changed: false,
      name: CYPRUS_AREA.name,
      count: stats?.listingCount ?? null,
      own: {},
      // No map on this page counts the listings, so the API's own counts stand for every place.
      countsFailed: true,
      dots: null,
      figures: stats && { stats, rentals, invest },
      pending: false,
      status: stats ? "ready" : "error",
      playgroundHref: "/dashboard",
    });
  }, [publish, stats, rentals, invest]);
  return null;
}
