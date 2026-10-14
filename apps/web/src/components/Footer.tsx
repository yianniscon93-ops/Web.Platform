import { BRAND } from "@/lib/brand";
import Wordmark from "@/components/landing/Wordmark";

/**
 * The foot of the landing page, on ink under the close (styles in app/landing-sections.css): the name, where the
 * figures come from and the map credit, the team's address, the year. Privacy and Terms come back here when their
 * pages exist, and the company's registered name and city when the owner gives them; until then the foot claims
 * nothing that is not there.
 */
export default function Footer() {
  return (
    <footer className="th-landing ps-foot">
      <div className="ps-foot-in">
        <div className="ps-foot-brand">
          <Wordmark corners="var(--olive-light)" />
        </div>
        <p className="ps-foot-src">
          Listings from Airbnb and Bazaraki, read daily. Map data ©&nbsp;
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a>
          , ©&nbsp;
          <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">
            OpenMapTiles
          </a>
          .
        </p>
        <div className="ps-foot-links">
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          <span className="ps-foot-rights">© 2026 {BRAND.name}</span>
        </div>
      </div>
    </footer>
  );
}
