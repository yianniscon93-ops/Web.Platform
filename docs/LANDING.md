# Landing page

The first screen says what Plotsights is and asks the visitor for their own
place: a headline, one sentence, a search box, and a picture that moves by
itself, a tour of six drawn town maps with areas drawn on them and what the
short-lets inside come to. The second screen, the stage,
lets the visitor try the mechanism: a map with a hand-drawn area, joined by
thin lines to three product panels made from it. Under it, one card per
product explains each with a working object, all three about the area the
visitor has on the stage's map; the cards stack as the visitor scrolls.
Then "How the numbers are made", and the close. Product facts live in
`/PRODUCT.md`; the page's direction ("Start with your place") is recorded
in `apps/web/.impeccable/surfaces/app-page-tsx.md`. Below, "the hero" means
the stage: its component is still `DrawHero`.

Page order (`apps/web/app/page.tsx`): `Nav`, `LandingHero` (the first
screen), `DrawHero` (the stage, `#draw`), `ProductSections`
(the stack: `#playground`, `#reports`, `#connector`, and `CTASection`,
`#access`, handed in as its last sheet, with `HowSection`, `#how`, before
it), `Footer`.

## The first screen (`LandingHero.tsx`, `PlaceSearch.tsx`, `TownTour.tsx`, styles in `app/landing-hero.css`)

How it got here: five first screens were built and dropped on 2026-10-09
(the last, a flow diagram, with "the hero page is very bad. Research how
others are doing it"). The first screens of 36 sites were then captured, 13
of them in short-let and property data. In that field most headlines
promise a result, about half open on a search box for the customer's own
place, most show real figures or the product, and none shows a diagram. The
owner chose: open on the search box; a headline with "property data and
insights" in it; the calm, warm feel of felt.com with one rich drawn map; a
real town drawn from open data; and a picked place going down to our own
map, not out to the Playground.

Left, from 1024px: the `h1` ("Plot your area. Data and insights for every
street in Cyprus."), one sentence, and `PlaceSearch`. The sentence (2026-10-10,
written with the new name) says how to start and what comes back: "Search a
town or draw a line round a few streets. We read every short-let, long-let
and sale on the island, every day, and show what the streets inside your
line earn, rent for and sell for." It replaced "We analyse prices, bookings,
ratings and locations across the island every day. You see what any street
earns, rents for and sells for." Two beats, how to start and then what the
visitor sees (the owner's brief for it: "analyzing data daily to give you the
analytics outcome"; of this wording, chosen over a one-sentence version
that named "our models": "I think I prefer thus"). Its last clause, what
the visitor sees, is set in ink at weight 500; the rest is the muted
lede. The owner asked for it short and for it to show the depth of the
work (2026-10-09: "we do much more than that. We parse reviews we parse geo
locations, we parse pricing we parse occupancy we create ml algorithms...
something nice, to the point, punchy"), and chose this wording over a
shorter one ("I like this more"). It says "ratings", not "reviews":
review scores and counts are tracked, the reviews' words are not
(docs/POSTGRES.md), and the Connector card says as much. It is set a size
up from the page's other ledes (18px on phones, 20px from 1024px). In the
headline the opening "Plot" and the "sights" of "insights" wear the mark's
light orange (`.lh-name`), so the name is read out of the sentence. The
device was the owner's for the old name (2026-10-09: "make Prop with the
light orange colour and sights the same", when "Prop" came out of
"Property"); with the new name the sentence opens on "Plot your area"
(2026-10-10), so the name reads in the same order and its first word is the
verb for what the visitor does on the map. **The name.** PropSights became Plotsights on 2026-10-10: a web
search found Propsight (a French property-analytics SaaS), PropertyInsights
(UK) and LexisNexis Property Insights already in the family, and RealSights
(the September brief's name) is a live US real-estate data company. After
a long search the owner chose Plotsights, a plot being the land, the shape
drawn on the map and the chart, and the word Cypriots use for land for
sale; plotsights.com, .io, .cy, .com.cy and .gr were bought the same day. The `h1` carries the plain sentence as its
`aria-label`. The light orange is 1.9:1 on the ground, below the 3:1 asked
of large text; it is the owner's choice of colour and the letters are 40px
or more and bold.

The field is glass, the one piece of it on the page (owner, 2026-10-09:
"a nice liquid glass search thing. crystalized"): a clear slab on the
paper, drawn in `landing-hero.css` as the form's `::before` (the slab, its
cut edge, rim and shadow) and `::after` (the light under it). The slab is
a pseudo-element and the form has no `isolation`, on purpose: in Chromium
a `backdrop-filter` or `isolation: isolate` on the form would stop the
list inside it from blurring the page behind. The point where the rim
catches the light is the custom property `--gx`, which `PlaceSearch` sets
from a mouse's position and CSS moves on focus. The list is a frosted sheet
of the same glass. `prefers-reduced-transparency`, no `backdrop-filter`,
forced colours and reduced motion each have their own rules there.

**Glass everywhere (2026-10-09).** The owner then asked to "try glass
everywhere to see how it shows", and of the result said "great I prefer
it". It is one sheet, `app/landing-glass.css`, laid over the components'
own flat styles, every rule of it under the class `th-glassy` on the
page's outer element (`app/page.tsx`): the nav once the page has moved
under it (`data-solid` on the header), the cards on the first screen's
map, the stage map's frame and controls, the three product cards, the
report sheets, the switch, the answer bubbles, the example listing and the
close's email field are frosted glass, and every filled button takes a
line of light. Taking the class off gives the flat page back, with the
search field still glass. Known: three large blurred cards cost more to
draw while scrolling (not measured), and the nav's blur could not be
confirmed at 2x pixel density in the test browser, which draws it at 1x.

`PlaceSearch` is a combobox over `GET /api/dashboard/areas` (the
Playground's own list of places). Focused, it lists the six places with the
most listings; typed into, it matches English and Greek names with accents
ignored and ranks a name that starts with what was typed first. Arrow keys
move, Enter or a press picks. Picking sends `PICK_EVENT` (`compare.ts`)
with the place's id, name, centre and reach, and moves the page to the
stage, which shows that place (see "The stage"). If the list cannot be
fetched the button opens the Playground and the box says so. There are no
example places under the box (owner, 2026-10-09: "remove them from there
and let the map hover ... by itself").

Right, from 1024px, filling 58% of the screen and fading into the paper on
its left and under the nav: the tour (`TownTour.tsx`). Its maps are six
drawings, `public/landing/town-<key>.svg` for Limassol, Nicosia, Paphos,
Ayia Napa, Larnaca and Protaras, in the order the tour visits them (Nicosia
and Ayia Napa were added on 2026-10-09: "also add other towns and areas in
the interaction like nicosia"). They are made by
`scripts/build-hero-town.mjs` from OpenFreeMap z14 vector tiles
(OpenStreetMap data): land, green, sand, sea, piers, buildings and streets
in the page's map colours, with no labels, each 1600 units square.
`src/lib/landing/heroTowns.ts`, written by the same script, holds each
one's projection. The credit is on the page. Rerun the script (from
`apps/web`, Node 23.6+, network) to redraw them; with `NAMES=1` it also
lists each view's named places and streets and where they fall, which is
what the areas below were sited by.

To add a town: add it to `TOWNS` in the script (an inland one has no
`sea` point), rerun it, and give the new key its three areas in `DRAWN`.
The left third of a map fades into the paper and, at 1024px, is cut off,
so areas and cards are kept right of about x 540.

The areas are sited on the live data, where the short-lets are (2026-10-09,
the first run of the page on the live database): each holds at least 36
listings and so has figures to give. Four first drawn on demo data were
replaced that day because the real listings were elsewhere (Limassol's
marina held 2). An area is named after what the product's own list of
places calls its ground (`/api/dashboard/areas`) or, where that list has
nothing so fine, after the OpenStreetMap street or place it covers. On
demo data some of these areas hold nothing and are drawn without a card;
demo mode is a development fallback and is not sited for. Coral Bay was
built and left out when the page still ran on demo data only; it can be
added.

The maps are fetched one stop ahead. The page holds three `<img>`s at
most: the town showing, the one it took over from and the next, which is
fetched (with its listings' dots) while this one plays; the next is not
asked for until the page has hydrated, and never with reduced motion. The
tour does not leave a town until the next map has arrived.

What the tour draws is set by hand in `LandingHero.tsx` (`DRAWN`), in
each map's view units: three areas a few streets wide per town, on built
streets, each with the corner its card is pinned at. On the server each
area's polygon is asked three questions, the ones the stage's table asks,
so a card and the table agree for the same corners: `getStats` (how full
its short-lets have been this season, `effOccTodate`, their median nightly
rate and how many there are), `getRentals` (how many long-lets, and the
median monthly rent) and `getInvest` (how many homes for sale, and the
median asking price). The last two are asked with `{ headline: true }`,
which runs their one aggregate query and leaves out the per-bedroom rows
and the deal lists: the first screen asks about eighteen areas at once.
The owner asked for all three (2026-10-09: "we get only how many
short-term listings are there. we have more data right? dont mislead the
customer"). An area with fewer than five short-lets, or one that cannot be
asked, is drawn without figures; on demo data one listing is enough and the
picture carries the "Demo data" mark. A long-let or for-sale line with
fewer than five listings gives its count and "too few" in place of a
median. Demo data answers those two for the whole island, which is not the
area's answer, so there the card has its short-let line only. The page
sets `revalidate = 3600`.
The shape handed to the client is `TourStop` (`src/lib/landing/tour.ts`).

The tour runs by itself (owner, 2026-10-09). The town the page arrives on is
complete. Then, for each town in turn: its map slides in, its listings
appear as dots west to east, a pointer draws the first area corner by
corner, and when the line closes the area sets: a light tint (12%, lighter
than the stage's, so the streets read through it) and a thin white edge
under the firm 2.5px line come in, the listings inside take their occupancy
shades, and its card is pinned and joined to it by a hairline. It stays
about a second to be read, then the pointer goes on to the next area. After
the third everything holds, then leaves. One clock drives it (a
`requestAnimationFrame` loop in `TownTour`); the canvas dots and the
pointer are placed from it, the corners and the traced line are CSS
animations started with it. The clock waits while the picture is out of
view, the tab is hidden or the visitor is typing in the search box; "Pause
the tour" stops it where it is. With reduced motion the first town stays,
complete, and there is no pause control.

The dots are `/api/dashboard/points` (one fetch, shared with the stage).
Inside an area every listing is a dot while they can be told apart (up to
60, sea or not, since the card counts them); a fuller area is thinned to one
dot per 22-unit cell of the map and at most 160, so it reads as a stipple
and the shades stay visible, while its card still counts them all. Outside
the areas a sample of up to 600 is drawn small and grey, with any that fall
on the drawing's sea left off. This was checked with the demo listings
multiplied fourteen times, not yet on the live database.

A card is a small table: the area's name, then a line to each market
inside it. "Short-let", how many, a night's median price and how full
("58% full"); "Long-let", how many, a month's median rent; "For sale", how
many, the median asking price. Everything is 13px; counts and figures are
ink at weight 600, tabular, the counts ranged right. The dots on the map
are the short-lets only, so the short-let line starts with the mark those
dots wear, in the shade of the area's occupancy, and along the card's foot
the occupancy is drawn again as a bar in that shade. From 1440px the name
is a size larger; between 1024 and 1439px, where three cards share a small
map, the prices go without "a night" and "a month", which the market's name
already says. A card is about 255px by 110px from 1440px and 210px by 103px
below it, and every card's place in `DRAWN` was set for that size. The
town's name is the largest word on the map (17px). The credit row under
the picture carries the pause control, the key ("Short-lets this season:
emptier", four dots, "fuller"; "this season" is left out below 1440px and
the whole key between 1024 and 1279px, where the row has one line's room)
and the map credit. The key says which listings the dots are and that the
figures are this season's.

Below 1024px the picture is a band under the words, 860px or more of map
behind a window, so it shows a few streets at a time: it is centred on the
area being drawn and moves on with the pointer (never so far that the
map's own edge shows), and the town's name is in its corner. Cards are not
pinned on the map there. One card is docked at the band's foot, for the
area the band is on: it comes when that area closes and goes when the band
moves on, so it never speaks for an area out of sight, and that area alone
is tinted (the others keep their line and their listings). An area stays
longer there before the band moves (1.7s against 1.1s), since its card is
only up while it does.

Between 1024 and 1179px, as on a narrow phone, the search button is its
arrow alone, so the field has room for its placeholder.

## The stage (`DrawHero.tsx`, the second screen)

One viewport: a band (an `h2`, "Draw an area. Get it three ways.", and one
sentence), then the stage. Left, a map with a hand-drawn area whose corners
the visitor can move.
Right, three product panels made from that area, at most one open at a time:
Playground, Reports, Connector. From 1024px thin lines run from the area to
each panel's icon.

The stage has one map, the island, which the visitor can zoom and move
(owner, 2026-10-09: "why not use the full map on the second page?", then
"let customer zoom and draw a region and remove the protaras kato pafos on
the upper part"). There is no place switch. `AreaMap` draws it.

- **The ground** is one picture, `public/landing/island.svg`
  (`IslandBasemap.tsx`): the coast, forest, towns, lakes and main roads,
  drawn by `scripts/build-island-map.mjs` from OpenFreeMap z10 tiles in the
  island's own view units, with no boundary lines. It is placed for whatever
  window is shown, and the area's tint goes over it. It has main roads only,
  so at the closest zoom it is coarse.
- **The window** (`StageWindow`, `stageWindow()` in `compare.ts`): how
  far in it is (`ZOOM_LEVELS`: 1, 2, 4, 8; 1 is the whole island) and the
  [lat, lng] at its middle, held to the island. `zoomedView()` in
  `areaView.ts` makes the view the map draws with, which `viewOf` returns
  (`DrawnArea.view`). Plus and minus at the map's top right step it, and
  "Whole island" appears once it is zoomed. Plus keeps the area in sight (it
  centres on the area while the area's middle is in the window); a double
  click or double tap on the ground goes in on that point, which on a touch
  screen is one way to other ground. A drag on the ground moves the map:
  the view is only translated while the drag lasts, and the window is set
  on release. The mouse does this at any zoom. A finger does it once the
  map is zoomed in (`touch-action` is set on the view only then), and so
  does a quick swipe that starts inside the area; at zoom 1 a swipe on the
  map scrolls the page, and the wheel always does. Zooming and moving ask
  the server nothing: the area is kept as [lat, lng] and does not depend on
  the window.
- **The area** opens round Limassol (`ISLAND_AREA`). Whenever the map is
  zoomed in, and whenever the area is out of sight, a button at the map's
  bottom left offers "Draw an area here": a fresh five-cornered area in the
  middle of the window, in place of the one there was. Once moved or redrawn the area is "your area".
  Reset goes back to the map's own area, and to its window when that area
  is out of sight.
- **A picked place**, when the visitor chose one in the first screen's
  search box. `pickedArea()` gives its window (the ground round the place)
  and an area round the place itself: a rough five-cornered ring of the
  place's reach (never under 4 km, so its corners can be held), not its
  boundary. It is named as the place until a corner moves. Until then the
  count says both figures ("499 short-lets inside, of 545 in Paphos"),
  since the list of places counts by the place and the map by the line.
  "Open the Playground" opens that place by its id. Every pick remounts the
  map.
- **Names**: five towns, set offshore, on the whole island; zoomed in, the
  towns in the window at their centres, and a picked place at its own.
- **Sea**: a listing is on land or not by the island's outline, in the whole
  island's units whatever the window, and by a simpler outline than the one
  drawn, so one within about 1.5 km of the coast counts as on land.

In the Playground card's head-to-head, Protaras and Kato Paphos
(`HERO_AREAS`, two areas a few streets wide) are always compared, and the
area on the map joins as the third. Their counts come from their own street
maps (`AreaBasemap`, rendered on the server in `page.tsx`), which
`PlaceCount` mounts out of sight; those maps are no longer shown.

- `DrawHero.tsx` holds the state: the map's own area (Limassol's, or a
  picked place's), the window, the area's corners as [lat, lng], the
  figures, which panel is open. It takes the listings from
  `listingPoints()` (one fetch of `GET /api/dashboard/points`, shared with
  the first screen's tour), fetches `GET /api/dashboard/areas` once, and `POST /api/dashboard/stats`,
  `/rentals` and `/invest` for the area. The first ask after load or a pick
  goes at once; every later one waits 300ms after the release. Only
  the newest ask is ever shown or kept: an overtaken one is aborted and its
  answer dropped. The old figures stay on show, marked pending, until the
  new ones land. Whole answers are kept per polygon, so Reset asks
  nothing twice; an answer with a failed part is shown (that
  column is empty) but not kept, so the shape is asked again next time.
- **One count.** Every count the page quotes (under the map, beside a moving
  corner, the Playground line, the table's short-let cell, the report page,
  the connector's answers, the head to head, the announcement to assistive
  tech) is the listings from `/points` that are on land and inside the
  line, wherever the window is: dots are drawn for the window only, and
  thinned by the grid dedupe and the draw cap, but the count is of all of
  them. For the head to head's two places (`own` in the context),
  `PlaceCount` mounts each one's street map out of sight once and counts the
  same way. Occupancy, nightly rate and the weekly series come
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
- Dots are thinned by what the screen can show (`spaced` in `AreaMap.tsx`),
  none in the sea, none under a place name, in two sets chosen once per
  window and size of map. The first is spaced by an inside dot's width
  (`DOT_SPACING`, 0.9 of it), so inside the line a dense town reads as beads
  side by side, each with its ring and its shade, and not as a blot; these
  only change sides while the area is redrawn. The second fills in between
  them, spaced by an outside dot's smaller width (`FINE_SPACING`), and shows
  outside the line only, so a town the area does not hold still reads as a
  town. The count is never thinned, and the line under the map says why the
  two differ ("Where listings crowd together, one dot stands for several.").
  The Connector's small map is sent the
  first set, and thins it again when it shows the area in a wider window.
- Until a corner (or the area) is first touched, one corner (the area's
  `cue`) pulses and carries the invitation: "Drag a corner, or the whole
  area", or on a touch screen "Drag a corner, or hold the area to move it".
  Both wordings are in the markup and a `pointer: coarse` media query shows
  one, so server and browser render the same thing. With reduced motion the
  corner is filled instead of pulsing. Where the words go is worked out in
  CSS from the corner's place in the view (`.th-cue-label` in
  `globals.css`). They wrap to two or three lines in a narrow frame. That label
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
  header opens its panel on click, Enter or Space, not on focus, and closes
  the one that was open. Pressed again it closes its own, so all three can
  be shut (owner, 2026-10-09: "the arrows of the 3 product do not close and
  open as expected"; an open panel could not be closed before). The
  header's button covers the whole header row and lies over the chevron,
  which is turned when its panel is open and would otherwise take the press.
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
- **The two street maps.** Protaras and Kato Paphos were the stage's maps
  before the island and are now only mounted out of sight, for the head to
  head's counts; the next two points are about them. Each (sea, shoreline,
  roads, up to three place names) is committed data in
  `src/lib/landing/areaBasemaps.ts`, generated from OpenFreeMap vector
  tiles (OpenMapTiles schema, OpenStreetMap data) by
  `node scripts/build-landing-maps.mjs` (run from `apps/web`). The page
  requests no tiles and loads no map library. `AreaBasemap.tsx` is a server
  component passed into `DrawHero` from `app/page.tsx`, so the path data is
  in the HTML and not in the client bundle.
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

## How the numbers are made (`HowSection.tsx`, styles in `app/landing-how.css`)

After the product cards and before the close, coming up over the cards as
the close does (`#how`). The owner's idea for the flow diagram that was
tried as a first screen: "a better more techy diagram for how we do it and
what we do". One listing is followed along a line with five stops, each
showing the listing as it is at that point:

1. *It is published*: an example listing as its site shows it (marked as an
   example), and what the two sources hold today (`getStats`, `getRentals`,
   `getInvest` with no area).
2. *We read it, every day*: a month of its calendar, a square a night,
   booked, blocked by the owner, or free; and the time of the last sync
   (`getSummary().lastRunAt`; left out on demo data).
3. *We put it on the map*: its dot inside three nested areas.
4. *We measure it*: what its calendar shows taken against what was really
   booked (the two bars and the nights printed beside them are worked out
   from the month in stop 2), and the matching of homes for sale with nearby
   short-lets.
5. *It reaches you, three ways*: the line turns down and forks to the three
   products, as the stage's line does; each is linked to its card.

The calendar and the listing are illustrations; the sentences describe what
the data layer does (effective against raw occupancy, the area columns, the
comp-matched yields; see `docs/POSTGRES.md`). Change them only with the
data team. From 1100px the stops run left to right; below it, down a rail.

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
turned over: paper on ink). The palette is beige, ink, olive and a light
orange. Olive (`--th-a`, `--th-action`, with white on it for the filled
button) is the drawn area, its line to the open panel and the page's filled
action: "Show me" in the first screen's search field, and "Open the
Playground, it's free" (stage panel, Playground card). The nav's "Open the Playground", "Ask for a report" and
"Ask for access" are ink. The light orange is what is counted and what is ours:
the brand mark and the product icons (`--th-mark`), the
four shades of "how full" (`--th-occ-1` to `--th-occ-4`, with a darker ring;
the "how the numbers are made" calendar uses the third) and, as a light tint, the Connector card's ground. The land inside the area is
tinted at 22% (`--th-area-tint`).

## Open

- **Not yet seen on live data.** Nothing here adds a query (the first
  screen and the picked place use the stage's own three endpoints with a
  polygon), but none of today's screens has been run against the live
  database.
- The demo listings now gather round each place's centre instead of
  filling a rectangle (`scatter` in `demoData.ts`), so demo counts differ
  from earlier screenshots.
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
