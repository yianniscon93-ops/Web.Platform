import { int } from "@/lib/landing/areaLines";
import { project, viewOf } from "@/lib/landing/areaView";
import { ISLAND_AREA } from "@/lib/landing/compare";
import { HERO_TOWNS } from "@/lib/landing/heroTowns";
import { DRAWN } from "@/lib/landing/townAreas";
import { getIsland, readOn } from "@/lib/landing/island";
import Count from "./Count";
import { PAPHOS_CROP } from "@/lib/landing/story";
import { IslandLights, MatchLines, PaphosLights } from "./StoryLights";
import { PRODUCTS } from "./products";

// One month of the example listing's calendar: b a night booked, o a night its owner blocked, f a night free.
const MONTH = "bbbbbbobbbbbfbboobbbbfbbfobbff";
const nights = (kind: string) => [...MONTH].filter((d) => d === kind).length;
const BOOKED = nights("b");
const BLOCKED = nights("o");
const FREE = nights("f");
const share = (n: number) => Math.round((n / MONTH.length) * 100);

const PAPHOS = HERO_TOWNS.find((t) => t.key === "paphos")!;
// Kato Paphos as the tour draws it (townAreas.ts), the area the story zooms to.
const KATO = DRAWN.paphos.areas.find((a) => a.name === "Kato Paphos")!;
const KATO_D = `M${KATO.ring.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
const KATO_MID: [number, number] = [
  KATO.ring.reduce((a, [x]) => a + x, 0) / KATO.ring.length,
  KATO.ring.reduce((a, [, y]) => a + y, 0) / KATO.ring.length,
];
// The town map's crop is centred on Kato Paphos, so the zoom ends on it.
const CROP = `${KATO_MID[0] - PAPHOS_CROP.w / 2} ${KATO_MID[1] - PAPHOS_CROP.h / 2} ${PAPHOS_CROP.w} ${PAPHOS_CROP.h}`;
// Where Kato Paphos lies on the island's picture (island.svg's own window), as shares of it: the zoom's centre.
const KATO_LATLNG: [number, number] = [PAPHOS.north - KATO_MID[1] / PAPHOS.perLat, PAPHOS.west + KATO_MID[0] / PAPHOS.perLng];
const [IX, IY] = project(viewOf(ISLAND_AREA), KATO_LATLNG[0], KATO_LATLNG[1]);
const ZOOM_AT = { "--mt-zx": `${((IX / 800) * 100).toFixed(2)}%`, "--mt-zy": `${((IY / 600) * 100).toFixed(2)}%` } as React.CSSProperties;

/** The island at night, every short-let a light: the picture of steps 1 and 2. */
function Island({ lights }: { lights?: boolean }) {
  return (
    <div className="mt-isl" aria-hidden="true">
      <div className="mt-isl-zoom" style={ZOOM_AT}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a drawn SVG, scaled with the canvas over it */}
        <img src="/landing/island.svg" alt="" loading="lazy" decoding="async" />
        {lights && <IslandLights />}
      </div>
    </div>
  );
}

/**
 * "How it works" (plan 3, owner 2026-10-17: "I love the how it works the section"): right after the hero, on an ice
 * band, what the numbers rest on. The heading, then what the database holds as three counts that count up (true
 * figures only), then one listing followed from the ad to the answer in four steps, each picture right before its own
 * step. On a wide window with motion the steps scroll past one held night frame (sticky, CSS, once Reveal.tsx has
 * marked the story `data-framed`) whose picture changes with the step at the window's middle: the island
 * with every short-let a light; the zoom down to Kato Paphos; the month of an example listing, booked told from
 * blocked; a home for sale matched with the lets near it. Where scroll timelines exist the picture's changes follow
 * the scroll (app/landing-how.css); elsewhere they play in time as each step arrives (Reveal.tsx). On a phone each
 * picture sits above its step; on a wide window without script or with reduced motion, beside it. The story ends on the three products, which follow it. The counts and the time are the
 * database's, read on the server (getIsland), and are left out if they cannot be had; the listing and the home are
 * examples and say so.
 */
export default async function HowSection() {
  const { stats, rentals, invest, summary } = await getIsland();
  const held = stats && rentals && invest ? { shortLets: stats.listingCount, longLets: rentals.supply, forSale: invest.supply } : null;
  const demo = stats?.source === "demo";
  // On demo data the "last read" is only the time the page was built.
  const read = demo ? null : readOn(summary?.lastRunAt ?? null);
  const raw = stats?.rawOccTodate ?? null;
  const eff = stats?.effOccTodate ?? null;
  const price = invest?.priceQuartiles?.[1] ?? null;
  const strRev = invest?.strRevenueMedian ?? null;
  const strY = invest?.strYieldMedian ?? null;
  const ltrRent = invest?.ltrRentMedian ?? null;
  const ltrY = invest?.ltrYieldMedian ?? null;
  const matched = price != null || strRev != null || ltrRent != null;

  return (
    <section id="how" className="th-landing bn-band bn-band-ice mt" aria-labelledby="how-h">
      <div className="mt-in">
        <div className="mt-head">
          <div>
            {/* The bar's own words for this section, so the link lands on what it named. */}
            <p className="bn-eb" data-rv="eb">
              How it works
            </p>
            <h2 id="how-h" className="mt-h" data-rv="">
              Backed by data.{" "}
              <span className="ps-pay" data-rv="pay" style={{ "--i": 2 } as React.CSSProperties}>
                Follow one listing from the ad to your answer.
              </span>
            </h2>
          </div>
          <p className="mt-lede" data-rv="" style={{ "--i": 1 } as React.CSSProperties}>
            Every figure on this page comes from public listings we read ourselves, turned into numbers by our own models.
          </p>
        </div>

        {held && (
          <div className="mt-held" data-moment="">
            <dl className="mt-counts">
              <div data-rv="" style={{ "--i": 0 } as React.CSSProperties}>
                <dt>short-&#8288;lets tracked</dt>
                <dd>
                  <Count n={held.shortLets} />
                </dd>
              </div>
              <div data-rv="" style={{ "--i": 1 } as React.CSSProperties}>
                <dt>long-&#8288;lets tracked</dt>
                <dd>
                  <Count n={held.longLets} />
                </dd>
              </div>
              <div data-rv="" style={{ "--i": 2 } as React.CSSProperties}>
                <dt>for-sale ads seen</dt>
                <dd>
                  <Count n={held.forSale} />
                </dd>
              </div>
            </dl>
            {/* Ad expiry is not tracked yet (roadmap §4): the count is every ad seen, and says so. */}
            <p className="mt-held-note" data-rv="" style={{ "--i": 3 } as React.CSSProperties}>
              {demo && <span className="ps-tag">Sample data</span>}
              <span>The for-sale count is every ad we have seen; ads taken down are not yet taken off it.</span>
            </p>
          </div>
        )}

        <div className="mt-story" data-step="1">
          {/* Each picture stands right before its own step, so it is read with it, and without script, with reduced
              motion or on a phone each is simply there beside (or above) its step. On a wide window with motion,
              once Reveal.tsx has taken the story over (`data-framed`), the four pictures hold one over another in
              one sticky frame (CSS grid, landing-how.css) and the step at the window's middle decides which shows.
              The frame itself is only the night behind them. */}
          <div className="mt-frame" aria-hidden="true" />
          {/* The line the steps hang on: it fills as they are read. */}
          <span className="mt-rail" aria-hidden="true">
            <i />
          </span>

          <figure className="mt-pic mt-pic-read" data-pic="1" data-moment="" aria-label="The island at night, every short-let a light">
            <div className="mt-pic-in">
              <Island lights />
              {held && (
                <p className="mt-big">
                  <b>
                    <Count n={held.shortLets} />
                  </b>
                  <span>short-&#8288;lets, each a light</span>
                </p>
              )}
            </div>
            <figcaption className="mt-cap">
              <span>Brighter is fuller this season</span>
              {demo && <span className="ps-tag">Sample data</span>}
            </figcaption>
          </figure>

          <div className="mt-step" data-st="1">
            <h3>We read the market.</h3>
            {/* The cadences are the data repos' crontabs (Data.STR: availability every second day, prices weekly;
                Data.Property: Bazaraki weekly). Change the words here and in the questions if those change. */}
            <p>
              Each short-&#8288;let’s calendar every two days. Its prices, and every rent and sale ad, every week. Short-&#8288;lets
              come from Airbnb; long-&#8288;lets, homes and plots for sale from Bazaraki.
            </p>
            {read && (
              <p className="mt-fact">
                Calendars last read <b>{read}</b>.
              </p>
            )}
          </div>

          <figure className="mt-pic mt-pic-place" data-pic="2" data-moment="scroll" aria-label="From the island down to Kato Paphos">
            <div className="mt-pic-in">
              <Island lights />
              <div className="mt-town" aria-hidden="true">
                <svg viewBox={CROP} preserveAspectRatio="xMidYMid slice">
                  <image href={PAPHOS.src} x="0" y="0" width={PAPHOS.width} height={PAPHOS.height} />
                  <PaphosLights />
                  <path className="mt-ring-edge" d={KATO_D} pathLength={1} />
                  <path className="mt-ring" d={KATO_D} pathLength={1} />
                  {KATO.ring.map(([x, y], i) => (
                    <circle key={i} className="mt-corner" cx={x} cy={y} r="11" style={{ "--i": i } as React.CSSProperties} />
                  ))}
                </svg>
              </div>
              {/* The areas it sits in, outermost first: what any area drawn round it already knows. */}
              <ol className="mt-nest" aria-label="The areas it is placed in">
                {["Paphos district", "Paphos", "Kato Paphos", "Your area"].map((n, i) => (
                  <li key={n} style={{ "--i": i } as React.CSSProperties}>
                    {n}
                  </li>
                ))}
              </ol>
            </div>
            <figcaption className="mt-cap">
              <span>Kato Paphos, in the Paphos district</span>
            </figcaption>
          </figure>

          <div className="mt-step" data-st="2">
            <h3>We place it on the map.</h3>
            <p>By its exact position, and under its district, town, quarter and resort area, so any area you draw knows what is inside it.</p>
          </div>

          <figure className="mt-pic mt-pic-model" data-pic="3" data-moment="" aria-label={`One example listing's month: ${BOOKED} nights booked, ${BLOCKED} blocked by its owner, ${FREE} free`}>
            <div className="mt-pic-in">
              <div className="mt-cal">
                <div className="mt-cal-l">
                  <p className="mt-lst">
                    <b>
                      2-&#8288;bed apartment <i aria-hidden="true" />
                    </b>
                    <span>Kato Paphos, €140 a night</span>
                    <span className="mt-eg">An example listing</span>
                  </p>
                  <p className="mt-days" aria-hidden="true">
                    {[...MONTH].map((d, i) => (
                      <i key={i} data-night={d} style={{ "--i": i } as React.CSSProperties} />
                    ))}
                  </p>
                  <p className="mt-key" aria-hidden="true">
                    <span data-night="b">{BOOKED} booked</span>
                    <span data-night="o">{BLOCKED} blocked</span>
                    <span data-night="f">{FREE} free</span>
                  </p>
                </div>
                <div className="mt-occ">
                  <p style={{ "--w": share(BOOKED + BLOCKED) / 100 } as React.CSSProperties}>
                    <span>
                      <b>{share(BOOKED + BLOCKED)}%</b> taken on its calendar: {BOOKED + BLOCKED} of {MONTH.length} nights
                    </span>
                    <i aria-hidden="true" />
                  </p>
                  <p data-ours="" style={{ "--w": share(BOOKED) / 100 } as React.CSSProperties}>
                    <span>
                      <b>{share(BOOKED)}%</b> really booked: {BOOKED} of {MONTH.length} nights
                    </span>
                    <i aria-hidden="true" />
                  </p>
                  {raw != null && eff != null && (
                    <p className="mt-occ-all">
                      Across Cyprus: <b>{Math.round(raw)}%</b> of calendar nights look taken, <b>{Math.round(eff)}%</b> are booked
                      {demo ? " (sample data)" : ""}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </figure>

          <div className="mt-step" data-st="3">
            <h3>Our models tell booked from blocked.</h3>
            <p>
              A night the owner blocks is not a booking. This calendar looks {share(BOOKED + BLOCKED)}% taken; {share(BOOKED)}% of its
              nights are really booked, and that is the figure we count.
            </p>
          </div>

          <figure className="mt-pic mt-pic-match" data-pic="4" data-moment="scroll" aria-label="An example home for sale, matched with short-lets and long-lets of its size near it">
            <div className="mt-pic-in">
              <svg className="mt-match-map" viewBox={CROP} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <image href={PAPHOS.src} x="0" y="0" width={PAPHOS.width} height={PAPHOS.height} opacity="0.8" />
                <MatchLines />
              </svg>
              {matched && (
                <div className="mt-matched">
                  <p className="mt-matched-h">Across Cyprus, medians</p>
                  {price != null && (
                    <p>
                      <span>Asking price</span>
                      <b>€{int(price)}</b>
                    </p>
                  )}
                  {strRev != null && (
                    <p>
                      <span>As a short-&#8288;let</span>
                      <b>
                        €{int(strRev)} a year{strY != null && <>, {strY.toFixed(1)}% gross</>}
                      </b>
                    </p>
                  )}
                  {ltrRent != null && (
                    <p>
                      <span>As a long-&#8288;let</span>
                      <b>
                        €{int(ltrRent)} a month{ltrY != null && <>, {ltrY.toFixed(1)}% gross</>}
                      </b>
                    </p>
                  )}
                  {demo && <span className="ps-tag">Sample data</span>}
                </div>
              )}
            </div>
            <figcaption className="mt-cap mt-cap-key">
              <span>
                <i className="mt-k-light" aria-hidden="true" />
                short-&#8288;lets
              </span>
              <span>
                <i className="mt-k-sq" aria-hidden="true" />
                long-&#8288;lets
              </span>
              <span>
                <i className="mt-k-home" aria-hidden="true" />
                an example home for sale
              </span>
            </figcaption>
          </figure>

          <div className="mt-step" data-st="4">
            <h3>We weigh each market against the others.</h3>
            <p>
              Each home for sale is matched with short-&#8288;lets and long-&#8288;lets of its size nearby, to say what it could earn
              either way. That is how the Playground answers “Airbnb or a tenant?”.
            </p>
          </div>
        </div>

        {/* The hand-off: the line the story ends on names the three products, which are what comes next on the page. */}
        <p className="mt-end" data-rv="">
          <span className="mt-end-dot" aria-hidden="true" />
          <span>
            It reaches you in the{" "}
            {PRODUCTS.map(({ id, name }, i) => (
              <span key={id}>
                <a href={`#${id}`} className="th-link">
                  {name}
                </a>
                {i === 0 ? ", in " : i === 1 ? " and through the " : "."}
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
