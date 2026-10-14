import { preload } from "react-dom";
import "./landing-sections.css";
import "./landing-hero.css";
import "./landing-how.css";
// The page's glass: only what floats over the first screen's map (the nav once scrolled, the search field, the
// cards pinned on the tour). On for the element with the class `th-glassy` below.
import "./landing-glass.css";
import Nav from "@/components/Nav";
import LandingHero from "@/components/landing/LandingHero";
import HowSection from "@/components/landing/HowSection";
import IslandSource from "@/components/landing/IslandSource";
import ProductSections from "@/components/landing/ProductSections";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// The first screen quotes what the island holds today: the page is rebuilt at most once an hour.
export const revalidate = 3600;

export default function Home() {
  // The headline is set in this face, so fetch it with the document rather than after the stylesheet.
  preload("/fonts/google-sans/google-sans-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    // The product sections are about one place, which they read from here: the whole island (IslandSource).
    <HeroAreaProvider>
      {/* Ink behind everything: past the footer, an overscroll shows the close's own colour. */}
      <div className="th-glassy overflow-x-clip" style={{ background: "var(--th-ink)" }}>
        <Nav />
        <LandingHero />
        {/* Nothing stands between the first screen and the products (owner, 2026-10-13). This hands the panels the
            island's figures. */}
        <IslandSource />
        {/* #playground, #reports and #connector: where the nav lands. Three sections of their own, one after another. */}
        <ProductSections />
        <HowSection />
        <CTASection />
        <Footer />
      </div>
    </HeroAreaProvider>
  );
}
