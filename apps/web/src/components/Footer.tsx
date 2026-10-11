import { BRAND } from "@/lib/brand";
import AreaMark from "@/components/landing/AreaMark";

/** The foot of the landing page, on ink under the close (styles in app/landing-sections.css). */
export default function Footer() {
  return (
    <footer className="th-landing ps-foot">
      <div className="ps-foot-in">
        <div className="ps-foot-brand">
          <AreaMark size={24} line="var(--th-close-ink)" dots="var(--th-close-ink)" />
          <span>
            {BRAND.namePart1}
            {BRAND.namePart2}
          </span>
        </div>

        <p className="ps-foot-rights">© 2026 {BRAND.name}</p>

        {/* Privacy and Terms come back here when their pages exist; until then the foot links to nothing that is not there. */}
        <div className="ps-foot-links">
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        </div>
      </div>
    </footer>
  );
}
