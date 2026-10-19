# Solutions page (`/solutions`)

Everything Plotsights offers, in depth (owner, 2026-10-19: "explore more about available solutions", a page of its
own, linked from the bar and from the landing's products band). Blue Night, as DESIGN.md records it.

Files: `apps/web/app/solutions/page.tsx` (server; metadata; reads `getIsland` and `getCoverage`),
`app/solutions/solutions.css`, `src/components/solutions/content.ts` (every word of the four solutions, the roles and
the models), `SolutionsBar.tsx` (the page's own bar), `Working.tsx` (the landing's working things, imported). Surface
brief: `apps/web/.impeccable/surfaces/app-solutions-page-tsx.md`.

## Order and grounds

1. **Night card**: "Solutions", "Four solutions. One dataset.", who it is for, the four as an index in large thin type
   (each a link down, said as what you do with it), the database's counts ("Sample data" on demo data).
2. **The page's bar** (sticky under the site's bar, from the hero's foot to the data's): Playground, Reports,
   Connector, Custom solutions, The data. Lights the band across the window's middle; white glass once it floats.
3. **Who it is for** (ice): investors, hosts and managers, agents and advisers, each with the two solutions that fit.
4. **One band per solution** (`#playground` night, `#reports` ice, `#connector` night, `#custom` ice): eyebrow (how
   you get it), name and claim, what it is, its action, who it is for, what is inside; beside them its working thing and
   the questions it answers.
5. **The data** (`#data`, white, the only white section): sources and cadence as a table, what the models add, the
   island at night with every short-let a light.
6. **Close** (night): the landing's `CTASection` ("Email the team") and `Footer`.

Every address lands with its band just under the two bars (`scroll-margin-top`), and a page opened on one is put back
in place when the Playground's curve, read after load, grows the band above it (`SolutionsBar.tsx`).

## Claims and where they come from

| Claim | Source |
|---|---|
| Search in English or Greek; draw an area | `components/dashboard/SearchBar.tsx` (nameEn, nameEl, aliases), `DashboardClient.tsx` "Draw area", `MarketMap.tsx` |
| Compare up to three | `components/dashboard/compare.tsx` `MAX_SLOTS = 3` |
| Filters: bedrooms, type, rate, rating, beach, 22 amenities | `lib/dashboard/filters.ts`, `FilterPanel.tsx` |
| Map of every short-let by occupancy, season or next 60 days | `MarketMap.tsx`, `DashboardClient.tsx` ("Map: season", "Map: next 60d") |
| Market overview, Pricing, Booking pace, Buy & Rent, Revenue calculator, and what each shows | `MarketTab.tsx`, `PricingTab.tsx`, `PaceTab.tsx`, `BuyRentTab.tsx` (deal screener, tipping point), `CalculatorTab.tsx` |
| "Free to explore" | the landing's wording (`products.ts`); `/dashboard` has no login |
| Report kinds: property (nine sections), area (four); key findings; web page, prints to PDF | `landing/ReportsSection.tsx`; Data.Insights report templates |
| Connector: English or Greek, area summaries, monthly trends, comparables, sale and rent signals, one ad's history, maps; firmness and date on every answer; says when it cannot answer; access set up by the team | Data.Insights `insights/tools/*.py`, `insights/mcp_server.py`, `docs/mcp.md` (invite-only) |
| Custom: analyses, datasets and exports, feeds; land for sale tracked weekly, not in the Playground | owner (2026-10-18); `CustomSection.tsx` examples; Data.Property `run_land.py` |
| Calendars every 2 days; prices, rent and sale ads weekly | Data.STR and Data.Property reference crontabs (as the landing's "Last read") |
| Booked vs blocked; three prices per home from comparables within 2 km; tipping point; on the books | `docs/POSTGRES.md`, Core.Noesis serving (`classifieds.py`), `marketData.ts` |

Not claimed, because the code does not back it: a radius or locate control, shareable or synced links, exports from the
Playground, plots in the Playground, the Connector's map links (built; not deployed, `docs/MAP_LINKS.md`), a bedrooms
filter in the Connector (so the landing chat's "2+ bedroom rates" chip is left out here, `without` prop). No prices,
clients, turnaround times, accuracy figures, "daily" or "real-time".

## The site's bar

"Solutions" joins the bar and takes the place of "Reports" and "Connector" there: a fifth link did not fit beside the
pill at 768 to 1023px (825px needed) nor beside the tagline from 1280px (1,291px). The phone menu keeps both, with their
icons. "How it works" goes to `/#how` from other pages; the wordmark goes home. The bar turns to day under any night card
marked `data-nav-night`, as it does under the landing's hero.
