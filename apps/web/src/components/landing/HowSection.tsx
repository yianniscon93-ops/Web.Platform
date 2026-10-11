import { PRODUCTS } from "./products";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { int } from "@/lib/landing/areaLines";
import { getInvest, getRentals, getStats, getSummary } from "@/lib/server/marketData";

// One month of the example listing's calendar: b a night booked, o a night its owner blocked, f a night free.
const MONTH = "bbbbbfbbbbbooobbbbbfbbbbfbobff";
const nights = (kind: string) => [...MONTH].filter((d) => d === kind).length;
const BOOKED = nights("b");
const BLOCKED = nights("o");
const FREE = nights("f");
const share = (n: number) => Math.round((n / MONTH.length) * 100);

const readOn = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Nicosia" })
    : null;

/**
 * "How the numbers are made": one listing followed from the site it was published on to the three products,
 * as a line with five stops. The listing is an example and says so; the counts at the first stop and the time of
 * the last read are the database's, asked for here on the server, and are left out if they cannot be had.
 * Its styles are in app/landing-how.css. It comes up over the product cards, before the close.
 */
export default async function HowSection() {
  const [stats, rentals, invest, summary] = await Promise.all([
    getStats(DEFAULT_FILTERS, null).catch(() => null),
    getRentals(null).catch(() => null),
    getInvest(null).catch(() => null),
    getSummary().catch(() => null),
  ]);
  const held = stats && rentals && invest ? { shortLets: stats.listingCount, longLets: rentals.supply, forSale: invest.supply } : null;
  const demo = stats?.source === "demo";
  // On demo data the "last read" is only the time the page was built.
  const read = demo ? null : readOn(summary?.lastRunAt ?? null);

  return (
    <section id="how" className="th-landing hw" aria-labelledby="how-h">
      <div className="hw-in">
        <h2 id="how-h" className="th-h1 hw-h m-0">How the numbers are made.</h2>
        {/* What is behind the figures, in the owner's terms (2026-10-11): the listings collected across the island,
            all three markets, and the models that turn them into insights. The count is the database's, today's. */}
        <p className="th-lede m-0">
          We collect{" "}
          {/* Demo data has no true count to quote: there the sentence says it without one. */}
          {held && !demo ? <b>{int(held.shortLets + held.longLets + held.forSale)} listings</b> : "the listings"} from across
          Cyprus, short-&#8288;lets, long-&#8288;lets and homes for sale, and our models turn them into every figure on
          this page. Follow one from the site it was posted on to the three ways it reaches you.
        </p>

        <ol className="hw-line m-0 list-none p-0">
          <li data-stop="source">
            <h3>It is published</h3>
            <div className="hw-spec">
              <p className="hw-card m-0">
                <i aria-hidden="true" />
                <b>2-&#8288;bed apartment</b>
                <span>Kato Paphos</span>
                <span>€140 a night</span>
              </p>
              <span className="th-sample">An example listing</span>
            </div>
            <p className="hw-say m-0">On Airbnb if it is a short-&#8288;let, on Bazaraki if it is to rent or for sale.</p>
            {held && (
              <p className="hw-fact m-0">
                <b>{int(held.shortLets)}</b> short-&#8288;lets, <b>{int(held.longLets)}</b> long-&#8288;lets and{" "}
                <b>{int(held.forSale)}</b> homes for sale today.
                {demo && <span className="th-tag">Demo data</span>}
              </p>
            )}
          </li>

          <li data-stop="read">
            <h3>We read it, every day</h3>
            <div className="hw-spec">
              <p className="hw-month m-0" role="img" aria-label={`One month of its calendar: ${BOOKED} nights booked, ${BLOCKED} blocked by the owner, ${FREE} free`}>
                {[...MONTH].map((d, i) => (
                  <i key={i} data-night={d} />
                ))}
              </p>
              <p className="hw-key m-0" aria-hidden="true">
                <span data-night="b">{BOOKED} booked</span>
                <span data-night="o">{BLOCKED} blocked</span>
                <span data-night="f">{FREE} free</span>
              </p>
            </div>
            <p className="hw-say m-0">
              Its price and its calendar, again each day: when it is booked, when its price moves, when it goes.
            </p>
            {read && (
              <p className="hw-fact m-0">
                Last read <b>{read}</b>.
              </p>
            )}
          </li>

          <li data-stop="place">
            <h3>We put it on the map</h3>
            <div className="hw-spec">
              <svg className="hw-map" viewBox="0 0 150 92" aria-hidden="true">
                <path className="hw-map-far" d="M6 30 40 6l62 4 42 30-10 40-70 8-52-20z" />
                <path className="hw-map-mid" d="M34 34 70 20l44 12 6 34-48 14-36-16z" />
                <path className="hw-map-near" d="M62 38l30 2 6 22-28 8-14-14z" />
                <g className="hw-map-nodes">
                  <rect x="59" y="35" width="6" height="6" />
                  <rect x="89" y="37" width="6" height="6" />
                  <rect x="95" y="59" width="6" height="6" />
                  <rect x="67" y="67" width="6" height="6" />
                  <rect x="53" y="53" width="6" height="6" />
                </g>
                <rect className="hw-map-dot" x="74" y="48" width="8" height="8" />
              </svg>
              <p className="hw-crumb m-0">Kato Paphos, in the Paphos district</p>
            </div>
            <p className="hw-say m-0">
              By its exact position and under its district, town, quarter and resort area, so any area you draw
              knows what is inside it.
            </p>
          </li>

          <li data-stop="measure">
            <h3>We measure it</h3>
            <div className="hw-spec">
              <p className="hw-bars m-0">
                <span style={{ "--w": `${share(BOOKED + BLOCKED)}%` } as React.CSSProperties}>
                  <i aria-hidden="true" />
                  <span>
                    <em>{share(BOOKED + BLOCKED)}%</em> taken on its calendar: {BOOKED + BLOCKED} of {MONTH.length} nights
                  </span>
                </span>
                <span data-ours="" style={{ "--w": `${share(BOOKED)}%` } as React.CSSProperties}>
                  <i aria-hidden="true" />
                  <span>
                    <em>{share(BOOKED)}%</em> really booked: {BOOKED} of {MONTH.length} nights
                  </span>
                </span>
              </p>
            </div>
            <p className="hw-say m-0">
              Nights really booked are told apart from nights the owner blocked. A home for sale is matched with
              short-&#8288;lets near it of the same size, to say what it could earn.
            </p>
          </li>

          {/* The line ends on the products in one sentence: the first screen and their cards have said what each is. */}
          <li data-stop="out">
            <h3>It reaches you, three ways</h3>
            <p className="hw-say hw-out m-0">
              In the{" "}
              {PRODUCTS.map(({ id, name }, i) => (
                <span key={id}>
                  <a href={`#${id}`} className="th-link">
                    {name}
                  </a>
                  {i === 0 ? ", in " : i === 1 ? " and through the " : "."}
                </span>
              ))}
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
