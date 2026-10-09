import { preload } from "react-dom";
import "./landing-sections.css";
import "./landing-hero.css";
import "./landing-how.css";
import Nav from "@/components/Nav";
import DrawHero from "@/components/landing/DrawHero";
import LandingHero from "@/components/landing/LandingHero";
import HowSection from "@/components/landing/HowSection";
import AreaBasemap from "@/components/landing/AreaBasemap";
import ProductSections from "@/components/landing/ProductSections";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import { HERO_AREAS } from "@/lib/landing/compare";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// The first screen quotes what the island holds today: the page is rebuilt at most once an hour.
export const revalidate = 3600;

export default function Home() {
  // The headline is set in this face, so fetch it with the document rather than after the stylesheet.
  preload("/fonts/google-sans/google-sans-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  // The street maps of the two places the head to head compares, rendered here on the server once: the stage
  // counts each place's listings on its own map.
  const basemaps = Object.fromEntries(HERO_AREAS.map((a) => [a.key, <AreaBasemap key={a.key} area={a} />]));
  return (
    // The hero publishes the area the visitor has drawn; the product sections under it read it.
    <HeroAreaProvider>
      <div className="min-h-screen overflow-x-clip" style={{ background: "#0C100A" }}>
        <Nav />
        <LandingHero />
        <DrawHero basemaps={basemaps} />
        {/* #playground, #reports and #connector: where the hero's "find out more" links and the nav land. The three
            are a stack of cards, and the close is handed in as the stack's last sheet, which comes up over them. */}
        <ProductSections
          close={
            <>
              <HowSection />
              <CTASection />
            </>
          }
        />
        <Footer />
      </div>
    </HeroAreaProvider>
  );
}
