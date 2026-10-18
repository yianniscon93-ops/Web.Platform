# Landing page

The first screen says what Plotsights is and asks the visitor for their own
place: a headline, one sentence, a search box, and a picture that moves by
itself, a tour of six drawn town maps with areas drawn on them and what the
short-lets inside come to. The second screen, the stage,
lets the visitor try the mechanism: a map with a hand-drawn area, down to
street level in the six toured towns, and beside it what the area holds. The stage is no
longer mounted (2026-10-13): under the first screen, one panel per product
explains each with one working object, all three about the whole island, one
after another (since 2026-10-14 they no longer stack).
Then "How the numbers are made", and the close. Product facts live in
`/PRODUCT.md`; the page's direction ("Start with your place") is recorded
in `apps/web/.impeccable/surfaces/app-page-tsx.md`. Below, "the hero" means
the stage: its component is still `DrawHero`.

**2026-10-17, plan 3 build (owner: "Yes I like it", with changes).** The
plan (https://claude.ai/artifact/8ujmJHBF5LTs7yaWUWs3QT) is built, with the
owner's answers. What changed, in brief (DESIGN.md has the system):

- **Order and grounds.** Hero (night card) → "How it works" / "Backed by
  data" (`HowSection.tsx`, ice band) → the products' tiles
  (`ProductsOverview.tsx`, white) → Playground (night band) → Reports (ice
  band) → Connector (night band) → Questions (`QuestionsSection.tsx`, white)
  → close (night card). Bands are `.bn-band` in `landing-sections.css`,
  inset like the hero; "too much white" was the owner's note, so white is
  only the tiles and the questions. Night after the night hero merged into
  one slab in an A/B screenshot, so the band after it is ice. The nav's links
  follow the page ("How it works" first).
- **Headline A**: "Plot your next move / in Cyprus property. / Insights
  backed by data.", sized by its longest line (the column over 10.85). The
  headline is mist but for "Plot" and "sights" in ink, so the name is read
  out of it. The **opening** strikes the name in two: "Pl·t" with the plot
  drawn as its "o", then "sights" coming into focus in mist; it turns to ink
  as it rises to the nav (`Opening.tsx`, `.op-sights` in `landing-hero.css`).
  Eyebrow "Cyprus property intelligence"; sentence "We track short-lets,
  long-lets, homes and plots for sale across Cyprus, and model what any
  street earns, rents for and sells for."; counts line "Backed by …" and
  "Short-let calendars last read …" (live only).
- **The method story**: four steps, each picture right before its step in
  the DOM (read together; above it on a phone, beside it from 1024px). With
  motion, once `Reveal.tsx` sets `data-framed`, the four pictures hold one
  over another in one sticky night frame (each sticky in the same grid area)
  and only fade (never `visibility`), so all stay in the accessibility tree;
  without script or with reduced motion all four stay beside their steps.
  The pictures: the island with every short-let a light (`StoryLights.tsx`,
  canvas over `island.svg`), the zoom to Kato Paphos (the tour's own area),
  an example listing's booked-against-blocked month with Cyprus's raw and
  effective occupancy, and an example home matched with the short-lets
  nearest it (real positions) and four drawn long-lets (the listings API
  places short-lets only; the caption says it is an example). The matched
  card quotes the island's invest medians. Each step is about three-quarters
  of a window, so the story is four short screens.
- **Motion** (`Reveal.tsx`, `app/landing-motion.css`): arrivals and moments
  once on arrival, count-ups on the true counts, the story and the curve
  tied to the scroll where scroll timelines exist (else in time). Guards:
  only what is below the window after load is hidden; nothing without
  script, with reduced motion, or in print (the motion CSS is
  `@media screen`); a waiting part that takes keyboard focus is shown at
  once (`:focus-within`, then settled by `Reveal.tsx`). The per-card `useArrival`
  observers are gone; `Card` carries `data-moment`.
- **Questions** are a compact data sheet of seven native disclosures. The
  answers are true as the code and docs stand; two are hedged in the copy:
  the Playground is open now "without an account" (no auth on `/dashboard`)
  and "accounts and plans are not settled yet" (PRODUCT.md open decision);
  Greek is "Claude answers a question asked in Greek in Greek" (Claude's
  behaviour; the connector reads Greek place names). "Keep what they show
  over time" rests on the serving layer keeping weekly rows (POSTGRES.md).
- **Close**: "Ask the team. Or start with your street.", "Email the team"
  stays the main button (owner), "Or open the Playground" second.
- **The cadence** is now said in step 1 ("Each short-let's calendar every two
  days …") and the questions' second row; the hero gives the last read time
  only. If the crons change, change those two places.
- `public/og.png` was remade with headline A (the recipe below).

**2026-10-17, later: copy pass.** The owner asked for words that "draw the
attention", after AirROI, Ask Wire (the Cypriot property-data firm,
ask-wire.com) and other property and short-let data sites. Layout, palette
and type are unchanged; the headline is the owner's and stays. The rules the
words now follow:

- **No "daily".** The data repos' crontabs read short-let calendars every
  two days (Data.STR `run_availability`), prices weekly, and Bazaraki's sale,
  rent and land ads weekly (Data.Property, Mondays). Every "read daily" and
  "updated every day" is gone; the cadence is said exactly where it is said
  at all: under the search ("Short-let calendars re-read every two days, most
  recently …", with the database's own time), in How's sentence and its
  second stop. If the crons change, change those three places.
- **Plots are "tracked", never "shown".** Plots of land are scraped weekly
  since 2026-10-12 but live in DuckDB only (not synced to Postgres), so the
  hero says the four kinds of listing are tracked, not that they are in one
  view.
- **Counts are what they are.** "In the database: … for-sale ads" under the
  search; "short-lets tracked", "long-lets tracked", "for-sale ads seen" in
  How (sale expiry is not tracked yet).
- **The words.** Eyebrow "The whole island, street by street"; the sentence
  "Short-lets, long-lets, homes and plots for sale, tracked all year from
  Paphos to Protaras." over "Decide where to buy, what to charge and what to
  advise."; the search's placeholder "Try Limassol, or Λεμεσός" (the search
  takes either). Products: "Three ways in. Draw it yourself, have it written
  up, or ask Claude."; the Playground's eyebrow "Draw it yourself" and "Put up
  to three places side by side"; Reports "The full case for one property or
  one area."; Connector "Ask about any place, in Greek too.", its questions
  "Which months fill up, and which go quiet?" and "What do 2+ bedroom
  short-lets take a night here?" under "Try a question"; How's eyebrow is the
  bar's "How it works"; the close "A report, connector access, or a number you
  can't find"; the footer names which listings come from which site.

**2026-10-17: Blue Night (current).** The owner reopened the look (he did not
like the end result of G) and asked for his own saved idea,
`docs/design/ideas/blue-night/`; a standalone concept was shown and he picked
Google Sans in its Flex cut (for the light 300), eyebrows and pill buttons on
(the search a pill too), and the town-tour hero. Built the same day;
`DESIGN.md` is the authority. What changed:

- **Roles scoped to the landing** (`app/globals.css`): every landing role is
  set under `.bn` (the white body) and set again under `.bn-night` (the hero,
  the navy cards, the close, the bar while it lies over the hero). The `:root`
  `--th-*` roles are still G's and are read only by the Playground, which
  follows later; nothing on `/dashboard` changed.
- **Face:** Google Sans Flex 300 to 700, self-hosted
  (`public/fonts/google-sans-flex/`, Latin and Latin Extended; OFL). It has no
  Greek, so Greek falls through to the self-hosted Google Sans.
- **First screen:** a night card inset 12px (8px on a phone) with 20px
  corners, a blue glow rising behind the town, the eyebrow "Cyprus property
  data, read daily", the headline thin and two-tone ("Plot your next move" in
  ink, the rest in mist; the olive "Plot" and "sights" are gone), the search a
  pill with the reference's dark "Show me" pill. The tour and its timing are
  unchanged; the pictures are night maps (below) and every short-let is a
  light: a dot in its class's colour with a halo added to its neighbours',
  brighter where fuller (`TownTour.tsx`). A card is night glass and now reads
  name; short-lets with "77% occupancy this season" and its bar under them;
  long-lets and for sale where live; "Sample figures" on demo data. The strip
  is two lines at the card's foot.
- **Map pictures:** `build-hero-town.mjs` and `build-island-map.mjs` bake the
  night palette (land clear, the sea a dark wash, streets and coast in faint
  dotted ice, main roads faint solid; no buildings, so the six town files fell
  from 46 to 332 KB each to 14 to 36 KB). Rebuilt from the same cached
  tiles, so the geometry and `heroTowns.ts` are unchanged. The tour reads the
  sea back off the picture as the well-opaque dark pixels.
- **Bar:** night over the hero (inside the card's top, the tagline "Property
  data for Cyprus" from 1280px, the ice pill), white frosted by day; it turns
  once the hero's foot is within 200px of the top. The phone menu is a night
  sheet behind a "Menu" pill.
- **Body:** white, 136px between sections (88px on a phone). "Products" and a
  two-tone heading open the three; each section's heading is the product's
  name and claim in two tones under an eyebrow ("Explore it yourself", "Written
  by the team", "In Claude"). The Playground's verdict and the conversation
  sit on navy cards; the report's sheet, the five views (back as a tile, from
  the concept) and the questions on pale tiles. The actions sit with the words
  at every width (the duplicate at the foot below 1024px is gone, as in the
  concept); on a phone the Connector's questions come before the conversation.
  The island's faint map behind the panels and every frosted panel are gone.
- **How:** an eyebrow "Method", thin counts under hairlines, round stops, the
  listing as a navy card with its light; the line fills with glow-500.
- **Close:** "Ask the team" and the footer share one night card, the glow
  falling from its top, the wordmark at the card's full width.
- **Words:** "Demo data" reads "Sample data" on the landing (the concept's
  word; the same honesty, clearer for a visitor).
- **Left out from the concept:** the drifting light streaks (the tour is the
  hero's one moving thing; the streaks were the most generic part of the
  reference), the "Reply to Claude" composer at rest (the conversation is as
  tall as its exchanges, per the critique of 2026-10-14), and sample long-let
  and for-sale lines on demo cards (demo data answers those two for the whole
  island, so the card leaves them out until the live database answers).
- `app/landing-glass.css` is deleted.

**2026-10-14: direction G, "Olive Window" (replaced by Blue Night).** The owner found the beige,
olive and saffron page "childish" and asked for a professional
data-analytics look; from ten directions rendered on the real page he chose
G (paper, olive ink and action, an olive-to-lime data scale; `DESIGN.md` is
the authority). He saw the map both in a deep-olive window and light, chose
the light one ("Prefer this one"), and then asked for it frameless and faded
as before ("the way the previous map was deployed was nicer. with the fade
... now it seems cut off"). What changed:

- **Tokens** (`app/globals.css`): paper `#F5F4EE`, ink `#1C2116`, olive
  action, `--th-data-1..4` (olive to lime, monotone; the old `--th-occ-*`
  names now point at them), `--th-dot-none` for a listing with no figure,
  `--th-deep` (the close's deep olive). Display weight 500, large figures 400.
- **First screen:** the light town map is frameless again and fades into
  the paper (fade A): nothing at the words' column's right edge, whole a
  quarter of the way in, faded under the nav and at its foot; listings, areas
  and cards fade over the same left quarter, so none is ever under the words
  (every text token keeps its contrast against the worst pixel behind it).
  The town's name and the key to the shades are in the strip at the hero's
  foot with "Next town", the Demo data tag and the credit. Every short-let on
  the map is shaded by its season occupancy, not only those inside the drawn
  areas (`TownTour.tsx`), each in an ink ring so lime holds on light land;
  those outside step back to 60% once an area closes; one with no figure (a
  null occupancy, which live data can have) is an empty grey ring, named in
  the key. The search field is glass again (below).
- **Map pictures:** `build-hero-town.mjs` and `build-island-map.mjs` bake the
  light palette (DESIGN.md `map-*`, `picture-*`); a deep-olive set was built
  for the comparison and removed once the owner chose. The regenerated
  geometry differs slightly from the 2026-10-09 set because OpenStreetMap
  changed since (the old scripts on the same tiles give the same paths).
- **Fade B,** for comparison only and not in the code: the map under the
  words almost to the left edge, a whisper of streets behind them. It is a
  CSS override (kept with the captures, not in the repo); it lowers the text's
  worst-pixel contrast (ink 14.9 to 14.0, muted 7.1 to 6.7) and, at its
  larger scale, puts some towns' cards in the fade or under the nav.
- **Panels:** glass panels over the island's faint map (no tinted washes), 6px buttons
  (no pills), outlined "Demo data" tags, line icons with one lime fill.
- **One interaction per section, each from real content:**
  Playground, the occupancy curve (`OccupancyCurve.tsx`, on the map's light
  land): every short-let's season occupancy from `/api/dashboard/points` as
  the share booked at least each share of nights, the tipping point and
  "Yours" on it; with a tipping point over 100% it says none can pass it; a
  press or drag
  along it sets the slider (references: Our World in Data's chart-as-control,
  Robinhood's scrub). Reports, a rail of one mark per section under the
  running head, arrow keys and a sideways swipe to turn the page (Pitch's
  slide strip, Linear's pager). Connector, a picked question's answer
  streams in word by word, every word in the page from the start (Claude,
  Raycast AI); the report's sheet is as tall as its page. How, the line fills
  with olive as it is scrolled and each stop
  turns olive as it is reached, CSS scroll-driven animations only (Linear's
  Method, Stripe's diagrams); no count-up (Stripe's figures are final from
  the first frame). Close, "Copy the address" beside the mailto (Rauno,
  Vercel); where the browser refuses the clipboard it selects the address and
  says to press ⌘C or Ctrl+C. All have a reduced-motion state that is simply
  the final one.
- **Opening:** kept; recoloured by the tokens; the headline's three lines
  now each rise out of a mask at their own foot as the name goes up.
- **Close and footer:** deep olive (`--th-deep`), the page's only dark ground.

**2026-10-13: nothing stands between the first screen and the products.**
The owner, after reading PriceLabs' site (hello.pricelabs.co) as a model for
type and wording, found the stage's map redundant ("the map on the second
page is redundant"). A screen of the market in numbers was built in its
place and rejected the same day ("Too much information", "no clear section
difference", "you keep the options of areas", "it is a mess"); nine
captured numbers sections and three simpler bands were then put to him
(https://claude.ai/artifact/N3siUE8hdKhvxtFu49rgyC) and he liked none, and
chose to have no second screen at all. So the first screen is followed by
the product cards. The cards are about the whole island: `IslandSource.tsx`
asks for its figures on the server and `PublishIsland.tsx` (which draws
nothing) hands them to the cards through `areaContext`; with no map
counting listings, `countsFailed` is true and `dots` null, and the cards
use the API's counts. The first screen's search opens the Playground on the
picked place (`/dashboard?area=<id>`). `DrawHero`, `AreaMap`,
`ProductPanels` and the island basemap are still in the tree and no longer
mounted; the sections on the stage below describe them as they were. Live
counts remain in "How the numbers are made".

The hand-off (2026-10-14). The Playground opens on the picked place with its
boundary (`dim_areas.boundary`) drawn in the brand mark's hand: an ink line,
a light olive tint, and olive corner dots on the few points that shape it
most (`components/dashboard/areaHand.ts`; among the Playground's green
listing dots each dot also takes a 1px ink rim), and the map fitted to it.
A place with no boundary on record (parishes, tourist areas, and every place
in the demo data) is named at its centre and fitted to its search radius;
no line is drawn where none is known. The top bar carries the wordmark and
"Playground" on the landing's ink, and the map is OpenFreeMap's vector tiles
painted in this page's map colours (`components/dashboard/basemap.ts`, see
`TECH_STACK.md`). The rest of the Playground is still its dark design.

The headline, chosen by the owner the same day from four: "Plot your next
move in Cyprus property. Get the insights." Its three lines are set as
lines, and the type is sized from the column's width so the longest always
fits (`.lh .th-h1`, `.lh-line`). The sentence under it is two tiers: "Short-lets,
long-lets, homes and plots for sale: the whole market in one view, updated
every day." in ink at weight 400 (G; 500 until 2026-10-14) (24px/32px from 1280px, 20px/28px below),
then "Decide where to buy, what to charge and what to advise." a size down
in the muted tone (`.lh-what`, `.lh-for`). Google Sans stays.

Page order (`apps/web/app/page.tsx`): `Nav`, `LandingHero` (the first
screen), `IslandSource` (draws nothing; until 2026-10-13 `DrawHero`, the
stage, `#draw`, stood here), `ProductSections`
(`#playground`, `#reports`, `#connector`, three panels one after another),
`HowSection` (`#how`), `CTASection` (`#access`), `Footer`.

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

Left, from 1024px: the `h1` ("Plot an area on the map. Get the insights."),
one sentence, and `PlaceSearch`. The headline names the gesture and the
promise in eight words (owner, 2026-10-10: plot "as plotting something on a
map", "insights shoud always be in and sights highlighted"); a longer one that
named the three markets was rejected the same day. The sentence states the
daily habit and the three markets first ("emphasis that we daily get short,
long and sales data"), then the gesture and the promise: "Updated every day: every
short-let, long-let and sale in Cyprus. Draw a line round any streets and see
what they earn, rent for and sell for." (2026-10-10: "show that our database
is updated daily"; chosen over three other wordings). The owner asked for
"different fonts for this part" and left the face to the designer; Newsreader,
a serif, was tried and dropped within the hour ("I hate these fonts"). The
sentence stays in Google Sans, the page's one voice, at 20px (24px from
1280px), and gets its difference from weight and ink: "Updated every day" and
the promise are set in ink at weight 500, the rest in the muted tone. Cyprus is named once, in the
sentence, so the headline stays place-neutral for Athens. It replaced "We analyse prices, bookings,
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
headline the opening "Plot" and the "sights" of "insights" are olive, the
colour of the wordmark's dots (`.lh-name`; until 2026-10-12 the mark's light
orange), so the name is read out of the sentence. The
device was the owner's for the old name (2026-10-09: "make Prop with the
light orange colour and sights the same", when "Prop" came out of
"Property"); with the new name the sentence opens on "Plot an area"
(2026-10-10), so the name reads in the same order and its first word is the
verb for what the visitor does on the map. **The name.** PropSights became Plotsights on 2026-10-10: a web
search found Propsight (a French property-analytics SaaS), PropertyInsights
(UK) and LexisNexis Property Insights already in the family, and RealSights
(the September brief's name) is a live US real-estate data company. After
a long search the owner chose Plotsights, a plot being the land, the shape
drawn on the map and the chart, and the word Cypriots use for land for
sale; plotsights.com, .io, .cy, .com.cy and .gr were bought the same day. The `h1` carries the plain sentence as its
`aria-label`. The olive is 6.3:1 on the ground; the light orange it replaced
was 1.9:1, below the 3:1 asked of large text.

**Glass (2026-10-09; again from 2026-10-14).** The owner, after G: "bring
glass back. I like opaque glassomorphism for the most parts of the
website". `app/landing-glass.css`, every rule under the class `th-glassy` on
the page's outer element: the nav once scrolled, the search field and its
list, the cards pinned on the map, the three product panels and How's
listing card are frosted, mostly opaque glass (78% white, a 24px blur, a 1px
light rim, a 12% ink edge; one soft shadow only on what is raised). Buttons
stay one solid fill, the close stays solid deep olive, and nothing inside a
glass panel is glass again (the report's sheet and the chat bubbles are solid
white with the same rim). Behind the panels is something to blur: the
island's own map at half strength (`.ps-panels::before` in
`landing-sections.css`). Measured against the worst pixel behind each text
element, every token keeps or betters its paper contrast on the glass. With
no `backdrop-filter` or with reduced transparency asked for, every surface is
its solid fill and the backdrop map is not drawn. From 2026-10-09 to
2026-10-14 the search was a clear slab with a light that followed the
pointer and the buttons were beaded; neither came back.

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
about a second to be read, then the pointer goes on to the next area.

**The capture (2026-10-10).** The listings had always taken their shades, but
in a quiet 220ms fade that never registered, so the owner asked to "make the
listings appear orange when plotted". Now the close is an event: the dots
light in a wave from the corner where the line closes, each one swelling to
1.7 times its size and back over 360ms with a ring that widens and fades,
the wave crossing its area in 600ms so the last dot settles 140ms inside the
area's hold; the card follows at 260ms. From the first close the rest of the
town steps back to 45% grey, dots of the areas not yet drawn included, so
nothing hints at the next area before the pen gets there, and the wave lifts
each listing from the receded town into colour. Every value is a pure
function of the clock, so pause holds a frame; the first town still arrives
complete and reduced motion still paints once. Built by a builder agent and
reviewed line by line the same day.

**The cards (2026-10-10; G, 2026-10-14).** Each area's card is opaque glass
with 6px corners, a light rim and an edge of ink at 12%, the only thing on
the map with a shadow. Its foot is the occupancy
meter, labelled "43% occupancy" on a line of its own above the bar (owner:
"instead of x% full lets say occupancy"); the figure left the short-let row
because the longer word made neighbouring cards overlap in Limassol. In the
band the docked card sits at the lower left, under the town's name. (It was
moved right for a day to clear a round button that turned out to be Next.js's
own development badge, which no visitor sees; put back 2026-10-12.) After
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
many, the median asking price. Everything is 16px; counts and figures are
ink at weight 600, tabular, the counts ranged right. The dots on the map
are the short-lets only, so the short-let line starts with the mark those
dots wear, in the shade of the area's occupancy, and along the card's foot
the occupancy is drawn again as a bar in that shade. From 1440px the name
is a size larger; between 1024 and 1439px, where three cards share a small
map, the prices go without "a night" and "a month", which the market's name
already says. A card with all three markets is about 270px by 158px from
1440px and 225px by 147px below it, and every card's place in `DRAWN` is set
for that size (no two overlap and none leaves the picture at 1280, 1400 and
1500px). The town's name was the largest word on the map (20px) until 2026-10-14; it is now in the strip. The credit row under
the picture carries the pause control, the key ("Short-lets this season:
emptier", four dots, "fuller"; "this season" is left out below 1440px and
the whole key between 1024 and 1279px, where the row has one line's room)
and the map credit. The key says which listings the dots are and that the
figures are this season's.

Below 1024px the picture is a band under the words, 860px or more of map
behind a window, so it shows a few streets at a time: it is centred on the
area being drawn and moves on with the pointer (never so far that the
map's own edge shows), and (until 2026-10-14) the town's name was in its corner. Cards are not
pinned on the map there. One card is docked at the band's foot, for the
area the band is on: it comes when that area closes and goes when the band
moves on, so it never speaks for an area out of sight, and that area alone
is tinted (the others keep their line and their listings). An area stays
longer there before the band moves (1.7s against 1.1s), since its card is
only up while it does.

Between 1024 and 1179px, as on a narrow phone, the search button is its
arrow alone, so the field has room for its placeholder.

### Changed on 2026-10-14

- Under the search, one line from the database (`Fresh` in
  `LandingHero.tsx`, from `getIsland()`): "Read daily: 3,431 short-lets,
  1,420 long-lets and 3,184 for-sale ads seen. Short-let calendars last read
  14 October at 06:10." The one time the database gives is the short-let
  sync, so it is said of the short-lets alone.
- The tour's credit row has "Next town" beside "Pause the tour": the town
  showing leaves as it always does and the next comes in, and a paused tour
  starts again. While the next map loads the control reads "Loading the next
  town" and keeps the press. It is offered with reduced motion too, where
  the next town simply replaces this one, complete.
- Limassol's "Seafront" area was redrawn on the streets behind the
  promenade; its corners ran into the sea.
- Below 1024px the docked card sits near the band's top, so a phone shows a
  card on its first screen; between 1024 and 1279px it is docked at the map
  column's top right instead of three pinned cards. The town's name is only in
  the strip under the map (since 2026-10-14; it was also a label on the map).
- Opaque glass on the search field, its list, the cards on the map and the
  scrolled nav (DESIGN.md, The Glass Rule); "Show me" is a flat olive fill.
- The nav: "How it works" (to `#how`) from 1024px; "Open the Playground" is
  a plain link while the search is in view and the olive button after.

## The stage (`DrawHero.tsx`, the second screen)

One viewport: a band (an `h2`, "Draw an area. Get it three ways.", and one
sentence), then the stage. Left, a map with a hand-drawn area whose corners
the visitor can move.
Right, the three product panels, joined to the area by thin lines from
1024px. They are where the page first names the products: the first screen
holds only the headline, the sentence, the search and the map (owner,
2026-10-12: "the hero should only have the things without the actual
products", and of the panels, "I prefer it where the products were on the
second page with the line syncing to the map"). For one day, 2026-10-11, a
table of the area's figures ("Inside the line") stood here instead.

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
- `AreaMap.tsx` is the map. The corner handles (round olive dots since
  2026-10-12, the brand mark's own, on an ink outline) are buttons: drag them
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

## Product panels (`ProductSections.tsx`, styles in `app/landing-sections.css`)

Rebuilt on 2026-10-14 from the owner-approved design review (one idea per
section, "don't mislead the customer", PriceLabs as the reference for
professional type). One statement opens them: "Three ways to use it: explore
it yourself, ask us for a report, or ask Claude. The figures below are for
all of Cyprus, today." Then three panels, each a section on its own ground
(white, olive tint, saffron wash), flat, never covered: the stack of cards
that pinned and slid over one another is gone (the owner approved "no card
may be covered before it has had its full screen"; separate sections were
chosen over a full screen of runway because each panel now holds one working
thing, so pinning bought nothing and cost the covered text, the measuring
script and the phone's long scroll). A link to `#playground`, `#reports` or
`#connector` lands under the nav by the panel's own scroll margin.

Every panel (`Card` in `SectionParts.tsx`) has the product's name as its
heading with its icon, one claim (a statement), a sentence or two in ink,
its one action, at most one line of small print, and one working thing.
From 1024px the three are composed three ways (`layout`): split, mirrored,
stacked. Below 1024px each is one column and its action comes again after
the working thing.

The panels read the whole island's figures from `HeroAreaProvider`, which
`IslandSource` fills on the server through `getIsland()` (`lib/landing/
island.ts`, cached per render and shared with the first screen's line under
the search and with "How the numbers are made"): `/stats`, `/rentals`,
`/invest`, the Market snapshot's median occupancy, and the last sync time.

- **Playground** (`PlaygroundSection.tsx`). "What any street earns, rents
  for and sells for." The working thing is "Airbnb or a tenant?", the
  Playground's own Buy & Rent verdict for Cyprus: the tipping point
  (`invest.parityMedian`, scaled by the Playground's starting running costs,
  40% of a short-let's takings and 15% of rent, exactly as `BuyRentTab.tsx`
  does), a slider ("How booked would yours be?") that starts at the median
  Cyprus short-let's occupancy this season (the Market snapshot, the figure
  the Playground compares with; `stats.effOccTodate` if the snapshot is
  missing) and says which earns more there. The Playground's year's sums
  are not quoted (the review of 2026-10-14: they are independent medians
  and could read as the verdict's proof while disagreeing with it). The
  tipping point is rounded to the whole per cent printed and the slider is
  compared with that same figure. The basis line says what it rests on
  without a level of firmness ("It rests on the homes for sale that have
  short-lets and long-lets of their size near them, among 3,184 for-sale
  ads seen."), since that subset is not counted on the page. The head
  to head, the five preview tabs and the bullets are gone; the five views
  are named in a sentence. Its button is "Open the Playground" (no longer
  "it's free": the free part will sit behind an account).
- **Reports** (`ReportsSection.tsx`). "A written answer for one property or
  one area." The working thing is the report sheet to leaf through (two text
  tabs over it for the kind of report, pager and running head on it). The
  contents rail and its phone select are gone. Section titles in plain words:
  "What price and minimum stay change", "How reviews move bookings", "What we
  recommend, and what it is worth". The sheet's bars are saffron inside an
  ink line. Every page still shows real figures or says what the section
  contains, never an invented one; analysis pages end in a key finding,
  filled only where the page's figures support one.
- **Connector** (`ConnectorSection.tsx`). "Ask Claude about any place in
  Cyprus." Named "Plotsights Cyprus" (the connector's decided name and
  address, cyprus.plotsights.com; "Noesis Cyprus" is gone from the page).
  The first exchange is there from the start, answered; a question the
  visitor chooses is typed, sent and answered as before (the composer line
  shows only while it is typed). The conversation is as tall as its
  exchanges and scrolls inside itself past 520px from 1024px. The questions
  are one line each: which tool an answer drew on is in its first line. The
  short-let answers count in short-lets ("across 3,431 short-lets", "Firm: it
  rests on 3,431 short-lets"), never "listings". Answers keep the connector's shape (what it found, how firm,
  the date where the data has one); the Greek question and answer are still
  to be proofread by the owner.

## How the numbers are made (`HowSection.tsx`, styles in `app/landing-how.css`)

After the product panels and before the close (`#how`), on the paper with no
sheet's edge of its own (since 2026-10-14). Under its heading, what the
database holds today as three large figures with one caption each
("short-lets", "long-lets", "for-sale ads"), and a line saying the for-sale
count is every ad seen (ad expiry is not tracked yet, roadmap §4). The owner's idea for the flow diagram that was
tried as a first screen: "a better more techy diagram for how we do it and
what we do". One listing is followed along a line with five stops, each
showing the listing as it is at that point:

1. *A listing goes up* (was "It is published"): an example listing as its
   site shows it (marked as an example).
2. *We read it, every day*: a month of its calendar, a square a night,
   booked, blocked by the owner, or free; and the time of the last sync
   (`getSummary().lastRunAt`; left out on demo data).
3. *We put it on the map*: its dot inside three nested areas.
4. *We count real bookings* (was "We measure it"): what its calendar shows taken against what was really
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

"Ask the team." on ink: "A report, connector access, or a question about a
place: tell us what you need." The request is an email to
`info@plotsights.com` (`BRAND.email`), written in the visitor's own mail app
("Email the team"); beside it, "Or open the Playground". A carried request
("Your request: …", `sessionStorage` key `ps-question`, event `ps:question`,
both exported from `compare.ts`) is shown over the actions, named in the
heading ("Ask the team for a report on Cyprus.") and becomes the email's
subject. The drawn area that stood on a stem over the actions was removed on
2026-10-14 (it read as a balloon). The footer gives the wordmark, where the
listings come from ("Listings from Airbnb and Bazaraki, read daily."), the
map credit, the address and the year. Privacy and Terms, and the company's
registered name and city, return when they exist (see Open).

## After the critique of 2026-10-11

- The first screen named the three products under the search for a day.
  Taken off on 2026-10-12 at the owner's word; `products.ts` remains for the
  How line's last stop.
- The first screen's picture only plays the tour: it cannot be plotted on.
  From commit 7c26c2c it carried a button over the frame, with a crosshair
  and an offer beside the pointer ("Plot an area in Limassol"); that was
  removed on 2026-10-12 at the owner's word ("I dont like that you can draw
  on the hero"): drawing belongs to the second screen only. The search box
  is the first screen's way to the stage; `PICK_NAME_EVENT` stays for it.
- The stage's three product panels were replaced by "Inside the line", a
  table of the area's short-lets, long-lets and sales (`StageFigures.tsx`).
  Reverted on 2026-10-12: `ProductPanels.tsx` is back as it was on the 11th
  before that change (the Playground's panel still opens on the three
  markets' table; below 1024px all three start closed), with its lines to
  the map, and `StageFigures.tsx` is gone. The How line still ends on one
  sentence naming the products.
- **Street level for the six towns.** The stage zooms past 8x (16, 32, 64,
  128) only over the six towns the first screen tours: there it draws the
  island's plain shape and the town's street map over it (`IslandBasemap`,
  `public/landing/town-*.svg`), and the map moves only within that street
  map (`townAreas.ts`: `streetWindow`, `centreBounds`, `maxZoomAt`).
  Picking one of the six (by search or by clicking the first screen's map)
  opens at 128x on one of the tour's areas, a few streets wide
  (`streetArea`; the tour's areas, `DRAWN`, moved from `LandingHero.tsx` to
  `townAreas.ts`). Other places keep the round ring on the island and stop at
  8x. Demo listings scatter round each place's centre, so at street level
  some fall in the sea near the coast; live listings are where they are.
- "How the numbers are made" opens on what is behind the figures: the
  listings collected across Cyprus, all three markets, and the models that
  turn them into the page's figures (owner, 2026-10-11), with today's total
  on live data.
- The Reports card opens on "Revenue potential across the year" (a chart and
  its key finding), not on the key figures, which repeated the stage's two
  numbers on a half-empty sheet. The line under the stage no longer repeats
  the count the map's bar gives.
- The product cards were glass near solid until G, and stacked; since
  2026-10-14 they are white sheets that follow one another.
- Words that must not break at a hyphen use a hyphen and a word joiner
  (U+2060): Google Sans has no non-breaking hyphen.
- Type is four role tokens, 15, 16, 18 and 20px, under the display sizes;
  nothing is set under 15px (`DESIGN.md`, Typography).

## Palette

Blue Night (2026-10-17); `DESIGN.md` has every role and rule. Every landing
colour is a role-named `--th-*` custom property set under `.bn` (day) and
`.bn-night` (night) in `app/globals.css`, with the night palette by name as
`--bn-*`; `tokens.ts` exports roles as `var(--th-…)` strings, so components
read the ground they sit on. The data scale is `--th-data-1` to `--th-data-4`,
one blue from #5A7DA6 to #EDF3F9: on night the fullest is the brightest light;
on white a mark of it wears a navy ring. The map pictures are baked in the
night palette by the build scripts. G's paper, olive and lime roles stay in
`:root` for the Playground only.

## Open


- **Launch to-dos from the G build (2026-10-14).** See the first screen
  and the curve on the live database (both draw every listing from
  `/api/dashboard/points`, about 14.5k short-lets live; the tour thins what
  it draws outside the areas to 600 per town; null occupancies are drawn as
  empty rings, which demo data never has). Remake `public/og.png`, which
  still shows the beige first screen. Move the Playground (`/dashboard`,
  `components/dashboard/mapStyle.ts`) onto G. Open with the owner: whether to build one of the two opening
  ideas storyboarded on 2026-10-14.
- **Launch to-dos from the 2026-10-14 build (owner).** Privacy and Terms
  pages, then their footer links; the company's registered name and city for
  the footer; a reply-time promise for "Ask the team", if one is to be made;
  the search list still counts short-lets only ("729 short-lets"), since
  `/api/dashboard/areas` carries no long-let or for-sale counts: add them to
  that route to show all three. The share image (`public/og.png`, 1200×630)
  is the first screen without figures, rendered in a headless browser with
  the tour's overlay, the hero's figure line and the nav links hidden; make
  it again if the first screen changes.
- **The first screen's line under the search** quotes the three counts and
  the short-let sync time ("In the database: … Short-let calendars re-read
  every two days, most recently …"); on demo data it says "Sample data:" and
  gives no time. PRODUCT.md still says the team reads listings daily; that is
  the owner's to settle (run the crons daily, or change the words there).
- **Not yet seen on live data.** Nothing here adds a query (the first
  screen and the picked place use the stage's own three endpoints with a
  polygon), but none of today's screens has been run against the live
  database.
- The demo listings now gather round each place's centre instead of
  filling a rectangle (`scatter` in `demoData.ts`), so demo counts differ
  from earlier screenshots.
- **Requests are emails.** "Ask for a report" and "Ask for access" end in an
  email to `info@plotsights.com` from the visitor's mail app; a visitor with
  no mail app set up has the address on screen to copy. A form posting to a
  real inbox would replace it.
- **No Privacy or Terms pages yet**, so the footer does not link them.
- A hand-drawn shape cannot be passed to the Playground, so "Open it in the
  Playground" in the Connector's map answer opens the named place and says
  so once the visitor has redrawn the area.
- In demo data `/stats` counts listings the map leaves out (those in the
  sea). The bedrooms answer's count can only come from `/stats`, so it is
  quoted (in the answer and in its firmness line) only when it does not
  exceed the page's own count; otherwise the same is said without the
  number.
- The Greek question and answer are to be proofread by the owner.
- `CredibilityStrip.tsx`, `ProductTabs.tsx`, `SplitHero.tsx` and
  `HeroSequence.tsx` (the earlier landing) were deleted on 2026-10-11; they
  are in git history.
