"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { QUESTION_EVENT, QUESTION_KEY } from "@/lib/landing/compare";

/**
 * The end of the heading when a request has been carried here, for the two the
 * sections make ("A report on …", "Access to …"): "Ask the team for a report
 * on Protaras." Anything else is shown beside the field only.
 */
function asked(carried: string | null): string | null {
  if (!carried || !/^(A report on |Access to )/.test(carried)) return null;
  return `for ${carried.charAt(0).toLowerCase()}${carried.slice(1)}`;
}

/**
 * The page's close, "Ask the team", on ink: an email field under the brand's
 * drawn area, which a line joins to the field. A request made further up the
 * page (a report on an area, the connector) is named in the heading and shown
 * beside the area, which is then filled in. Its styles are in
 * app/landing-sections.css, which the page imports. Nothing is sent anywhere
 * yet: the form only simulates it (docs/LANDING.md, "Open").
 */
export default function CTASection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [carried, setCarried] = useState<string | null>(null);
  // The simulated send, so it can be dropped if the form goes before it lands.
  const sending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(sending.current), []);

  // A request made in a product section arrives here, to go with the email.
  useEffect(() => {
    try {
      setCarried(sessionStorage.getItem(QUESTION_KEY));
    } catch {}
    const on = (e: Event) => setCarried((e as CustomEvent<string>).detail);
    window.addEventListener(QUESTION_EVENT, on);
    return () => window.removeEventListener(QUESTION_EVENT, on);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || done) return;
    setLoading(true);
    clearTimeout(sending.current);
    sending.current = setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 700);
  }

  const what = asked(carried);

  return (
    <section id="access" className="th-landing ps-close">
      <div className="ps-close-in">
        <div>
          <h2>
            Ask the team{what && <span> {what}</span>}.
          </h2>
          <p className="ps-close-lede">
            Tell us what you need: a report, access to the connector, or a question about a place. Leave your email and
            we will write back.
          </p>
        </div>

        <div>
          <div className="ps-close-top">
            {/* The brand's drawn area with its square corners, and the line from it to the field. Filled once a request is carried. */}
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
          <form onSubmit={handleSubmit} className="ps-close-form">
            <input
              type="email"
              required
              placeholder="your@email.com"
              aria-label="Your email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={done}
            />
            <button type="submit" disabled={loading}>
              {done ? (
                <>
                  <span>Sent</span>
                  <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                </>
              ) : loading ? (
                "Sending…"
              ) : (
                <>
                  <span>Send</span>
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
          <p className="ps-close-small" role="status">
            {done ? "Thanks. We will write back." : "We only use your email to reply."}
          </p>
        </div>
      </div>
    </section>
  );
}
