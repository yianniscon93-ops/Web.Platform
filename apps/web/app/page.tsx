import { preload } from "react-dom";
import "./landing-sections.css";
import Nav from "@/components/Nav";
import DrawHero from "@/components/landing/DrawHero";
import AreaBasemap from "@/components/landing/AreaBasemap";
import ProductSections from "@/components/landing/ProductSections";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import { HERO_AREAS } from "@/lib/landing/compare";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  // The headline is set in this face, so fetch it with the document rather than after the stylesheet.
  preload("/fonts/google-sans/google-sans-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  const [areaA, areaB] = HERO_AREAS;
  // One pair of street maps, rendered here on the server: the hero's map, and the small map in the Connector section.
  const basemaps = { A: <AreaBasemap area={areaA} />, B: <AreaBasemap area={areaB} /> };
  return (
    // The hero publishes the area the visitor has drawn; the product sections under it read it.
    <HeroAreaProvider>
      <div className="min-h-screen overflow-x-clip" style={{ background: "#0C100A" }}>
        <Nav />
        <DrawHero basemaps={basemaps} />
        {/* #playground, #reports and #connector: where the hero's "find out more" links and the nav land. The three
            are a stack of cards, and the close is handed in as the stack's last sheet, which comes up over them. */}
        <ProductSections basemaps={basemaps} close={<CTASection />} />
        <Footer />
      </div>
    </HeroAreaProvider>
  );
}
