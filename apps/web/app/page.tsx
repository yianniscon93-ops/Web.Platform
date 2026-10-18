import { preload } from "react-dom";
import "./landing-sections.css";
import "./landing-hero.css";
import "./landing-how.css";
import "./landing-motion.css";
import Nav from "@/components/Nav";
import LandingHero from "@/components/landing/LandingHero";
import HowSection from "@/components/landing/HowSection";
import IslandSource from "@/components/landing/IslandSource";
import ProductsOverview from "@/components/landing/ProductsOverview";
import ProductSections from "@/components/landing/ProductSections";
import QuestionsSection from "@/components/landing/QuestionsSection";
import Reveal from "@/components/landing/Reveal";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// The first screen quotes what the island holds today: the page is rebuilt at most once an hour.
export const revalidate = 3600;

export default function Home() {
  // The headline is set in this face, so fetch it with the document rather than after the stylesheet.
  preload("/fonts/google-sans-flex/google-sans-flex-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    // The product chapters are about one place, which they read from here: the whole island (IslandSource).
    <HeroAreaProvider>
      {/* Blue Night (owner, 2026-10-17; DESIGN.md): `bn` sets every landing role for the white body, and `bn-night`
          turns a part of it over to night (the hero, the night bands, the navy cards, the close). */}
      <div className="bn overflow-x-clip">
        <Nav />
        <LandingHero />
        {/* Hands the product chapters the island's figures. */}
        <IslandSource />
        {/* The order is the owner's (plan 3, 2026-10-17): what the numbers rest on right after the first screen, on an
            ice band; its last line names the products, whose tiles follow on white; then one chapter per product on
            bands of night and ice; the questions on white; the close back in night. No two white sections touch. */}
        <HowSection />
        <ProductsOverview />
        {/* #playground, #reports and #connector: where the bar and the tiles land. */}
        <ProductSections />
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
