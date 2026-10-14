import { preload } from "react-dom";
import "./landing-sections.css";
import "./landing-hero.css";
import "./landing-how.css";
// The page's glass: every surface that lies on something, and every filled button. On for the element with the class `th-glassy` below.
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
      <div className="th-glassy min-h-screen overflow-x-clip" style={{ background: "#0C100A" }}>
        <Nav />
        <LandingHero />
        {/* Nothing stands between the first screen and the products (owner, 2026-10-13). The stage's map (DrawHero,
            still in the tree but no longer mounted) stood here; this hands the cards the island's figures. */}
        <IslandSource />
        {/* #playground, #reports and #connector: where the nav lands. The three
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
