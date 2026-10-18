"use client";

import { useHeroArea } from "@/lib/landing/areaContext";
import ConnectorSection from "./ConnectorSection";
import PlaygroundSection from "./PlaygroundSection";
import ReportsSection from "./ReportsSection";

/**
 * The three products' chapters, after their overview tiles (ProductsOverview), each on a band of its own so the page
 * alternates grounds (plan 3, owner 2026-10-17: "I see a lot of white in the background"): the Playground on night,
 * Reports on ice, the Connector on night. A band is a card inset in the white page like the hero, so each chapter is
 * visibly its own. All three are about the whole island, which they read from HeroAreaProvider (IslandSource
 * publishes it). Nothing pins or covers (owner, 2026-10-14). A link to a chapter (#playground, #reports, #connector)
 * lands it under the bar by its own scroll margin.
 */
export default function ProductSections() {
  const area = useHeroArea();
  return (
    <>
      <div className="th-landing ps-sections bn-band bn-band-night bn-night">
        <PlaygroundSection area={area} />
      </div>
      <div className="th-landing ps-sections bn-band bn-band-ice">
        <ReportsSection area={area} />
      </div>
      <div className="th-landing ps-sections bn-band bn-band-night bn-night">
        <ConnectorSection area={area} />
      </div>
    </>
  );
}
