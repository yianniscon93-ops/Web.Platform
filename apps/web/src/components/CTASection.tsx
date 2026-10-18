"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
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
 * The page's close, "Ask the team", back in night (Blue Night: it shares one navy card with the footer, app/page.tsx). A request is an email to the team's
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
  // The address, copied for a visitor whose mail is in a browser tab rather than an app: the button says so for a
  // moment, as Vercel's and Linear's copy buttons do. Without a clipboard the button is not offered.
  // "copied", "failed" (the browser refused the clipboard: the address is selected instead, for ⌘C or Ctrl+C), or null.
  const [copied, setCopied] = useState<"copied" | "failed" | null>(null);
  const address = useRef<HTMLAnchorElement>(null);
  const [canCopy, setCanCopy] = useState(false);
  useEffect(() => setCanCopy(typeof navigator !== "undefined" && !!navigator.clipboard), []);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), copied === "failed" ? 5000 : 1800);
    return () => window.clearTimeout(t);
  }, [copied]);
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
          <p className="bn-eb" data-rv="eb">
            Contact
          </p>
          {/* The main action is "Email the team" (owner, 2026-10-17: "the team should stay there"), so the heading leads
              with it; its second tone is the second way in, the Playground. */}
          <h2 data-rv="">
            Ask the team{what && <span className="ps-close-what"> {what}</span>}.{" "}
            <span data-rv="pay" style={{ "--i": 2 } as React.CSSProperties}>
              Or start with your street.
            </span>
          </h2>
          <p className="ps-close-lede" data-rv="" style={{ "--i": 2 } as React.CSSProperties}>
            Tell us what you need: a report, connector access, or a number you can’t&nbsp;find.
          </p>
        </div>

        <div className="ps-close-do" data-rv="" style={{ "--i": 3 } as React.CSSProperties}>
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
            We are a small data team in Cyprus, building property intelligence from the island’s own listings. Write to{" "}
            <a ref={address} href={mail} className="th-link">
              {BRAND.email}
            </a>{" "}
            from any mail app.
          </p>
          {canCopy && (
            <button
              type="button"
              className="ps-close-copy"
              onClick={() =>
                navigator.clipboard.writeText(BRAND.email).then(
                  () => setCopied("copied"),
                  () => {
                    // Refused: select the address on the page, so the visitor's own copy takes it.
                    const el = address.current;
                    const sel = window.getSelection();
                    if (el && sel) {
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                    setCopied("failed");
                  },
                )
              }
            >
              {copied === "copied" ? <Check size={16} strokeWidth={2.2} aria-hidden="true" /> : <Copy size={16} strokeWidth={2.2} aria-hidden="true" />}
              <span aria-live="polite">
                {copied === "copied" ? "Copied" : copied === "failed" ? "The address is selected: press ⌘C or Ctrl+C" : "Copy the address"}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
