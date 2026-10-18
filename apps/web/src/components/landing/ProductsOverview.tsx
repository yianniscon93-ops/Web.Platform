import { ArrowRight } from "lucide-react";
import { revenueByMonth } from "@/lib/landing/areaLines";
import { CYPRUS_AREA } from "@/lib/landing/compare";
import { getIsland } from "@/lib/landing/island";
import { euro, greekQuestion, greekReply, int, pct } from "@/lib/landing/sectionLines";

/**
 * The products, at a glance (plan 3, owner 2026-10-17): right after "How it works", whose last line names them, a
 * heading and three tiles, each showing its product's real output. The Playground on a navy tile (live data): Cyprus
 * in its three markets, counts and medians from the database. Reports on an ice tile (a paper thing): a page of a
 * property report, its rail of nine sections and its months of revenue. The Connector on a cloud tile: a question
 * asked in Greek and the answer it gets, from the same figures. Each tile leads down to its product's own section.
 * Every figure is the database's (getIsland, read on the server); a figure that cannot be had is left out.
 */
export default async function ProductsOverview() {
  const { stats, rentals, invest } = await getIsland();
  const demo = stats?.source === "demo";
  const rent = rentals?.rentQuartiles?.[1] ?? null;
  const price = invest?.priceQuartiles?.[1] ?? null;
  const revenue = stats ? revenueByMonth(stats.weekly) : null;
  const top = revenue ? Math.max(...revenue.months.map((m) => m.v)) : 0;
  const greek = stats ? greekReply(stats.listingCount, stats) : null;

  return (
    <section id="products" className="th-landing po" aria-labelledby="po-h">
      <div className="po-in">
        <div className="po-head">
          <p className="bn-eb" data-rv="eb">
            Products
          </p>
          {/* Two tones: the claim in ink, its payoff in the second tone, naming the three in the order their sections
              come, in their own words (explore, written up, Claude). */}
          <h2 id="po-h" className="po-h" data-rv="">
            Market intelligence, three ways.{" "}
            <span className="ps-pay" data-rv="pay" style={{ "--i": 2 } as React.CSSProperties}>
              Explore it yourself, have it written up, or ask Claude.
            </span>
          </h2>
          <p className="po-say" data-rv="" style={{ "--i": 3 } as React.CSSProperties}>
            Every figure below is for all of Cyprus{demo ? ", on sample data" : ", from the latest read"}.
          </p>
        </div>

        <div className="po-grid">
          <article className="po-tile po-pg bn-night" data-rv="frame" data-moment="" aria-labelledby="po-pg-h">
            <p className="po-eb">Playground</p>
            <h3 id="po-pg-h">Explore the data yourself.</h3>
            <p className="po-tsay">Draw any area, down to a few streets, and compare short-&#8288;lets, long-&#8288;lets and sales side by side.</p>
            {stats && (
              <table className="po-mkt">
                <caption className="sr-only">All of Cyprus, in its three markets</caption>
                <tbody>
                  <tr style={{ "--i": 0 } as React.CSSProperties}>
                    <th scope="row">
                      <i className="po-light" aria-hidden="true" />
                      Short-&#8288;lets
                    </th>
                    <td className="po-n">{int(stats.listingCount)}</td>
                    <td>
                      {stats.medianRate != null && <b>{euro(stats.medianRate)}</b>}
                      {stats.medianRate != null && " a night"}
                      {stats.medianRate != null && stats.effOccTodate != null && ", "}
                      {stats.effOccTodate != null && (
                        <>
                          <b>{pct(stats.effOccTodate)}</b> booked this season
                        </>
                      )}
                      {stats.effOccTodate != null && (
                        <span className="po-bar" aria-hidden="true">
                          <i style={{ "--w": stats.effOccTodate / 100 } as React.CSSProperties} />
                        </span>
                      )}
                    </td>
                  </tr>
                  {rentals && (
                    <tr style={{ "--i": 1 } as React.CSSProperties}>
                      <th scope="row">
                        <i className="po-sq" aria-hidden="true" />
                        Long-&#8288;lets
                      </th>
                      <td className="po-n">{int(rentals.supply)}</td>
                      <td>{rent != null ? <><b>{euro(rent)}</b> a month, the median rent</> : "–"}</td>
                    </tr>
                  )}
                  {invest && (
                    <tr style={{ "--i": 2 } as React.CSSProperties}>
                      <th scope="row">
                        <i className="po-sq po-sq-o" aria-hidden="true" />
                        For-&#8288;sale ads
                      </th>
                      <td className="po-n">{int(invest.supply)}</td>
                      <td>{price != null ? <><b>{euro(price)}</b> asked, the median home</> : "–"}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <div className="po-act">
              <a href="/dashboard" className="po-go">
                Open the Playground
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </a>
              {demo && <span className="ps-tag">Sample data</span>}
            </div>
          </article>

          <article className="po-tile po-rp" data-rv="frame" data-moment="" style={{ "--i": 1 } as React.CSSProperties} aria-labelledby="po-rp-h">
            <p className="po-eb">Reports</p>
            <h3 id="po-rp-h">Have it written up.</h3>
            <p className="po-tsay">A data-driven case for one property or one area, written by the team.</p>
            {/* A page of the property report, small: its running head, its rail of nine sections (two read, the third
                showing), and the months of revenue its third section charts. */}
            <div className="po-sheet" aria-hidden="true">
              <p className="po-sheet-h">
                <span>Revenue feasibility of a property</span>
                <span>3 of 9</span>
              </p>
              <span className="po-rail">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} data-at={i < 2 ? "read" : i === 2 ? "now" : undefined} style={{ "--i": i } as React.CSSProperties} />
                ))}
              </span>
              {revenue && (
                <span className="po-bars">
                  {revenue.months.slice(-6).map((m, i) => (
                    <span key={m.name}>
                      <i style={{ "--h": m.v / top, "--i": i } as React.CSSProperties} />
                      <small>{m.label}</small>
                    </span>
                  ))}
                </span>
              )}
            </div>
            <a href="#reports" className="po-link th-link">
              See a sample page
            </a>
          </article>

          <article className="po-tile po-cn" data-rv="frame" data-moment="" style={{ "--i": 2 } as React.CSSProperties} aria-labelledby="po-cn-h">
            <p className="po-eb">Connector</p>
            <h3 id="po-cn-h">Ask Claude, in Greek too.</h3>
            {greek && (
              <div className="po-chat">
                {/* One example exchange (the answer's figures are the database's), so it says it is an example. */}
                <span className="ps-tag">Example</span>
                <p className="po-q" lang="el">
                  {greekQuestion(CYPRUS_AREA, false)}
                </p>
                <p className="po-a" lang="el">
                  {greek.text}
                </p>
              </div>
            )}
            <a href="#connector" className="po-link th-link">
              See it answer
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
