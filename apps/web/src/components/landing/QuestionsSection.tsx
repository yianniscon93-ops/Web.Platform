import { int } from "@/lib/landing/areaLines";
import { getIsland, readOn } from "@/lib/landing/island";

/** What a row's dot says: in place now, or not yet. */
type State = "yes" | "not-yet";

interface Row {
  /** The question, short, as the sheet's key. */
  q: string;
  /** The answer in one line, with its figures. */
  a: React.ReactNode;
  /** The whole answer, shown when the row is opened. */
  more: React.ReactNode;
  state: State;
}

/**
 * The questions (plan 3; owner 2026-10-17: "should feel more techy and not get so much space"): a compact data
 * sheet rather than an accordion. Each row is a short question as its key, the answer in one line with its figures
 * in tabular numerals, and a dot for whether it is in place now or not yet; a row opens to the whole answer (a native
 * disclosure, so it works without script and with any keyboard). The figures and the time are the database's
 * (getIsland). Every answer is true as the code and docs stand; where one rests on something not yet decided it says
 * so (the Playground's accounts and plans, PRODUCT.md "Open decisions").
 */
export default async function QuestionsSection() {
  const { stats, rentals, invest, summary } = await getIsland();
  const demo = stats?.source === "demo";
  const read = demo ? null : readOn(summary?.lastRunAt ?? null);
  const raw = stats?.rawOccTodate ?? null;
  const eff = stats?.effOccTodate ?? null;

  const rows: Row[] = [
    {
      q: "Where is the data from?",
      a: (
        <>
          Airbnb for short-&#8288;lets; Bazaraki for long-&#8288;lets, homes and plots
        </>
      ),
      more: (
        <>
          Short-&#8288;lets from Airbnb; long-&#8288;lets, homes and plots for sale from Bazaraki. We read the public listings
          ourselves and keep what they show over time, so each week builds on the last.
        </>
      ),
      state: "yes",
    },
    {
      q: "How often is it read?",
      a: (
        <>
          Calendars every <b>2</b> days; prices and ads weekly
          {read && (
            <>
              {" "}
              <span className="qs-dim">last read {read}</span>
            </>
          )}
        </>
      ),
      more: (
        <>
          Each short-&#8288;let’s calendar is read again every two days, and its prices and Bazaraki’s rent, sale and land ads
          every week. The six towns above say when each source was last read.
        </>
      ),
      state: "yes",
    },
    {
      q: "How much does it cover?",
      a:
        stats && rentals && invest ? (
          <>
            <b>{int(stats.listingCount)}</b> short-&#8288;lets, <b>{int(rentals.supply)}</b> long-&#8288;lets, <b>{int(invest.supply)}</b>{" "}
            for-sale ads
            {demo && (
              <>
                {" "}
                <span className="qs-dim">sample data</span>
              </>
            )}
          </>
        ) : (
          <>The whole island, from Paphos to Protaras</>
        ),
      more: (
        <>
          Every listing we have read across Cyprus, the six towns on the first screen and everywhere between them. The
          for-sale count is every ad we have seen; ads taken down are not yet taken off it.
        </>
      ),
      state: "yes",
    },
    {
      q: "What does occupancy mean?",
      a:
        raw != null && eff != null ? (
          <>
            Nights really booked: <b>{Math.round(eff)}%</b> across Cyprus, where <b>{Math.round(raw)}%</b> look taken
          </>
        ) : (
          <>Nights really booked; nights the owner blocked are left out</>
        ),
      more: (
        <>
          The share of nights really booked. Nights the owner blocked are left out, so a calendar that only looks full is
          not counted as full.
        </>
      ),
      state: "yes",
    },
    {
      q: "Are plots in it?",
      a: <>Tracked every week; not in the Playground yet</>,
      more: <>We track plots for sale every week. They are not in the Playground yet; ask the team if you need them now.</>,
      state: "not-yet",
    },
    {
      q: "Is the Playground free?",
      a: <>Open to explore, every view, today</>,
      more: (
        <>
          You can open it and explore every view now, without an account. Accounts and plans are not settled yet; ask the
          team if you need more than it shows.
        </>
      ),
      state: "yes",
    },
    {
      q: "Does it work in Greek?",
      a: (
        <>
          Search takes <span lang="el">Λεμεσός</span>; the Connector takes Greek questions
        </>
      ),
      more: (
        <>
          Search takes <span lang="el">Λεμεσός</span> as well as Limassol. The Connector reads place names in Greek too, and
          Claude answers a question asked in Greek in Greek, from the same figures.
        </>
      ),
      state: "yes",
    },
  ];

  return (
    <section id="questions" className="th-landing qs" aria-labelledby="qs-h">
      <div className="qs-in">
        <div className="qs-head">
          {/* The eyebrow says what the section is (Eyebrows Inform), not the heading's own first word again. */}
          <p className="bn-eb" data-rv="eb">
            Data sheet
          </p>
          <h2 id="qs-h" className="qs-h" data-rv="">
            Questions.{" "}
            <span className="ps-pay" data-rv="pay" style={{ "--i": 2 } as React.CSSProperties}>
              About the data, answered.
            </span>
          </h2>
          <p className="qs-ask" data-rv="" style={{ "--i": 3 } as React.CSSProperties}>
            Not answered here?{" "}
            <a href="#access" className="th-link">
              Ask the team
            </a>
            .
          </p>
        </div>

        <div className="qs-sheet" data-moment="">
          <p className="qs-cols" aria-hidden="true">
            <span>Question</span>
            <span>Answer</span>
          </p>
          {rows.map((r, i) => (
            <details key={r.q} className="qs-row" style={{ "--i": i } as React.CSSProperties}>
              <summary>
                <i className="qs-dot" data-state={r.state} aria-hidden="true" />
                <span className="qs-q">{r.q}</span>
                <span className="qs-a">{r.a}</span>
                <span className="qs-state sr-only">{r.state === "yes" ? "In place now." : "Not yet."}</span>
                <span className="qs-tog" aria-hidden="true" />
              </summary>
              <div className="qs-more">
                <p>{r.more}</p>
              </div>
            </details>
          ))}
          <p className="qs-legend" aria-hidden="true">
            <span>
              <i className="qs-dot" data-state="yes" /> In place now
            </span>
            <span>
              <i className="qs-dot" data-state="not-yet" /> Not yet
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
