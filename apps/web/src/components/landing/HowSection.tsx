import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { int } from "@/lib/landing/areaLines";
import { project, viewOf } from "@/lib/landing/areaView";
import { ISLAND_AREA } from "@/lib/landing/compare";
import { HERO_TOWNS } from "@/lib/landing/heroTowns";
import { DRAWN, townGround } from "@/lib/landing/townAreas";
import { getCoverage, getIsland, readOn } from "@/lib/landing/island";
import { getStats } from "@/lib/server/marketData";
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
 * "How it works" (plan 3, owner 2026-10-17: "I love the how it works the section"; sharpened 2026-10-18): right after
 * the hero, on an ice band, what the numbers rest on. The heading, then three counts about the data itself that the
 * first screen does not already give (weeks of booking history kept, places named on the map, bookings told from owner
 * blocks), then one listing followed in four steps, each picture right before its own step and each making one point
 * in one large figure at its top left (the island's short-lets, those inside Kato Paphos, the example's nights really
 * booked, the island's gross yield as a short-let). On a wide window with motion the steps pass one held night frame
 * (sticky, CSS, once Reveal.tsx has marked the story `data-framed`): the step across the window's middle is the active
 * one (its dot ringed on the rail, its words in ink, the others a tone back) and its picture is the one shown, swapped
 * at once with a short fade through the night rather than scrubbed with the scroll, and its own move then plays once,
 * in time. On a phone each picture sits above its step; without script or with reduced motion every picture stays
 * beside its step and every word in ink. The story ends on the four products, which follow it. The counts and the time
 * are the database's, read on the server (getIsland, getCoverage), and each is left out if it cannot be had; the
 * listing and the home are examples and say so.
 */
export default async function HowSection() {
  const [{ stats, invest, summary }, coverage, kato] = await Promise.all([
    getIsland(),
    getCoverage(),
    getStats(DEFAULT_FILTERS, townGround(PAPHOS, KATO.ring)).catch(() => null),
  ]);
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
  const shortLets = stats?.listingCount ?? null;
  // Kato Paphos's own count is the point of step 2 where it is a real crowd; a handful (as on demo data, whose
  // listings are scattered round each town's middle) would undersell the step, so the picture names the place instead.
  const inKato = kato && kato.listingCount >= 20 ? kato.listingCount : null;
  // What the data holds that the first screen's counts do not say: how long it has been kept, how finely it is placed,
  // and how many bookings the models have told from blocks. Each is the database's own count; any it cannot give is left out.
  const counts = [
    { n: stats?.weekly.length || null, label: "weeks of booking history kept, each building on the last" },
    { n: coverage?.places ?? null, label: "places named on our map, from districts to resorts" },
    { n: coverage?.bookings ?? null, label: "bookings told apart from nights the owner blocked" },
  ].filter((c): c is { n: number; label: string } => c.n != null && c.n > 0);

  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
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
              Decisions backed by data.{" "}
              <span className="ps-pay" data-rv="pay" style={at(2)}>
                Updated daily, powered by our analytics models.
              </span>
            </h2>
          </div>
          <p className="mt-lede" data-rv="" style={at(1)}>
            Every figure here starts as a public listing we read ourselves, and ends as market intelligence from our own
            models. Follow one through the four steps.
          </p>
        </div>

        {counts.length >= 2 && (
          // A moment with counts in it starts as soon as it is a sixth in view, so the figures land as they are read.
          <div className="mt-held" data-moment="">
            <dl className="mt-counts" data-n={counts.length}>
              {counts.map((c, i) => (
                <div key={c.label} data-rv="" style={at(i)}>
                  <dt>{c.label}</dt>
                  <dd>
                    <Count n={c.n} />
                  </dd>
                </div>
              ))}
            </dl>
            {demo && (
              <p className="mt-held-note" data-rv="" style={at(3)}>
                <span className="ps-tag">Sample data</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-story" data-step="1">
          {/* Each picture stands right before its own step, so it is read with it, and without script, with reduced
              motion or on a phone each is simply there beside (or above) its step. On a wide window with motion,
              once Reveal.tsx has taken the story over (`data-framed`), the four pictures hold one over another in
              one sticky frame (CSS grid, landing-how.css) and the step at the window's middle decides which shows.
              The frame itself is only the night behind them. */}
          <div className="mt-frame" aria-hidden="true" />
          {/* The line the steps hang on: it fills to the step being read. */}
          <span className="mt-rail" aria-hidden="true">
            <i />
          </span>

          <figure className="mt-pic mt-pic-read" data-pic="1" data-moment="" aria-label="The island at night, every short-let a light">
            <div className="mt-pic-in">
              <Island lights />
              {shortLets != null && (
                <p className="mt-big">
                  <b>
                    <Count n={shortLets} />
                  </b>
                  <span>short-&#8288;lets on the map, each a light</span>
                </p>
              )}
            </div>
            <figcaption className="mt-cap">
              <span>Brighter is fuller this season</span>
              {demo && <span className="ps-tag">Sample data</span>}
            </figcaption>
          </figure>

          <div className="mt-step" data-st="1">
            <h3>We read the whole market.</h3>
            {/* The cadences are the data repos' crontabs (Data.STR: availability every second day, prices weekly;
                Data.Property: Bazaraki weekly). Change the words here, in the towns' "last read" strip and in the
                questions if those change. */}
            <p>
              Every short-&#8288;let calendar every two days; every nightly price, rent and sale ad every week. Short-&#8288;lets
              from Airbnb; long-&#8288;lets, homes and plots from Bazaraki.
            </p>
            {read && (
              <p className="mt-fact">
                Calendars last read <b>{read}</b>.
              </p>
            )}
          </div>

          <figure className="mt-pic mt-pic-place" data-pic="2" data-moment="" aria-label="From the island down to Kato Paphos">
            <div className="mt-pic-in">
              <Island lights />
              <div className="mt-town" aria-hidden="true">
                <svg viewBox={CROP} preserveAspectRatio="xMidYMid slice">
                  <image href={PAPHOS.src} x="0" y="0" width={PAPHOS.width} height={PAPHOS.height} />
                  <PaphosLights />
                  <path className="mt-ring-edge" d={KATO_D} pathLength={1} />
                  <path className="mt-ring" d={KATO_D} pathLength={1} />
                  {KATO.ring.map(([x, y], i) => (
                    <circle key={i} className="mt-corner" cx={x} cy={y} r="11" style={at(i)} />
                  ))}
                </svg>
              </div>
              <p className="mt-big mt-big-late">
                {inKato != null ? (
                  <>
                    <b>{int(inKato)}</b>
                    <span>short-&#8288;lets inside Kato Paphos{demo ? " (sample data)" : ""}</span>
                  </>
                ) : (
                  <>
                    <b>Kato Paphos</b>
                    <span>every listing placed on its street</span>
                  </>
                )}
              </p>
            </div>
            {/* The areas it sits in, outermost first: what any area drawn round it already knows. They are the
                picture's caption. */}
            <figcaption className="mt-cap">
              <ol className="mt-nest" aria-label="The areas it is placed in">
                {["Paphos district", "Paphos", "Kato Paphos", "Your area"].map((n, i) => (
                  <li key={n} style={at(i)}>
                    {n}
                  </li>
                ))}
              </ol>
            </figcaption>
          </figure>

          <div className="mt-step" data-st="2">
            <h3>We pin every listing to its street.</h3>
            <p>To its exact spot, then to its district, town, quarter and resort, so any area you draw already knows what is inside it.</p>
          </div>

          <figure
            className="mt-pic mt-pic-model"
            data-pic="3"
            data-moment=""
            aria-label={`One example listing's month: ${BOOKED} nights booked, ${BLOCKED} blocked by its owner, ${FREE} free`}
          >
            <div className="mt-pic-in">
              <div className="mt-cal">
                <p className="mt-big mt-big-flow">
                  <b>{share(BOOKED)}%</b>
                  <span>
                    really booked. Its calendar looks {share(BOOKED + BLOCKED)}% taken.
                  </span>
                </p>
                <p className="mt-lst">
                  <b>
                    2-&#8288;bed apartment <i aria-hidden="true" />
                  </b>
                  <span>Kato Paphos, €140 a night</span>
                  <span className="mt-eg">An example listing</span>
                </p>
                <p className="mt-days" aria-hidden="true">
                  {[...MONTH].map((d, i) => (
                    <i key={i} data-night={d} style={at(i)} />
                  ))}
                </p>
                <p className="mt-key" aria-hidden="true">
                  <span data-night="b">{BOOKED} booked</span>
                  <span data-night="o">{BLOCKED} blocked by the owner</span>
                  <span data-night="f">{FREE} free</span>
                </p>
                {raw != null && eff != null && (
                  <p className="mt-occ-all">
                    Across Cyprus: <b>{Math.round(raw)}%</b> of calendar nights look taken, <b>{Math.round(eff)}%</b> are booked
                    {demo ? " (sample data)" : ""}.
                  </p>
                )}
              </div>
            </div>
          </figure>

          <div className="mt-step" data-st="3">
            <h3>Our models tell booked from blocked.</h3>
            <p>
              A night the owner blocks is not a booking. This calendar looks {share(BOOKED + BLOCKED)}% full; {share(BOOKED)}% is really
              booked, and that is the figure we count.
            </p>
          </div>

          <figure className="mt-pic mt-pic-match" data-pic="4" data-moment="" aria-label="An example home for sale, matched with short-lets and long-lets of its size near it">
            <div className="mt-pic-in">
              <svg className="mt-match-map" viewBox={CROP} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <image href={PAPHOS.src} x="0" y="0" width={PAPHOS.width} height={PAPHOS.height} opacity="0.8" />
                <MatchLines />
              </svg>
              {strY != null && (
                <p className="mt-big mt-big-late">
                  <b>{strY.toFixed(1)}%</b>
                  <span>
                    gross yield as a short-&#8288;let{ltrY != null && <>, against {ltrY.toFixed(1)}% as a long-&#8288;let</>}
                  </span>
                </p>
              )}
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
                      <b>€{int(strRev)} a year</b>
                    </p>
                  )}
                  {ltrRent != null && (
                    <p>
                      <span>As a long-&#8288;let</span>
                      <b>€{int(ltrRent)} a month</b>
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
            <h3>We price every home three ways.</h3>
            <p>
              Each home for sale is matched with the short-&#8288;lets and long-&#8288;lets of its size nearby: what it asks, what it
              would earn and what it would rent for. That is how the Playground answers “Airbnb or a tenant?”.
            </p>
          </div>
        </div>

        {/* The hand-off: the line the story ends on names the four products, which follow on one band; each link opens its product there (ProductsSection). */}
        <p className="mt-end" data-rv="">
          <span className="mt-end-dot" aria-hidden="true" />
          <span>
            It reaches you four ways:{" "}
            {PRODUCTS.map(({ id, name }, i) => (
              <span key={id}>
                {id === "playground" || id === "connector" ? "the " : ""}
                <a href={`#${id}`} className="th-link">
                  {name}
                </a>
                {i < PRODUCTS.length - 2 ? ", " : i === PRODUCTS.length - 2 ? " and " : "."}
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
