import { BRAND } from "@/lib/brand";
import AreaMark from "@/components/landing/AreaMark";

/** The foot of the landing page, on ink with the access form above it (styles in app/landing-sections.css). */
export default function Footer() {
  return (
    <footer className="th-landing ps-foot">
      <div className="ps-foot-in">
        <div className="ps-foot-brand">
          <AreaMark size={24} stroke="var(--th-close-ink)" />
          <span>
            {BRAND.namePart1}
            {BRAND.namePart2}
          </span>
        </div>

        <p className="ps-foot-rights">© 2026 {BRAND.name}</p>

        <div className="ps-foot-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}
