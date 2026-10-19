import type { Metadata } from "next";
import { preload } from "react-dom";
import { ArrowDown, ArrowRight } from "lucide-react";
import "../landing-sections.css";
import "../landing-hero.css";
import "../landing-motion.css";
import "./solutions.css";
import Nav from "@/components/Nav";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import CustomSheet from "@/components/landing/CustomSection";
import Reveal from "@/components/landing/Reveal";
import { IslandLights } from "@/components/landing/StoryLights";
import SolutionsBar from "@/components/solutions/SolutionsBar";
import { AskTeam, ConnectorWorking, PlaygroundWorking, ReportsWorking } from "@/components/solutions/Working";
import { MODELS, ROLES, SOLUTIONS, type Solution, type SolutionId } from "@/components/solutions/content";
import { BRAND } from "@/lib/brand";
import { int } from "@/lib/landing/areaLines";
import { HeroAreaProvider } from "@/lib/landing/areaContext";
import { getCoverage, getIsland, readOn } from "@/lib/landing/island";

// The figures are the island's, read on the server like the landing's: the page is rebuilt at most once an hour.
export const revalidate = 3600;

const TITLE = "Solutions: Cyprus property data, four ways | Plotsights";
const DESCRIPTION =
  "Explore any street in the Playground, get a report written by our team, ask our data in Claude, or have analyses, datasets and feeds built. One Cyprus property dataset behind all four.";
const SHARE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Plot your next move in Cyprus property. Insights backed by data.",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Plotsights",
    url: "/solutions",
    images: [SHARE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SHARE] },
};

const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
const nameOf = (id: SolutionId) => SOLUTIONS.find((s) => s.id === id)!.name;

/** "13 October" from a YYYY-MM-DD date, or null (as the landing's "Last read"). */
const dayOf = (d: string | null) =>
  d
    ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "Asia/Nicosia",
      })
    : null;

/** A solution's one action, as the landing names it. */
function Action({ id }: { id: SolutionId }) {
  const go = <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />;
  if (id === "playground")
    return (
      <a href="/dashboard" className="th-go">
        Open the Playground
        {go}
      </a>
    );
  if (id === "reports")
    return (
      <AskTeam request="A report on a property or an area" className="ps-solid">
        Ask for a report
        {go}
      </AskTeam>
    );
  if (id === "connector")
    return (
      <AskTeam request="Access to the Claude connector" className="th-go">
        Ask for access
        {go}
      </AskTeam>
    );
  return (
    <a href={`mailto:${BRAND.email}?subject=${encodeURIComponent("Custom solutions")}`} className="ps-solid">
      Email the team
      {go}
    </a>
  );
}

/** A solution's working thing: live data on a navy card, paper on its own ground. */
function Working({ id }: { id: SolutionId }) {
  if (id === "playground") return <PlaygroundWorking />;
  if (id === "reports") return <ReportsWorking />;
  if (id === "connector") return <ConnectorWorking />;
  return <CustomSheet />;
}

/**
 * One solution, one band: the name and its claim, what it is, who it is for and its action beside its working thing;
 * under them what is inside and the questions it answers. Night for the two with live data on a navy card (the
 * Playground, the Connector), ice for the two that are paper (a report, a request), so the grounds alternate.
 */
function SolutionBand({ s, night }: { s: Solution; night: boolean }) {
  const h = `${s.id}-h`;
  return (
    <section
      id={s.id}
      className={`th-landing bn-band ${night ? "bn-band-night bn-night" : "bn-band-ice"} so-band so-sol`}
      aria-labelledby={h}
    >
      <div className="so-in">
        {/* The name and its claim across the band; then two columns from 1024px, each flowing on its own: the words,
            then what is inside; the working thing, then the questions it answers. Below 1024px one column in reading
            order: words, working thing, inside, questions. */}
        <div className="so-head">
          <div>
            <p className="bn-eb" data-rv="eb">
              {s.eyebrow}
            </p>
            <h2 id={h} className="so-h" data-rv="">
              {s.name}.{" "}
              <span className="ps-pay" data-rv="pay" style={at(2)}>
                {s.claim}
              </span>
            </h2>
          </div>
        </div>
        <div className="so-sol-grid">
          <div className="so-col so-col-a">
            <div className="so-words">
              <div className="so-lede" data-rv="" style={at(1)}>
                {s.lede.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <div className="so-act" data-rv="" style={at(2)}>
                <Action id={s.id} />
              </div>
              <p className="so-who" data-rv="" style={at(3)}>
                {s.who}
              </p>
            </div>
            <div className="so-inside so-spec" data-rv="" style={at(0)}>
              <h3 className="so-spec-h">{s.insideTitle}</h3>
              <ul>
                {s.inside.map((f) => (
                  <li key={f.name}>
                    <b>{f.name}:</b> {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="so-col so-col-b">
            <div className={`so-obj so-obj-${s.id}`} data-moment="" data-rv="frame" style={at(1)}>
              <Working id={s.id} />
            </div>
            <div className="so-asks so-spec" data-rv="" style={at(1)}>
              <h3 className="so-spec-h">{s.asksTitle}</h3>
              {s.id === "custom" ? (
                <ul className="so-plain">
                  {s.asks.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : (
                <ul>
                  {s.asks.map((q) => (
                    <li key={q}>
                      <q>{q}</q>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Solutions (owner, 2026-10-19: "something like explore more about available solutions", a page of its own, linked
 * from the bar and from the landing's products). Everything Plotsights offers in depth: a night card that names the four
 * by what you do with each; the page's own bar of the four, which follows the reader; the three audiences and what fits
 * each; one band per solution with its working thing (the landing's own, on the island's figures); the data under all
 * four, what is read and how often, and what the models add; and the close, "Email the team". Night and ice alternate,
 * as on the landing; white is only the data. docs/SOLUTIONS.md has the claims and their sources.
 */
export default async function SolutionsPage() {
  preload("/fonts/google-sans-flex/google-sans-flex-latin.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  const [{ stats, rentals, invest, occMedian }, coverage] = await Promise.all([getIsland(), getCoverage()]);
  const demo = stats?.source === "demo";
  const read = coverage?.source === "live" ? coverage.read : null;
  // The cadences are the data repos' crontabs (Data.STR: availability every second day, prices weekly; Data.Property:
  // Bazaraki weekly), as the landing's "Last read" gives them. Change them there too if they change.
  const sources = [
    { what: "Short-⁠let calendars", from: "Airbnb", every: "Every 2 days", last: read ? readOn(read.calendars) : null },
    { what: "Nightly prices", from: "Airbnb", every: "Weekly", last: read ? dayOf(read.prices) : null },
    { what: "Rent ads", from: "Bazaraki", every: "Weekly", last: read ? dayOf(read.rents) : null },
    { what: "Sale ads", from: "Bazaraki", every: "Weekly", last: read ? dayOf(read.sales) : null },
  ];
  const dated = sources.some((s) => s.last);

  return (
    <HeroAreaProvider island={{ stats, rentals, invest, occMedian }}>
      <div className="bn overflow-x-clip">
        <Nav />

        {/* The first screen: a night card, the bar inside its top as on the landing (`data-nav-night` tells the bar it
            is under night). The four, named by what you do with each, link down to their bands. */}
        <section className="th-landing bn-night so-hero" data-nav-night="" aria-labelledby="so-h">
          <span className="bn-glow" aria-hidden="true" />
          <div className="so-hero-in so-in">
            <div className="so-hero-words">
              <p className="bn-eb">Solutions</p>
              <h1 id="so-h" className="so-h1">
                Four solutions. <span className="ps-pay">One dataset.</span>
              </h1>
              <p className="so-hero-lede">
                <b>For all property professionals.</b> Explore the market yourself, have the case written up by our
                team, ask our data in Claude, or have analysis built to your brief. All four are backed by the same
                data, read and modelled by us.
              </p>
            </div>
            <ol className="so-index" aria-label="The four solutions">
              {SOLUTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="so-index-name">{s.name}</span>
                    <span className="so-index-verb">{s.verb}</span>
                    <ArrowDown size={22} strokeWidth={2} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
            {stats && rentals && invest && (
              <p className="so-fresh">
                {demo ? "Sample data: " : "Backed by "}
                <b>{int(stats.listingCount)}</b> short-&#8288;lets, <b>{int(rentals.supply)}</b> long-&#8288;lets and{" "}
                <b>{int(invest.supply)}</b> for-&#8288;sale ads.
              </p>
            )}
          </div>
        </section>

        {/* From here to the data, the page's own bar follows the reader (sticky; it lets go before the close). */}
        <div className="so-body">
          <SolutionsBar />

          <section id="roles" className="th-landing bn-band bn-band-ice so-band so-roles" aria-labelledby="roles-h">
            <div className="so-in">
              <div className="so-head">
                <div>
                  <p className="bn-eb" data-rv="eb">
                    Who it is for
                  </p>
                  <h2 id="roles-h" className="so-h" data-rv="">
                    Start from your role.{" "}
                    <span className="ps-pay" data-rv="pay" style={at(2)}>
                      What fits, and why.
                    </span>
                  </h2>
                </div>
              </div>
              <ul className="so-role-grid">
                {ROLES.map((r, i) => (
                  <li key={r.name} className="so-role" data-rv="" style={at(i)}>
                    <h3>{r.name}</h3>
                    <p className="so-role-job">{r.job}</p>
                    <p className="so-role-why">{r.why}</p>
                    <p className="so-role-start">
                      <span>Start with</span>
                      {r.start.map((id) => (
                        <a key={id} href={`#${id}`} className="so-chip">
                          {nameOf(id)}
                          <ArrowDown size={15} strokeWidth={2.2} aria-hidden="true" />
                        </a>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {SOLUTIONS.map((s, i) => (
            <SolutionBand key={s.id} s={s} night={i % 2 === 0} />
          ))}

          {/* The data under all four: the only white section, so no two bands of one ground touch and the close's night
              does not meet a night band. Live figures sit on a navy card (Night Carries Data); the schedule is a table. */}
          <section id="data" className="th-landing so-data" aria-labelledby="data-h">
            <div className="so-in">
              <div className="so-head so-head-split">
                <div>
                  <p className="bn-eb" data-rv="eb">
                    Sources and models
                  </p>
                  <h2 id="data-h" className="so-h" data-rv="">
                    Behind every solution.{" "}
                    <span className="ps-pay" data-rv="pay" style={at(2)}>
                      Our data, our models.
                    </span>
                  </h2>
                </div>
                <p className="so-say" data-rv="" style={at(1)}>
                  All four rest on one dataset: the island&rsquo;s short-&#8288;lets from Airbnb, and its
                  long-&#8288;lets, homes and plots for sale from Bazaraki, each placed on its street and run through
                  our models.
                </p>
              </div>

              <div className="so-data-grid">
                <figure
                  className="bn-night so-isl-card"
                  data-rv="frame"
                  aria-label="The island at night, every short-let a light"
                >
                  <div className="so-isl" aria-hidden="true">
                    <div className="so-isl-zoom">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a drawn SVG, with the lights' canvas over it */}
                      <img src="/landing/island.svg" alt="" loading="lazy" decoding="async" />
                      <IslandLights />
                    </div>
                  </div>
                  <figcaption>
                    <span>
                      Every short-&#8288;let we read is a light, brighter where it has been fuller this season.
                    </span>
                    {demo && <span className="ps-tag">Sample data</span>}
                  </figcaption>
                </figure>

                <div className="so-data-side">
                  <div className="so-read" data-rv="" style={at(1)}>
                    <table className="so-table">
                      <caption className="so-spec-h">What we read, and how often</caption>
                      <thead>
                        <tr>
                          <th scope="col">Source</th>
                          <th scope="col">From</th>
                          <th scope="col">Read</th>
                          {dated && <th scope="col">Most recently</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s) => (
                          <tr key={s.what}>
                            <th scope="row">{s.what}</th>
                            <td>{s.from}</td>
                            <td>{s.every}</td>
                            {dated && <td>{s.last ?? "–"}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="so-models" data-rv="" style={at(2)}>
                    <h3 className="so-spec-h">What our models add</h3>
                    <ul>
                      {MODELS.map((m) => (
                        <li key={m.name}>
                          <b>{m.name}:</b> {m.text}
                        </li>
                      ))}
                    </ul>
                    <p className="so-limit">
                      Figures describe the market from its public listings; any one property can do better or worse.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* The page ends in night, as the landing does: "Ask the team", with "Email the team" the main action. */}
        <div className="bn-night bn-close">
          <span className="bn-glow" aria-hidden="true" />
          <CTASection />
          <Footer />
        </div>
        <Reveal />
      </div>
    </HeroAreaProvider>
  );
}
