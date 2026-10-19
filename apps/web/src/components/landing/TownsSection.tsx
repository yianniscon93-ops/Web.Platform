import { ArrowRight } from "lucide-react";
import { euro, int, pct } from "@/lib/landing/areaLines";
import { HERO_TOWNS } from "@/lib/landing/heroTowns";
import { getCoverage, getTowns, readOn } from "@/lib/landing/island";
import { DRAWN } from "@/lib/landing/townAreas";

/** How full a town's short-lets have been, in the page's four classes (the hero's lights): 1 under 60% to 4 80%+. */
const stepOf = (occ: number) => 1 + [60, 70, 80].filter((e) => occ >= e).length;

/** Where a town's card crops its night map: the middle of the three areas the tour draws there, as shares of the map. */
const focus = (key: keyof typeof DRAWN) => {
  const pts = DRAWN[key].areas.flatMap((a) => a.ring);
  const town = HERO_TOWNS.find((t) => t.key === key)!;
  const x = pts.reduce((n, [px]) => n + px, 0) / pts.length / town.width;
  const y = pts.reduce((n, [, py]) => n + py, 0) / pts.length / town.height;
  return `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
};

/** "13 October" from a YYYY-MM-DD date, or null. */
const dayOf = (d: string | null) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Nicosia" }) : null;

/**
 * "The market now" (2026-10-18, owner): the six towns of the first screen as six market cards on an ice band, after
 * the products' night and before the questions, the proof before the ask (the band turned ice the same day, so two
 * night bands never touch; the cards stay navy, live data on night, and carry the night's roles): in each, the median short-let's nightly rate, the
 * share of nights booked this season as a light-bar in its class's blue (Brighter Is Fuller), how many short-lets the
 * figures rest on, and on the live database the median long-let rent. Each card wears its town's own night map (the
 * tour's picture, cropped on its drawn areas) and opens the Playground on the town. One idea, no tabs, no selector
 * (owner, 2026-10-13: the dense numbers screen with place tabs was "a mess"). Under the cards, when each source was last
 * read and how often it is read (calendars every two days, prices and ads weekly), so the figures carry their date.
 * Every figure is the database's (getTowns, getCoverage); demo data has no true dates or per-town rents, so neither is
 * shown on it, and the band says "Sample data".
 */
export default async function TownsSection() {
  const [towns, coverage] = await Promise.all([getTowns(), getCoverage()]);
  const shown = towns.filter((t) => t.listings > 0);
  if (shown.length < 3) return null;
  const demo = shown.some((t) => t.source === "demo");
  const rents = shown.some((t) => t.rent != null);
  const read = coverage?.source === "live" ? coverage.read : null;
  // The cadences are the data repos' crontabs (Data.STR: availability every second day, prices weekly; Data.Property:
  // Bazaraki weekly). Change them here, in "How it works" and in the questions if those change.
  const sources = [
    { name: "Short-⁠let calendars", every: "every 2 days", last: read ? readOn(read.calendars) : null },
    { name: "Nightly prices", every: "weekly", last: read ? dayOf(read.prices) : null },
    { name: "Rent ads", every: "weekly", last: read ? dayOf(read.rents) : null },
    { name: "Sale ads", every: "weekly", last: read ? dayOf(read.sales) : null },
  ];
  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

  return (
    <section id="towns" className="th-landing bn-band bn-band-ice tw" aria-labelledby="tw-h">
      <div className="tw-in">
        <div className="tw-head">
          <div>
            <p className="bn-eb" data-rv="eb">
              The market now
            </p>
            <h2 id="tw-h" className="tw-h" data-rv="">
              Six towns at a glance.{" "}
              <span className="ps-pay" data-rv="pay" style={at(2)}>
                Every figure from our latest read.
              </span>
            </h2>
          </div>
          <p className="tw-say" data-rv="" style={at(1)}>
            What a night costs and how full the short-&#8288;lets in and around each town have been this season
            {rents ? ", and what a long-⁠let rents for" : ""}. Pick a town to open it in the Playground.
          </p>
        </div>

        <ul className="tw-grid" data-moment="">
          {shown.map((t, i) => {
            const town = HERO_TOWNS.find((h) => h.key === t.key)!;
            const step = t.occupancy != null ? stepOf(t.occupancy) : 0;
            return (
              <li key={t.key} className="tw-card" data-rv="" style={at(i)}>
                <a href={t.areaId ? `/dashboard?area=${encodeURIComponent(t.areaId)}` : "/dashboard"} className="tw-link bn-night">
                  <span className="tw-map" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the tour's own drawn SVG, cropped */}
                    <img src={town.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: focus(t.key) }} />
                  </span>
                  <span className="tw-name">
                    {t.name}
                    <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  {t.rate != null ? (
                    <span className="tw-rate">
                      <b>{euro(t.rate)}</b>
                      <span>a night, the median short-&#8288;let</span>
                    </span>
                  ) : (
                    <span className="tw-rate">
                      <span>Too few short-&#8288;lets to quote a rate</span>
                    </span>
                  )}
                  {t.occupancy != null && (
                    <span className="tw-occ" data-step={step} style={{ "--w": Math.min(1, t.occupancy / 100) } as React.CSSProperties}>
                      <span className="tw-bar" aria-hidden="true">
                        <i />
                      </span>
                      <span>
                        <b>{pct(t.occupancy)}</b> booked this season
                      </span>
                    </span>
                  )}
                  <span className="tw-meta">
                    <span>{int(t.listings)} short-&#8288;lets</span>
                    {t.rent != null && (
                      <span>
                        <b>{euro(t.rent)}</b> a month, median long-&#8288;let
                      </span>
                    )}
                  </span>
                  <span className="sr-only">Open {t.name} in the Playground.</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* When each source was last read, and how often: the date the figures above carry. */}
        <div className="tw-read" data-rv="" style={at(2)}>
          <p className="tw-read-h">Last read</p>
          <dl>
            {sources.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>
                  {s.every}
                  {s.last && (
                    <>
                      , most recently <b>{s.last}</b>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {demo && <span className="ps-tag">Sample data</span>}
        </div>
      </div>
    </section>
  );
}
