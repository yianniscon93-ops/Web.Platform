"use client";

import { useHeroArea } from "@/lib/landing/areaContext";
import ConnectorSection from "./ConnectorSection";
import PlaygroundSection from "./PlaygroundSection";
import ReportsSection from "./ReportsSection";

/**
 * The three products under the hero: one sentence that names the three ways in, then Playground, Reports and
 * Connector, each a section of its own on its own ground. All three are about the whole island, which they read
 * from HeroAreaProvider (IslandSource publishes it).
 *
 * Until 2026-10-14 the three were a stack of cards that pinned under the nav and slid over one another. The owner
 * approved ending that (critique, 2026-10-14: no card may be covered before it has had its full screen): each
 * panel now holds one working thing and needs no pinning, nothing is ever covered, and on a phone the panels
 * simply follow one another. A link to a panel (#playground, #reports, #connector) lands it under the nav by its
 * own scroll margin.
 */
export default function ProductSections() {
  const area = useHeroArea();
  return (
    <div className="th-landing ps-sections">
      <div className="ps-in">
        <p className="ps-tie">
          Three ways to use it: explore it yourself, ask us for a report, or ask Claude. The figures below are for all
          of {area.name}, today.
        </p>
      </div>
      <div className="ps-panels">
        <PlaygroundSection area={area} />
        <ReportsSection area={area} />
        <ConnectorSection area={area} />
      </div>
    </div>
  );
}
