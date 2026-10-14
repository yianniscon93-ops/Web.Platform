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
 * the page (a report on an area, the connector) is named in the heading and over
 * the actions, and becomes the email's subject. Beside the email, the free way
 * in: the Playground. Until 2026-10-14 a drawn area stood on a stem over the
 * actions; it read as a balloon and is gone (critique, 2026-10-14). Its styles
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
          <p className="ps-close-lede">A report, connector access, or a question about a place: tell us what you need.</p>
        </div>

        <div className="ps-close-do">
          {carried && <p className="ps-close-carried">Your request: &ldquo;{carried}&rdquo;</p>}
          <div className="ps-close-actions">
            <a href={mail} className="ps-close-mail">
              Email the team
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </a>
            <a href={playgroundHref} className="th-link ps-close-play">
              Or open the Playground
            </a>
          </div>
          <p className="ps-close-small">
            We are a small data team in Cyprus. We read every listing on the island, short-&#8288;lets, long-&#8288;lets
            and sales, and our models turn them into the figures you have seen. Write to{" "}
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
