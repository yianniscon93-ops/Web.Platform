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

- Name: PropSights (app and mockups) or RealSights (September brief). Use
  PropSights until decided.
- Pricing and tiers. The September brief describes free and Pro tiers; this
  is unconfirmed, so no surface may state prices or plan contents.
- Whether drawing and comparing sit behind a free account.

## Brand Commitments

- Personality, in the owner's words: techy, professional and playful, with
  good UI. The site has to sell that.
- It must not read as AI-generated, and it must not read as a research
  publication.
- Headline in use: "The whole Cyprus property market, down to the street."
- The dashboard is called the Playground.
- Palette: off-white (beige), olive and ink, with **teal** (#0E7F7A) as the
  one accent. The owner kept the beige and olive after comparing seven
  alternatives (2026-10-08), then replaced the earlier tangerine accent with
  teal the same day, chosen from five accents rendered on the built page
  ("I dont like the orange colour"; "teal is the way").
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
