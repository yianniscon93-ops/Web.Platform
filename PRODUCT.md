# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences of equal weight (confirmed 2026-10-08):

- Property investors deciding where and what to buy in Cyprus.
- Short-let hosts and managers benchmarking their own performance against nearby streets.
- Estate agents and advisers who need numbers to back up advice to clients.

## Product Purpose

A small Cyprus-based data team reads every short-let, long-let and for-sale
listing on the island daily and turns it into numbers people can act on.
Clients work with the data in two ways: they ask the team a question and get
an answer built for them (tailored reporting, insights and forecasts), or
they explore it themselves in the Playground.

The owner names three products (2026-10-08), and the landing hero has to say
exactly what they are and make the visitor want to explore further:

1. **The Playground**: the dashboard, free to explore, with analytics that
   compare short-term rentals, long-term rentals and sales.
2. **Reports**: written data insights on properties and areas in Cyprus,
   prepared by the team.
3. **The MCP connector**: the same data inside an AI assistant ("Noesis
   Cyprus" for Claude), which answers place questions and links back to the
   Playground.

This supersedes the earlier framing (same day) that the page sells the team's
services first with the Playground as proof.

## Positioning

Street-level answers: draw any area by hand, a few streets wide, and get the
numbers for just the listings inside it, across short-term rentals, long-term
rentals and sales in one place. A district average cannot tell you what a
hand-drawn area can.

## Operating Context

- Source listings come from Airbnb (short-lets) and Bazaraki (sales and
  long-term rentals).
- Place names appear in English and Greek in search and on the map.
- A Claude connector ("Noesis Cyprus") answers place questions and returns
  signed links that open the Playground on a preselected area.

## Capabilities and Constraints

- Playground (the dashboard's product name): map of every listing shaded by
  occupancy; one "Where?" control with search, draw, radius and locate;
  compare up to three areas; tabs for market, pricing, booking pace,
  buy and rent, and a revenue calculator; the selection is kept in the URL.
- Services: tailored reporting; insights and forecasts.
- Data is served read-only from the Postgres serving layer owned by the
  data-engineering repos; without a database the app shows deterministic demo
  data.

Open decisions:

- Pricing and tiers. The September brief describes free and Pro tiers; this
  is unconfirmed, so no surface may state prices or plan contents.
- Whether drawing and comparing sit behind a free account.

## Brand Commitments

- Personality, in the owner's words: techy, professional and playful, with
  good UI. The site has to sell that.
- It must not read as AI-generated, and it must not read as a research
  publication.
- Name: Plotsights, decided 2026-10-10. PropSights clashed with Propsight
  (FR), PropertyInsights (UK) and LexisNexis Property Insights; RealSights
  (the September brief) is a live US real-estate data company. A plot is the
  land, the shape drawn on the map and the chart, and the word Cypriots use
  for land for sale; it works in Athens too. plotsights.com, .io, .cy,
  .com.cy and .gr are owned. Written as one word, one capital.
- Headline in use: "Plot an area on the map. Get the insights." (2026-10-10,
  written with the new name; the owner asked for plot "as plotting something
  on a map", for "insights" always in with "sights" highlighted, and for
  "emphasis that we daily get short, long and sales data", which the lede
  carries; a longer headline that named the three markets was rejected the
  same day). "Plot" is the verb, what the visitor does on the map, so the
  name is also the product's gesture. It descends from the wording the owner
  approved on 2026-10-09 ("Property data and insights for every street in
  Cyprus.", "its good"), which had replaced "The whole Cyprus property market,
  down to the street." In it "Plot" and "sights" (of "insights") are set in
  the light orange, so the name is read out of the headline in order, a device
  the owner asked for with the old name (2026-10-09). The lede under it states
  the habit, then the gesture and the promise: "Updated every day: every short-let,
  long-let and sale in Cyprus. Draw a line round any streets and see what they
  earn, rent for and sell for." (the owner asked, 2026-10-10, to "show that our
  database is updated daily", and chose this over three other wordings). The
  owner asked for "different fonts for this part" and left the face to the
  designer; a serif (Newsreader) was tried and dropped within the hour ("I
  hate these fonts"), so the sentence stays in Google Sans, a size up, with
  "Updated every day" and the promise picked out in ink. Cyprus is named once, in the lede, so the
  headline stays place-neutral for Athens.
- The landing page opens by asking the visitor for their own place (a search
  box), as most sites in this field do. The ground stays beige on every
  screen; a dark first screen was tried and rejected (2026-10-09).
- The dashboard is called the Playground.
- Palette: off-white (beige), ink, **olive** (#4A5E3A) and a **light orange**
  (#F2A154). Olive does the working jobs (the drawn area, the filled
  action); the light orange marks the listings, the product icons and the
  brand mark. The owner kept the beige and olive after comparing seven
  alternatives (2026-10-08). The accent has changed twice: tangerine was
  replaced by teal on 2026-10-08 ("I dont like the orange colour"), and teal
  was dropped on 2026-10-09 ("It does not look good and professional. We
  could try a light orange with olive kind of thing"); of three
  orange-and-olive renderings of the built page the owner chose the one where
  olive leads.
- Typeface: Google Sans, chosen 2026-10-08 for being clear and UI-friendly.

## Evidence on Hand

- Live listing data in the serving database: about 14.5k short-term rentals,
  10.1k long-term rentals and 29.5k for-sale listings (counts queried
  2026-08-30).
- A worked comparison of two hand-drawn areas, Protaras–Pernera and Coral
  Bay, with real figures (queried 2026-08-30), in
  `docs/design/landing-rework-2026-08/`.
- The real Cyprus map layers and listing positions in the same folder.
- No testimonials, client names, case studies, press or pricing exist yet.
  Do not invent any.

## Product Principles

1. Show the data doing its job; never describe it where it can be shown.
2. Exact numbers over rounded claims.
3. The team is the product as much as the tool: a question asked should feel
   like it reaches people who know the island.
4. Serious about the numbers, light about everything else.
