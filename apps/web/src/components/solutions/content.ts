/**
 * The Solutions page's words (app/solutions/page.tsx, owner 2026-10-19: "explore more about available solutions"),
 * kept apart from the markup so they can be read and changed in one place. Every feature named here is one the code or
 * the data repos back (docs/SOLUTIONS.md lists each claim with its source): the Playground's five tabs and filters
 * (components/dashboard), the report kinds and their sections (landing/ReportsSection.tsx, Data.Insights' report
 * templates), the Connector's tools (Data.Insights `insights/tools`), the read cadence (the data repos' crontabs). None
 * of it states a price, a turnaround, a client or an accuracy figure, and nothing is said to be read daily or in real
 * time. The Playground's radius and locate controls, shareable links and exports do not exist, so they are not named;
 * nor are plots in the Playground (tracked weekly, not in it yet), nor the Connector's map links (built, not deployed).
 */

export type SolutionId = "playground" | "reports" | "connector" | "custom";

export interface Solution {
  id: SolutionId;
  name: string;
  /** How you get it, as the hero's index and the band's eyebrow say it: from doing it yourself to having it built. */
  verb: string;
  eyebrow: string;
  /** The heading's second tone, after the name. */
  claim: string;
  lede: string[];
  inside: Array<{ name: string; text: string }>;
  insideTitle: string;
  asks: string[];
  asksTitle: string;
  who: string;
}

export const SOLUTIONS: Solution[] = [
  {
    id: "playground",
    name: "Playground",
    verb: "Explore it yourself, street by street.",
    eyebrow: "Explore it yourself",
    claim: "Every street, three markets.",
    lede: [
      "Street-level analytics for the whole island. Search any town, resort or district in English or Greek, or draw your own area round a few streets, and see what the listings inside earn, rent for and sell for.",
      "Compare up to three places side by side, and narrow any view by bedrooms, property type, nightly rate, rating, distance to the beach and 22 amenities.",
    ],
    insideTitle: "What’s inside",
    inside: [
      { name: "The map", text: "every short-⁠let, shaded by how full it has been this season or how booked it is for the next 60 days." },
      { name: "Market overview", text: "occupancy, nightly rate, RevPAR and revenue per listing, week by week, against the district and Cyprus." },
      { name: "Pricing", text: "rates for the next six months, by bedrooms, and what each amenity adds to a night." },
      { name: "Booking pace", text: "how far ahead guests book, how long they stay and how the coming weeks are filling." },
      { name: "Buy & Rent", text: "asking prices, rents, gross yields, a deal screener and the point where a short-⁠let out-earns a tenant." },
      { name: "Revenue calculator", text: "your own price, rate, costs and mortgage, worked into a year’s profit." },
    ],
    asksTitle: "Questions it answers",
    asks: [
      "Would this flat earn more on Airbnb or with a tenant?",
      "How far ahead do guests book for August?",
      "What does a pool add to the nightly rate here?",
      "Which of these three areas holds its occupancy best?",
    ],
    who: "For hosts, investors and agents. Free to explore.",
  },
  {
    id: "reports",
    name: "Reports",
    verb: "Have the full case written up.",
    eyebrow: "Written by our team",
    claim: "The full case, written up.",
    lede: [
      "A data-driven case for one property or one area, written by our team on the same data as the Playground, with what each figure rests on.",
      "Nine sections for a property, from what it could earn to what it keeps after costs and what we would do with it. Four for an area.",
    ],
    insideTitle: "What’s inside",
    inside: [
      { name: "For a property", text: "revenue across the year, what price and minimum stay change, what each amenity is worth, how reviews move bookings, gross to net and the comparable set." },
      { name: "Our recommendation", text: "the scenarios side by side, and what each is worth." },
      { name: "For an area", text: "what it costs, what it earns, the features that pay and the investment case." },
      { name: "Key findings", text: "every analysis section ends in one, written by the team." },
      { name: "The format", text: "opens as a web page and prints to PDF." },
    ],
    asksTitle: "Questions it answers",
    asks: [
      "What could this villa earn in a year, and keep after costs?",
      "Would a lower rate or a shorter minimum stay fill it better?",
      "Is this area better bought to let short or long?",
    ],
    who: "For investors weighing a buy and agents backing advice.",
  },
  {
    id: "connector",
    name: "Connector",
    verb: "Ask our data in Claude.",
    eyebrow: "In Claude",
    claim: "Our data, inside Claude.",
    lede: [
      "Add Plotsights Cyprus to Claude and ask about any town, resort or district in plain words, in English or Greek.",
      "Every answer is built from our data, says how firm it is and the date it refers to, and says so when it cannot answer.",
    ],
    insideTitle: "What it can read",
    inside: [
      { name: "Area summaries", text: "short-⁠lets, occupancy, nightly rate and RevPAR for a place." },
      { name: "Trends", text: "occupancy, rate and RevPAR month by month." },
      { name: "Comparables", text: "what one property could earn, with the listings closest to it." },
      { name: "Sale and rent prices", text: "asking prices, price per m², days on market and price cuts." },
      { name: "One ad’s history", text: "its asking price, followed across re-posts." },
      { name: "Maps", text: "of occupancy, nightly rates, sale prices or rents." },
    ],
    asksTitle: "Questions it answers",
    asks: [
      "How are short-⁠lets doing in Larnaca?",
      "Which months fill up, and which go quiet?",
      "What could a two-bed flat here earn on Airbnb?",
      "Are sellers cutting prices in Paphos?",
    ],
    who: "For anyone who already works in Claude. Access is set up by the team for now.",
  },
  {
    id: "custom",
    name: "Custom solutions",
    verb: "Have analyses, datasets and feeds built.",
    eyebrow: "Built on request",
    claim: "Built to your brief.",
    lede: [
      "When your question is not one the Playground or a report asks, our data team builds the answer on the same Cyprus data: a bespoke analysis, a custom dataset or export, or a feed into your own systems.",
    ],
    insideTitle: "What we build",
    inside: [
      { name: "Bespoke analyses", text: "screens, benchmarks and forecasts on your own question." },
      { name: "Datasets and exports", text: "the listings, ads or figures you need, as a spreadsheet, once or every week." },
      { name: "Feeds", text: "an area’s figures, week by week, into your own dashboard or model." },
      { name: "Land for sale", text: "the plots we track every week, which the Playground does not show yet." },
    ],
    asksTitle: "What to send us",
    asks: [
      "The question you want answered.",
      "The places, or the listings, it covers.",
      "The form you need it in: a write-up, a spreadsheet or a feed.",
    ],
    who: "For teams with a question of their own.",
  },
];

/** The three audiences PRODUCT.md gives, each with the two solutions that fit it first and why. */
export const ROLES: Array<{ name: string; job: string; why: string; start: SolutionId[] }> = [
  {
    name: "Investors",
    job: "Deciding where and what to buy.",
    why: "Set what a home would earn as a short-⁠let against what it would rent for, see the yields of the homes for sale around it, then have the full case written up before you commit.",
    start: ["playground", "reports"],
  },
  {
    name: "Hosts and managers",
    job: "Pricing and filling your nights.",
    why: "Read the coming months’ rates, how far ahead guests book and what each amenity adds on the streets around your listings, and ask the same in Claude between tasks.",
    start: ["playground", "connector"],
  },
  {
    name: "Agents and advisers",
    job: "Backing your advice with numbers.",
    why: "Hand a client a written case for a property or an area, or have a weekly export of the new ads in your district built for your team.",
    start: ["reports", "custom"],
  },
];

/** What our models add to what we read (docs/POSTGRES.md, Core.Noesis serving, marketData.ts). */
export const MODELS = [
  { name: "Booked or blocked", text: "we tell nights guests booked from nights the owner blocked, so occupancy is what was really booked." },
  { name: "Three prices for every home", text: "its asking price, what it would earn as a short-⁠let and what it would rent for, from comparable listings within 2 km." },
  { name: "The tipping point", text: "how full a short-⁠let has to be before it out-earns a tenant." },
  { name: "On the books", text: "how the coming weeks are filling, and how far ahead they fill." },
];
