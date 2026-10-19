import { preload } from "react-dom";
import "./landing-sections.css";
import "./landing-hero.css";
import "./landing-how.css";
import "./landing-motion.css";
import Nav from "@/components/Nav";
import LandingHero from "@/components/landing/LandingHero";
import HowSection from "@/components/landing/HowSection";
import ProductsSection from "@/components/landing/ProductsSection";
import TownsSection from "@/components/landing/TownsSection";
import QuestionsSection from "@/components/landing/QuestionsSection";
import Reveal from "@/components/landing/Reveal";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import { getIsland } from "@/lib/landing/island";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// The first screen quotes what the island holds today: the page is rebuilt at most once an hour.
export const revalidate = 3600;

export default async function Home() {
  // The headline is set in this face, so fetch it with the document rather than after the stylesheet.
  preload("/fonts/google-sans-flex/google-sans-flex-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  // The products' working things are about the whole island; its figures are read here on the server (getIsland,
  // shared with the first screen, "How it works" and the questions) and handed to them with the page, so they are in
  // the HTML from the start.
  const { stats, rentals, invest, occMedian } = await getIsland();
  return (
    <HeroAreaProvider island={{ stats, rentals, invest, occMedian }}>
      {/* Blue Night (owner, 2026-10-17; DESIGN.md): `bn` sets every landing role for the white body, and `bn-night`
          turns a part of it over to night (the hero, the night bands, the navy cards, the close). */}
      <div className="bn overflow-x-clip">
        <Nav />
        <LandingHero />
        {/* The order is the owner's (plan 3, 2026-10-17; 2026-10-18 for the products and the towns): what the numbers
            rest on right after the first screen, on an ice band; its last line names the four products, which follow
            as one night band where the index is the stage (the open product's working thing beside its row); then
            the six towns with when each source was last read, on ice, the proof before the ask; the questions on
            white; the close back in night. Night and ice alternate, no two bands of one ground touch, and white is
            only the questions. */}
        <HowSection />
        {/* #products, and #playground, #reports, #connector and #custom: where the bar and the How line land. */}
        <ProductsSection />
        <TownsSection />
        <QuestionsSection />
        {/* The page ends back in night: the close and the footer share one night card, the name at full width under
            "Ask the team". */}
        <div className="bn-night bn-close">
          <span className="bn-glow" aria-hidden="true" />
          <CTASection />
          <Footer />
        </div>
        {/* The scroll motion: arrivals, moments, count-ups and the story's step (app/landing-motion.css). */}
        <Reveal />
      </div>
    </HeroAreaProvider>
  );
}
