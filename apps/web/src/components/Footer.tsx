import { BRAND } from "@/lib/brand";
import Wordmark from "@/components/landing/Wordmark";

/**
 * The foot of the landing page, in the same night card as the close (styles in app/landing-sections.css): the name at
 * the card's full width, the way the reference ends, then where the figures come from and the map credit, the team's
 * address and the year. Privacy and Terms come back here when their pages exist, and the company's registered name
 * and city when the owner gives them; until then the foot claims nothing that is not there.
 */
export default function Footer() {
  return (
    // As the foot comes into view the name rises and its plot is drawn again, corner by corner (landing-motion.css).
    <footer className="th-landing ps-foot" data-moment="">
      <div className="ps-foot-in">
        <p className="ps-foot-name m-0">
          <Wordmark />
        </p>
        <div className="ps-foot-row">
          <p className="ps-foot-src m-0">
            Short-&#8288;lets from Airbnb; long-&#8288;lets, homes and plots for sale from Bazaraki. Map data ©&nbsp;
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap contributors
            </a>
            , ©&nbsp;
            <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">
              OpenMapTiles
            </a>
            .
          </p>
          <p className="ps-foot-links m-0">
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            <span className="ps-foot-rights">© 2026 {BRAND.name}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
