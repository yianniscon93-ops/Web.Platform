"use client";

import { useHeroArea } from "@/lib/landing/areaContext";
import ConnectorChat, { type QuestionId } from "@/components/landing/ConnectorSection";
import TippingPoint from "@/components/landing/PlaygroundSection";
import ReportsSheet from "@/components/landing/ReportsSection";
import { carryRequest } from "@/components/landing/SectionParts";

/**
 * The Solutions page's working things: the landing's own, imported, not copied, each reading the island's figures the
 * page handed to HeroAreaProvider on the server (app/solutions/page.tsx), so they are in the HTML from the start and
 * read without script. Demo data says "Sample data" inside each, as on the landing.
 */

/** The Playground's "Airbnb or a tenant?", on its navy card, with what it rests on under it. */
export function PlaygroundWorking() {
  return <TippingPoint area={useHeroArea()} />;
}

/** A report to leaf through, on paper. */
export function ReportsWorking() {
  const area = useHeroArea();
  return (
    <>
      <ReportsSheet area={area} />
      <p className="so-cap">A sample page, from the latest figures for {area.name}.</p>
    </>
  );
}

// The real connector has no bedrooms filter (Data.Insights `area_summary`), so that chip is left out here.
const NOT_HERE: readonly QuestionId[] = ["bedrooms"];

/** The Connector's conversation, laid out as Claude is. */
export function ConnectorWorking() {
  return <ConnectorChat area={useHeroArea()} without={NOT_HERE} />;
}

/**
 * A request for the team: it goes to the close ("Ask the team", #access), which names it in its heading and makes it the
 * email's subject (CTASection), as the landing's product actions do.
 */
export function AskTeam({
  request,
  className,
  children,
}: {
  request: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href="#access" className={className} onClick={() => carryRequest(request)}>
      {children}
    </a>
  );
}
