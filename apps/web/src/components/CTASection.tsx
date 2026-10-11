"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useHeroArea } from "@/lib/landing/areaContext";
import { QUESTION_EVENT, QUESTION_KEY } from "@/lib/landing/compare";

/**
 * The end of the heading when a request has been carried here, for the two the
 * sections make ("A report on …", "Access to …"): "Ask the team for a report
 * on Protaras." Anything else is shown beside the drawn area only.
 */
function asked(carried: string | null): string | null {
  if (!carried || !/^(A report on |Access to )/.test(carried)) return null;
  return `for ${carried.charAt(0).toLowerCase()}${carried.slice(1)}`;
}

/**
 * The page's close, "Ask the team", on ink. A request is an email to the team's
 * own address, written in the visitor's mail app: nothing is collected on the
 * page, so nothing can claim to have been sent that was not (the form that stood
 * here only simulated a send; critique, 2026-10-11). A request made further up
 * the page (a report on an area, the connector) is named in the heading, shown
 * beside the brand's drawn area, which is then filled in, and becomes the
 * email's subject. Beside the email, the free way in: the Playground. Its styles
 * are in app/landing-sections.css, which the page imports.
 */
export default function CTASection() {
  const [carried, setCarried] = useState<string | null>(null);
  const { playgroundHref } = useHeroArea();

  // A request made in a product section arrives here, to go with the email.
  useEffect(() => {
    try {
      setCarried(sessionStorage.getItem(QUESTION_KEY));
    } catch {}
    const on = (e: Event) => setCarried((e as CustomEvent<string>).detail);
    window.addEventListener(QUESTION_EVENT, on);
    return () => window.removeEventListener(QUESTION_EVENT, on);
  }, []);

  const what = asked(carried);
  const mail = `mailto:${BRAND.email}?subject=${encodeURIComponent(carried ?? `A question for ${BRAND.name}`)}`;

  return (
    <section id="access" className="th-landing ps-close">
      <div className="ps-close-in">
        <div>
          <h2>
            Ask the team{what && <span> {what}</span>}.
          </h2>
          <p className="ps-close-lede">
            Tell us what you need: a report, access to the connector, or a question about a place. Email us and we
            will write back.
          </p>
        </div>

        <div>
          <div className="ps-close-top">
            {/* The brand's drawn area with its square corners, and the line from it to the actions. Filled once a request is carried. */}
            <svg
              className="ps-close-area"
              data-on={carried ? "" : undefined}
              width="112"
              height="132"
              viewBox="0 0 112 132"
              fill="none"
              aria-hidden="true"
            >
              <path className="ps-close-wire" d="M60 100V132" />
              <path className="ps-close-shape" d="M12 26 74 12l26 52-40 36-48-24z" />
              <g className="ps-close-nodes">
                <rect x="6.5" y="20.5" width="11" height="11" />
                <rect x="68.5" y="6.5" width="11" height="11" />
                <rect x="94.5" y="58.5" width="11" height="11" />
                <rect x="54.5" y="94.5" width="11" height="11" />
                <rect x="6.5" y="70.5" width="11" height="11" />
              </g>
            </svg>
            {carried && <p className="ps-close-carried">Your request: &ldquo;{carried}&rdquo;</p>}
          </div>
          <div className="ps-close-actions">
            <a href={mail} className="ps-close-mail">
              Email the team
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </a>
            <a href={playgroundHref} className="th-link ps-close-play">
              Or open the Playground, it&apos;s free
            </a>
          </div>
          <p className="ps-close-small">
            We are a small data team in Cyprus. Write to{" "}
            <a href={mail} className="th-link">
              {BRAND.email}
            </a>{" "}
            from any mail app.
          </p>
        </div>
      </div>
    </section>
  );
}
