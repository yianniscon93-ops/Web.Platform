# Landing page

The landing hero says what the three products are and lets the visitor try
the mechanism behind them. Under it, one card per product explains each with
a working object, all three about the area the visitor has on the hero's
map; the cards stack as the visitor scrolls. Product facts live in
`/PRODUCT.md`; the page's direction ("Draw it, get it three ways") is
recorded in `apps/web/.impeccable/surfaces/app-page-tsx.md`.

Page order (`apps/web/app/page.tsx`): `Nav`, `DrawHero`, `ProductSections`
(the stack: `#playground`, `#reports`, `#connector`, and `CTASection`,
`#access`, handed in as its last sheet), `Footer`.

## Hero (`apps/web/src/components/landing/`)

One viewport: a band (headline, one sentence), then the stage. Left, a street
map of one place with a hand-drawn area whose corners the visitor can move.
Right, three product panels made from that area, one open at a time:
Playground, Reports, Connector. From 1024px thin lines run from the area to
each panel's icon.

- `DrawHero.tsx` holds the state: which place (`HERO_AREAS` in
  `src/lib/landing/compare.ts`), the area's corners, the figures, which panel
  is open. It fetches `GET /api/dashboard/points` and
  `GET /api/dashboard/areas` once, and `POST /api/dashboard/stats`,
  `/rentals` and `/invest` for the area. The first ask after load or a place
  switch goes at once; every later one waits 300ms after the release. Only
  the newest ask is ever shown or kept: an overtaken one is aborted and its
  answer dropped. The old figures stay on show, marked pending, until the
  new ones land. Whole answers are kept per polygon, so Reset and switching
  place ask nothing twice; an answer with a failed part is shown (that
  column is empty) but not kept, so the shape is asked again next time.
- **One count.** Every count the page quotes (under the map, beside a moving
  corner, the Playground line, the table's short-let cell, the report page,
  the connector's answers, the head to head, the announcement to assistive
  tech) is the listings from `/points` that are on land and inside the
  line: what the map shows as inside, before the grid dedupe and the draw
  cap thin what is painted. The hero keeps that count for each place's own
  area whichever place is on the map (`own` in the context): for the place
  not on show, `PlaceCount` mounts its street map out of sight once and
  counts the same way. Occupancy, nightly rate and the weekly series come
  from `/stats`. In demo data `/stats` also counts listings that fall in the
  sea, so its `listingCount` can be higher than the count shown; it is used
  only if `/points` failed.
- **One occupancy, with its period.** The figure for how full an area is
  is `/stats` `effOccTodate`: nights really booked from the season's fixed
  start (1 April) to yesterday (`docs/DATA_ENGINEERING.md`, "Occupancy
  model"), which the Playground labels "season to date". Every sentence and
  cell that states an area's level uses that figure and says "this season"
  (`SEASON` in `areaLines.ts`); any other occupancy on the page names its
  own period ("75% week of 5 Oct", "July was the fullest").
- `AreaMap.tsx` is the map. The square handles are buttons: drag them
  (pointer capture, `touch-action: none` on the handles only) or move them
  with the arrow keys (10 view units, 40 with Shift). While a corner moves
  nothing re-renders: the outline, the handles, the dots, the count under
  the map and the chip beside the corner are redrawn from the pointer once
  per animation frame, the dots on one `<canvas>`; text elsewhere that
  describes the area steps back until release. A move that would make the
  area cross or touch itself, or put a corner off the visible map, is
  refused (`isSimple` in `polygon.ts`).
- **The whole area moves too.** A drag that starts inside the area (cursor
  `move`) moves all five corners together, held so that none leaves the
  visible map. After the corners in tab order comes one more control, "The
  whole area. Arrow keys move it.", whose focus shows as an ink ring on the
  outline. Pressing Reset moves the keyboard to that control (the button
  itself goes with the reset). On a touch screen a finger has to rest on the area for about
  300ms before it takes it (the area deepens and its line thickens to say
  so), so a swipe that starts on the area still scrolls the page; once
  taken, the finger's moves do not scroll (a non-passive `touchmove`
  listener). A whole-area move behaves as a corner's does: the live count
  and chip, one set of requests on release, the pending state, Reset.
- **One drag at a time.** A drag belongs to the pointer that started it
  (`Drag.id`): a second finger landing on a corner while the area or another
  corner is in the hand is ignored, and no other pointer's events move or
  end the drag. Every end of a drag goes through `letGo`, which also clears
  the held state and lets a finger scroll the page again.
- **The chip keeps off the place names.** The count beside the moving
  corner sits above it (below it near the map's top). Where that would put
  it on a place name it goes to the other side of the hand, if that side is
  on the map and clear of the names.
- **Shades and pops.** A listing inside the line is shaded by how full it
  has been this season (its `effOccTodate`), in four steps of the accent
  (`--th-occ-1` to `--th-occ-4`: under 60%, 60 to 70, 70 to 80, 80 and
  over; `OCC_STEPS` in `AreaMap.tsx`), from nearly white to the accent
  darkened with ink. Every inside dot wears a thin ring of the darkest step
  (`--th-occ-ring`), which is what makes a pale one legible: the ring is
  8.1:1 on plain land, 5.3:1 on the tinted land and 5.7:1 on the sea. A
  listing with no figure stays ink, and outside dots stay small and grey.
  The map's bar carries the key in the same marks: four ringed dots between
  the words "emptier" and "fuller". The Connector's small map draws them the
  same way. A dot the line crosses pops between its two looks over 250ms
  (with a brief ring on the way in); only those dots are drawn one by one,
  and the canvas loop stops when none is left. No pops under reduced
  motion.
- Dots: one per 2-unit grid cell, none in the sea, none under a place name.
  The set is chosen once per place against the area as first drawn (up to
  600 inside it, an even sample of up to 700 outside) and then only changes
  sides, so nothing appears or vanishes under the visitor's hand. With dense
  live data, ground the visitor newly encloses shows the sampled density.
- Until a corner (or the area) is first touched, one corner per place
  (`cue` in `HERO_AREAS`) pulses and carries the invitation: "Drag a corner,
  or the whole area", or on a touch screen "Drag a corner, or hold the area
  to move it". Both wordings are in the markup and a `pointer: coarse` media
  query shows one, so server and browser render the same thing. With reduced
  motion the corner is filled instead of pulsing. Where the words go is
  worked out in CSS from the corner's place in the view (`.th-cue-label` in
  `globals.css`): to the right of Protaras's top corner, level with it and
  dropped under the place switch where a short window crops the view that
  far; under Kato Paphos's bottom corner, running left and stopping short of
  the locator. They wrap to two or three lines in a narrow frame. That label
  is the only invitation: the bar under the map carries the count, the key
  and, once the area has changed, Reset.
- `ProductPanels.tsx` builds every line from what the page has
  (`src/lib/landing/areaLines.ts`); a missing figure shortens a sentence or
  leaves an en dash, it is never filled in, and nothing gives a cause. A
  panel's header line is hidden while the panel is open. The report page and
  the connector exchange are illustrations made from live numbers and say so
  ("Sample page. Real reports are written by the team.", "Example answer").
  The sample page shows estimated revenue per listing by month as labelled
  bars (`revenueByMonth` in `areaLines.ts`: for each full calendar month of
  `stats.weekly`, the mean of weekly nightly rate × weekly occupancy, × the
  days in the month; a month counts as full with four or more weeks that
  carry the figures the estimate uses, so one figured week is never scaled
  up to a month; quoted to the nearest €10) and a two-sentence reading of the
  highest and the lowest month. Where the weekly figures carry no rate it
  falls back to occupancy by week (`OccupancyChart.tsx`) and says so. A
  header opens its panel on click, Enter or Space, not on focus.
- **What each column covers.** `/stats` is filtered by the polygon in live
  and in demo mode. `/rentals` and `/invest` are filtered by the polygon in
  live mode only: their demo fallbacks (`demoRentals`, `demoInvest` in
  `marketData.ts`) take no polygon and return one island-wide figure. The
  table therefore heads a column "inside the line" only when that answer's
  `source` is `"live"`, and "all of Cyprus" otherwise; such a column is not
  refetched or marked pending when the area moves. The table carries a "Demo
  data" mark at its left foot when any of its three answers is demo. If a
  demo fallback ever becomes polygon-aware, change `scoped()` in
  `ProductPanels.tsx`.
- Actions. The one filled button, "Open the Playground, it's free", links to
  `/dashboard?area=<id>` when `/api/dashboard/areas` has an area named like
  the place (see `MAP_LINKS.md`), else to `/dashboard`; a hand-drawn shape
  cannot be passed to the Playground yet. From 640px it is in the Playground
  panel; on phones it sits under the sentence. Each open panel also has a
  "Find out more about …" text link with a down arrow to `#playground`,
  `#reports` or `#connector`, the product cards. In the Playground panel the
  link shares a row with the button; from 1024px the column has no room for
  both in full, so there the link shows as "Find out more" and keeps the
  rest of its name for assistive tech (below 1280px it wraps under the
  button). The nav's "Reports" and "Connector" go to the same anchors.
- Until the visitor moves a corner the area is named for its place; after
  that it is "your area near <place>" wherever it is named ("my area near
  <place>" inside the visitor's own question).
- The basemap (sea, shoreline, roads, up to three place names per place) is
  committed data in `src/lib/landing/areaBasemaps.ts`, generated from
  OpenFreeMap vector tiles (OpenMapTiles schema, OpenStreetMap data) by
  `node scripts/build-landing-maps.mjs` (run from `apps/web`). The page
  requests no tiles and loads no map library. `AreaBasemap.tsx` is a server
  component passed into `DrawHero` from `app/page.tsx`, so the path data is
  in the HTML and not in the client bundle, and the map is there before any
  API answers. The drawn area's fill sits under the basemap's sea, which
  keeps it to the land.
- Place names are never invented: the generator takes the locality the area
  is named for, a name from the tiles' `water_name` layer where the whole
  word fits over water, then the biggest other places, and records each
  one's tile layer and field in `source`. A name is kept only where it is
  clear of the area's outline as first drawn, its handles, the line to the
  panels, the place switch, the locator and the invitation beside the
  inviting corner in every frame the map is shown in. Those frames are the
  `FRAMES` table in the script, measured on the built page, the
  invitation's box included (both wordings together, per place and frame);
  remeasure and rerun the script after changing `HERO_AREAS`, `areaView.ts`,
  the invitation or the map's layout in `globals.css`. Today:
  Protaras, Kapparis; Kato Paphos, Paphos, Geroskipou (no bay name fits
  beside the on-map switch at phone size). Once the visitor drags the
  outline it may cross a name.
- On first load, once, the area draws itself (handles, outline, listings,
  count, then the lines to the panels) over about two seconds; the nav,
  basemap, headline and panels are never hidden for it. With reduced motion
  everything is in its final state. A visitor who acts sooner ends it (and
  the count's tick) at once. After that nothing moves unless the visitor
  moves it; an icon makes one small move when its panel is opened.
- From 1024px the stage is one viewport tall (700 to 860px). Should an open
  panel need more than that leaves, the stage grows instead of overflowing.
- Accepted cost: the path data reaches the browser twice, in the
  server-rendered markup and in the RSC payload, and the payload carries both
  places. The data file is 61,146 bytes. The Connector card's small map
  takes the same two elements from `app/page.tsx`.
  Credit shown: "Map data © OpenStreetMap contributors, © OpenMapTiles".
- The three product icons (`ProductIcons.tsx`) are drawn in the brand mark's
  vocabulary and reused at 32px in the cards' header rows and 24px in the
  phone menu. What is written on the report icon's sheet is drawn in white:
  ink lines on the accent go muddy at small sizes.
- Type is Google Sans (OFL), self-hosted from `public/fonts/google-sans/`
  (Latin, Latin Extended, Greek) with `@font-face` rules in `globals.css`;
  `app/page.tsx` preloads the Latin file.

## Product cards (`ProductSections.tsx`, styles in `app/landing-sections.css`)

Above the stack, one line says whose area the cards are about: "Everything
below is about Protaras, the area on the map above: 24 short-lets inside."
at rest, "Everything below is about your area near Protaras: 27 short-lets
inside." once a corner has moved ("the area you drew" is said only then,
here and in the cards' notes).

### The stack

Three cards, then the close. A card (`Card` in `SectionParts.tsx`) is a
rounded surface (26px) with a hairline, in its own ground: Playground on
the plain surface, Reports on the olive tint, Connector on a light tint of
the accent (`--th-card-playground`, `--th-card-reports`,
`--th-card-connector`). Its header row is exactly 56px: the icon at 32px,
the name (the `h2`, the section-heading size × 0.7, and a link to the
card), and at the far right the card's one action. Under it: the sentence,
the working object, the product's statements as plain lines, and a line on
what the object is. Nothing boxed sits on a card except the report's sheet
of paper.

- **Pinning.** `ProductSections` measures, on load, on resize and whenever a
  card's content changes height (a `ResizeObserver`; nothing runs on
  scroll): the window is at least 1024px wide and every card's own height
  (`.ps-card-in`) fits the room a pinned card has (window height − 80 − 16,
  less 56 per card above it when the header rows are kept in view; a pixel
  of give, for browser zoom). If so the stack gets `data-pin`: each card is
  `position: sticky` at 80px (the 72px nav plus 8), fills that room
  (`min-height`), and the next slides up over it. From 880px of window
  height it also gets `data-tabs`: each card pins 56px lower than the one
  before, so the covered cards' header rows stay in view like the tabs of a
  stack of folders; a covered card's action steps out of its row
  (`data-covered`, set by an `IntersectionObserver` on the next card's
  resting place, made again whenever the window's height changes). If any
  card does not fit, no card pins and they follow one another.
- **Short windows.** The cards pin down to 1280×720 and 1366×650. Under 780px
  of window height, and again under 700px, the cards' paddings, gaps, table
  rows and chart heights close up (`landing-sections.css`, the two
  `max-height` blocks); nothing is left out and no type goes below the
  scale. From 1024px the Connector's questions are set a size down (16px,
  15px in a short window; 17px only from 1280×880), so seven of them fit
  beside the conversation, with a redrawn area's longer wording too. Not
  pinned, the report's sheet keeps one height from page to page, capped at
  the height it would have in a pinned card so the sheet itself never stops
  the cards pinning. FIT_TABLE
- **The close is the last sheet.** `CTASection` is passed into the stack so
  the pinned cards and the close share one containing block: the ink band
  comes up over the pinned stack.
- **Recede.** As the next card (or the close) comes over, the covered card's
  body scales to 0.97 from its top and takes a 6% veil of ink: a CSS
  scroll-driven animation on the next card's view timeline (`@supports
  (animation-timeline: view())`, not under reduced motion). The header row
  does neither: stacked, it is what still shows of the card and it is a
  working link, so it stays crisp. Without support the stack works the same
  with no recede.
- **Links.** A pinned card reports where it is stuck, not where it lives, so
  links to `#playground`, `#reports` and `#connector` (the nav, the hero, a
  card's own name) are caught and scrolled to the card's place in the stack
  with its pin offset; so are the address on load and back/forward.
  Keyboard focus that lands in a card another card is over (even half over
  the focused control) brings that card to the top. DOM order is reading
  order and nothing is hidden or inert for being covered. The conversation
  in the Connector card scrolls in its own frame but does not hold the
  wheel: at either end the page takes it.
- **Narrow or short.** Under 1024px, or where a card does not fit, cards do
  not pin: each is still a rounded coloured surface and (under 1024px)
  carries its action at its foot, not in its header. A card has no entrance
  of its own, pinned or not: it is fully there before its arrival moment
  and without it.

### Arrival

The first time 40% of a card is in view (`useArrival`) its contents play one
short moment, then never again; everything is in its final state before it
and without it (nothing waits at opacity 0 for an observer) and nothing
plays under reduced motion. `data-arrived` stays on the card;
`data-arriving` is on for 1.8s.

- Playground: the two chart lines draw from the left (0.9s), their end
  nodes pop, the selected tab's underline slides in, and the head to head's
  second place joins (its column slides in from the right and settles,
  0.7s). No figure counts up: every one shows its true value throughout.
  Opening a tab afterwards draws its chart in 0.4s.
- Reports: the sheet is dealt onto the card from the right with a slight
  turn (0.5s) and the rail's corners tick down one by one. Leafing turns
  the page: the content leaves to one side and the next comes in from the
  other (0.25s each way, reversed going back).
- Connector: the first question is typed into the composer at the foot of
  the conversation (30ms a character, 1.2s at most), goes up as the
  visitor's bubble, the typing indicator shows, the answer arrives. Every
  question chosen later is asked the same way. The composer is a display
  (`aria-hidden`, no caret at rest): the question list is the control.
- The card's icon makes its one small move.

### What the cards share

- **The area travels down the page.** `src/lib/landing/areaContext.tsx`:
  `HeroAreaProvider` wraps the page, `DrawHero` publishes its place, polygon,
  name, count, each place's own count, the dots inside the line, figures,
  `pending`, status and Playground link in one effect (`usePublishHeroArea`;
  publishing does not re-render the hero), and the cards read them with
  `useHeroArea`. Every count the cards quote is the hero's "one count",
  never `/stats.listingCount` (which stands in only if `/points` failed).
  While the hero's figures are pending the cards keep the old values in the
  pending tone with `aria-busy`.
- **What the cards fetch themselves** (`useAreaAnswer.ts`): only what the
  hero does not have, and only while the view that shows it is selected and
  within 320px of the viewport: `POST /api/dashboard/pricing` (Playground,
  Pricing), `/pace` (Booking pace), `/stats` with `filters: { minBeds: 2 }`
  (Connector, the bedrooms question) and `/stats` for the other place's own
  area (the head to head). Like the hero's: 300ms after the area changes,
  kept per polygon, an overtaken ask aborted and dropped, a failed one
  neither shown nor kept.
- **What each figure covers.** `/stats` and `/pricing` are filtered by the
  polygon in live and in demo mode. `/rentals`, `/invest` and `/pace` are not
  in demo mode (`demoRentals`, `demoInvest`, `demoPace` take no polygon), so
  a demo answer from them is marked "all of Cyprus" and is not asked for
  again when the area moves; the pace chart also prints the API's own
  `scope`. A block whose answer is demo data carries a "Demo data" mark. If
  a demo fallback becomes polygon-aware, change `inside()` in
  `SectionParts.tsx` and the hook's `demoScoped` argument.

### The three cards

- **Playground** (`PlaygroundSection.tsx`). "Head to head" above the tabs,
  as the Playground's compared areas sit above its own: the two places side
  by side and, once the visitor has redrawn the area, that area as the
  third (three is the most the Playground compares). Title and row names
  are the Playground's own for this matrix (`CompareMarket` in
  `components/dashboard/MarketTab.tsx`: "Head to head", "Listings tracked",
  "Occupancy", "Median nightly rate"); the leading figure of each row is in
  ink at 600, the others a step back. A place's occupancy and rate are its
  `/stats` answer for its area as first drawn: the hero's own answer for the
  place on the map, and one request, kept, for the other; a drag asks
  nothing here. Then the Playground's five tabs as a real tablist, each a
  preview under the Playground's own chart titles: weekly occupancy and
  median rate (the hero's `stats.weekly`), the forward price curve, lead
  time by stay month, asking price beside rent by bedrooms, and a
  two-slider revenue sum (rate × 365 × occupancy, starting from the area's
  medians; the visitor's rate is kept inside the area's scale, so the slider
  and the sum agree after a place switch). Charts are `SeriesChart.tsx`.
  Its button is the page's second and last accent fill.
- **Reports** (`ReportsSection.tsx`). A sheet to leaf through, for a
  property or for an area, with the reports' real section titles as its
  contents (a rail from 1024px, a select below; in the rail a title's bold
  setting is always there unseen, so choosing a section never moves the
  others, and a hyphen in a title does not break). The sheet has a running
  head (the report's title, "3 of 9") and a footer line ("Opens as a web
  page. Prints to PDF."). Every page has a body: where the visitor's area
  has real figures, a sample block (key figures, estimated revenue by
  month, three listings, asking price and rent); where it has none, the
  list of what the section contains. "Key figures at a glance" describes the
  page as the team writes it (four figures) and labels its sample as what
  this area has today ("From this area today: occupancy and nightly rate."). The property report's five analysis
  sections each end in a "Key finding" slot: filled where the page's figures
  support one (the year's revenue, in the hero's own two sentences),
  otherwise drawn empty ("Key finding: written by the team for your
  property"). No placeholder chart or invented number. The pager's buttons
  are `aria-disabled` at either end, not `disabled`, so focus is never
  dropped. "Ask for a report" carries `A report on <name>` to the form.
- **Connector** (`ConnectorSection.tsx`). Seven questions and the
  conversation they build: each one chosen is added under the earlier ones
  (the log scrolls to it; one already asked goes back to its exchange;
  "Clear" returns to the first). Every answer has the connector's own
  shape (`sectionLines.ts`): what it found, one sentence on how firm that is
  from the listing count ("Firm: it rests on 24 listings.", "Thin: only 3
  listings, so treat it as a rough guide."; an answer that quotes no figure
  because the listings are too few, or states an exact count, says "Thin:
  only 3 listings."; an answer with enough listings but no figure to state
  has no firmness line), and the as-of date where the data carries one. The
  short-let answers and the map answer take theirs from `/stats`' weekly
  series. The for-sale data (`/api/dashboard/invest`, `InvestStats`) carries
  no date at all, so the price-signals answer has none, and the card's
  statement reads "Says how firm each answer is, and the date where the data
  has one." With fewer than five homes for sale the price-signals answer
  quotes no figure. The demo price-signals answer names the island-wide set
  it rests on. "Show me on the map" answers with `AreaMiniMap.tsx` as a
  message of its own: the hero's server-rendered basemap with the area's
  outline and the listings inside it, in the hero's shades. The sixth
  question is the first again in Greek (`greekQuestion`, `greekReply`,
  `inGreek` in `compare.ts`; **the Greek strings are to be proofread by the
  owner**), set with `lang="el"`. The seventh, "What do guests say in their
  reviews here?" (source note "not covered"), is one the connector has no
  tool for: its answer says so and carries no firmness or date line
  (`REVIEWS_REPLY`). The conversation is not a live region: one
  `role="status"` line announces the answer, once per choice, and only
  while the card is near the viewport; a change of area is announced by the
  hero alone. "Ask for access" carries `Access to the Claude connector` to
  the form.
- On one column, choosing a question brings the composer and then the new
  exchange into view, and "Ask another question" under the conversation
  goes back up to the list.

## The close (`CTASection.tsx`, `Footer.tsx`)

"Ask the team." on ink, with the footer, in the same face and sizes. Over
the email field stands the brand's drawn area with its square corners,
quietly outlined, a line joining it to the field. A carried request ("Your
request: …", `sessionStorage` key `ps-question`, event `ps:question`, both
exported from `compare.ts`) is shown beside the area, fills the area in,
and is named in the heading ("Ask the team for a report on Protaras."). The
form still only simulates sending.

## Palette

Every landing colour is a role-named `--th-*` custom property. The hero's
roles are defined once in the "Landing (nav and hero)" block of
`app/globals.css`; `tokens.ts` exports the roles components need as
`var(--th-…)` strings. `app/landing-sections.css` adds the roles the hero has
no job for: `--th-heading` (the section-heading size, the one addition to
the hero's six type sizes), the three card grounds, `--th-edge` (a control's
outline, a slider's empty track) and the close's `--th-close-*` (the palette
turned over: paper on ink). The palette is beige, olive and one accent,
teal (`--th-a`, `--th-action`, with white on it for the filled button). The
accent is the drawn area, the brand mark and the two "Open the Playground"
buttons (hero and Playground card); the four shades of "how full" and the
Connector card's ground are mixed from it. The land inside the area is
tinted at 30% (`--th-area-tint`).

## Open

- **No inbox.** The two requests on the page ("Ask for a report", "Ask for
  access") only carry a line to the form, and that form still only
  simulates sending, though it now says "Thanks. We will write back."
  Nothing reaches the team until a real route exists.
- A hand-drawn shape cannot be passed to the Playground, so "Open it in the
  Playground" in the Connector's map answer opens the named place and says
  so once the visitor has redrawn the area.
- In demo data `/stats` counts listings the map leaves out (those in the
  sea). The bedrooms answer's count can only come from `/stats`, so it is
  quoted (in the answer and in its firmness line) only when it does not
  exceed the page's own count; otherwise the same is said without the
  number.
- The Greek question and answer are to be proofread by the owner.
- The covered card's recede needs CSS scroll-driven animations; browsers
  without them get the stack with no recede.
- `CredibilityStrip.tsx`, `ProductTabs.tsx`, `SplitHero.tsx` and
  `HeroSequence.tsx` are no longer mounted; their files are kept until the
  new page is accepted.
