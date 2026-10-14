---
name: Plotsights landing
description: A paper page with olive ink that asks for your place, beside a light map of a real town fading into the paper on which every short-let is marked from olive to lime by how booked it is; under it each product has a panel of frosted, mostly opaque glass holding one working thing over a faint map of the island, and the page ends in deep olive.
colors:
  ground: "#F5F4EE"
  ink: "#1C2116"
  muted: "#4D5544"
  line: "#DCDAD0"
  surface: "#FFFFFF"
  a: "#4A5E3A"
  action: "#4A5E3A"
  action-ink: "#FFFFFF"
  action-hover: "#3C4E2E"
  tint: "#ECEBE3"
  tint-hover: "#E2E1D7"
  solid: "#1C2116"
  solid-ink: "#FFFFFF"
  solid-hover: "#2E3526"
  data-1: "#4F6334"
  data-2: "#6F8F31"
  data-3: "#9CC13A"
  data-4: "#D6F25E"
  mark: "#D6F25E"
  occ-ring: "#1C2116"
  dot-ring: "#1C2116B3"
  dot-none: "#878B80"
  deep: "#1B2215"
  map-land: "#FAF9F4"
  map-sea: "#CBD9DA"
  map-shore: "#8DA1A2"
  map-road: "#D6D3C7"
  map-road-major: "#BAB5A6"
  picture-green: "#E2E7D5"
  picture-sand: "#F0EDE2"
  picture-building: "#E6E3D8"
  picture-built: "#E4E0D3"
  picture-secondary: "#CCC8BA"
  picture-motorway: "#A7A191"
  close: "#1B2215"
  close-ink: "#F5F4EE"
  close-muted: "color-mix(in srgb, #F5F4EE 74%, #1B2215)"
  close-line: "color-mix(in srgb, #F5F4EE 14%, #1B2215)"
  olive-light: "#A8C290"
  edge: "color-mix(in srgb, #4D5544 70%, #FFFFFF)"
  pending: "color-mix(in srgb, #4D5544 80%, #F5F4EE)"
typography:
  display:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "min(4rem, calc((min(100vw, 1440px) - 128px) * 0.42 / 9.2))"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.25rem, 3.05vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  figure-large:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.5rem, 4.4vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  statement:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  lede-large:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "28px"
  title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "26px"
  body:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  fine:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "21px"
  action:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1
  wordmark:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
rounded:
  none: "0"
  rail: "2px"
  tag: "3px"
  row: "4px"
  button: "6px"
  pin: "6px"
  sheet: "6px"
  field: "8px"
  field-inner: "5px"
  chart: "8px"
  card: "12px"
  bubble: "14px"
  full: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-tablet: "32px"
  gutter-desktop: "64px"
  column-gap: "40px"
  column-gap-wide: "56px"
  card-gap: "32px"
  nav: "72px"
  target: "44px"
  field: "58px"
  page-max: "1440px"
  card-max: "1312px"
components:
  button-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "46px"
  button-action-hover:
    backgroundColor: "{colors.action-hover}"
  button-solid:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.solid-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "46px"
  button-solid-hover:
    backgroundColor: "{colors.solid-hover}"
  button-paper:
    backgroundColor: "{colors.close-ink}"
    textColor: "{colors.close}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "48px"
  field-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 5px 0 16px"
    height: "58px"
  list-places:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "6px"
  list-places-row-selected:
    backgroundColor: "{colors.tint}"
    rounded: "{rounded.row}"
    padding: "8px 12px"
    height: "44px"
  pin-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.pin}"
    padding: "8px 12px 0"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  curve:
    backgroundColor: "{colors.map-land}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.chart}"
    padding: "16px 0 14px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "18px 18px 14px"
  tag:
    textColor: "{colors.muted}"
    typography: "{typography.fine}"
    rounded: "{rounded.tag}"
    padding: "0 7px"
    height: "24px"
  bubble-visitor:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "10px 18px"
  bubble-answer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "13px 18px 14px"
  close:
    backgroundColor: "{colors.close}"
    textColor: "{colors.close-ink}"
---

# Design System: Plotsights landing

Scope: the public landing page (`apps/web/app/page.tsx`). Every value here is read from the built page: the `--th-*` roles in the "Landing (nav and hero)" block of `apps/web/app/globals.css`, then `apps/web/app/landing-hero.css` (the first screen and the opening), `landing-sections.css` (the three product panels, the close, the footer), `landing-how.css` ("How the numbers are made") and `landing-glass.css` (the glass), and the map pictures in `apps/web/public/landing/`, whose colours are baked in by `apps/web/scripts/build-hero-town.mjs` and `build-island-map.mjs`. The Playground under `/dashboard` keeps its own look for now (its map is still drawn in the old beige, `components/dashboard/mapStyle.ts`); moving it onto G is open.

This is direction **G, "Olive Window"**, chosen by the owner on 2026-10-14 from ten directions rendered on the real page (A to C, then D to J), after he found the beige, olive and saffron page "childish ... more like a fancy website for animals" and asked for a professional data-analytics look with olive and lime. It replaces the beige, glass and saffron system of 2026-10-08 to 2026-10-14 (in git history before this change). The same day the owner saw the map both in a deep-olive window (as G was first drawn) and light, chose the light one ("Prefer this one"), and asked for it frameless and fading into the paper as before ("the way the previous map was deployed was nicer. with the fade ... now it seems cut off"); of two extents of the fade he was shown, A is built (see Layout). Then: "bring glass back. I like opaque glassomorphism for the most parts of the website" (The Glass Rule).

## Overview

**Creative North Star: "The Olive Window"** (the direction's name; the map is no longer in a window)

The page is paper and ink, measured and quiet, in the manner of the data products the owner takes as his anchor (PriceLabs for type and wording) and of those that use olive and lime seriously (Sylvera's deep-green band with lime as a data series; Wise and Ramp, where lime is one sharp signal and never the ground). Beside the words, the product's own map of a real Cyprus town comes out of the paper, and every short-let on it is a point whose colour says how booked it has been this season, from a dull olive to lime, each inside a fine ink ring. That map is the page's one rich thing. Everything else gives it room: one face, one ink, an olive action, frosted glass panels that are nearly white, hairlines where a table or list needs them, and no ornament.

The idea, in the subject's own terms: **on this page, every listing the team reads becomes a point on the town's map, and lime is what the market looks like where it is fullest.** Lime has one meaning wherever it appears: the top of the occupancy scale, which on the panels is the side of the tipping point where a short-let out-earns a tenant.

**Key Characteristics:**
- Paper ground (`#F5F4EE`), olive-black ink, an olive action; no tinted washes behind sections.
- The light map of a real town, frameless, fading into the paper; the Playground's curve and the Connector's map answer sit on the same light land.
- Deep olive only at the page's end: the close and the footer.
- An olive-to-lime data scale, monotone in lightness, where lime is only ever data.
- Google Sans at 500 for display and 400 for large figures; nothing heavier than 600.
- Line icons with one lime fill inside an ink line.
- Opaque glass for the surfaces (nav, search, the cards on the map, the product panels, How's listing card): 78% white, a 24px blur, a light rim; one soft shadow only on what is raised.

## Colors

Two greens with different jobs, a paper and an ink, and a scale.

### Primary
- **Working Olive** (`a`, `action`, `visitor`, #4A5E3A): the filled action (white on it, 7.1:1), the wordmark's dots, "Plot" and "sights" picked out of the headline (6.3:1 on the paper), a drawn area's corner dots, the visitor's bubble in the conversation, the current section on the report's rail, the How line as it fills, the tipping point's mark on the slider. Hover deepens to `action-hover`.

### The data scale
- **Olive to lime** (`data-1` #4F6334, `data-2` #6F8F31, `data-3` #9CC13A, `data-4` #D6F25E): how full a short-let has been this season, in the page's four classes (under 60%, the 60s, the 70s, 80% and over). Lightness and chroma rise together, so the fullest is the brightest. Checked with the dataviz ordinal validator: monotone, every step at least 0.06 apart in OKLCH lightness, one hue (spread 9°). On the light land the two darker steps hold by themselves (`data-1` 6.5:1, `data-2` 3.8:1) and the two lighter do not (lime is 1.2:1), so every mark in the scale wears an ink ring (The Ring Rule; `occ-ring` inside a drawn area, the lighter `dot-ring` outside).
- **No figure** (`dot-none` #878B80, 3.3:1 on the land): a listing whose occupancy is not known (live data can have a null) is not on the scale: an empty ring in this quiet grey, named "No figure" in the key. `occ-1` to `occ-4` are these four by their old names.
- **Lime** (`mark`, `data-4`): the one fill in a product icon, the listing followed in "How the numbers are made", Cyprus today's square on the slider, the verdict's square when a short-let wins. Never text, never a button, never a ground.
- **A single series on white** (a report's months) is `data-2`, the step that holds on white (3.9:1). Lime is kept for the top of the scale.

### The map
- **Light map** (`map-land` #FAF9F4, `map-sea` #CBD9DA, `map-shore`, `map-road`, `map-road-major`, `picture-*`): the town and island pictures, baked into `town-<key>.svg` and `island.svg` by the build scripts; the land of the Playground's curve and of the Connector's map answer. The sea is the page's only blue.
- **Deep olive** (`deep` #1B2215): the close and the footer.

### Neutral
- **Paper** (`ground`): every screen's ground, the nav once scrolled, the words on the close.
- **Ink** (`ink`, `solid`): text, the solid button (Reports, Connector), every outline of a square or node, chart axes, the ring on a light ground (`occ-ring`, 11:1 or better against every step).
- **Muted** (`muted`): secondary text, units, captions, placeholders (7.1:1 on the paper).
- **Hairline** (`line`): every 1px divider and a white sheet's edge.
- **White** (`surface`): the product panels, the search field, the report's sheet, the answer bubble.
- **Tint** (`tint`): a step in tone for a selected row or a hover; not a wash.

### Named Rules
**Lime Means Data.** Lime marks how full a listing is, at the top of the scale, and nothing else. It is never a ground, a button, a link, a headline word or an ornament (the owner rejected "forest + lime" as a ground swap on 2026-10-08).

**The Ring Rule.** On a light ground a mark of the scale always sits inside a ring of ink (`occ-ring`, or `dot-ring` for the listings outside the drawn areas): a listing's dot, the key's swatches, a lime square, an icon's fill.

**Deep Olive Ends the Page.** Deep olive is the close and the footer and nothing else. A section never opens on it, and the page is never dark.

**Nothing Under the Words.** The map fades to nothing before the words' column ends, so every text token keeps its contrast against the worst pixel behind it; no listing, area or card is drawn there.

**The Olive Works.** Olive is for what the visitor does and for the brand (the action, the drawn corners, the name); the scale is for what is counted. Neither does the other's job.

**The Turned Over Rule.** The close is the paper's words on deep olive, not a second palette; the focus ring inverts with it.

## Typography

**Face:** Google Sans (with sans-serif), self-hosted variable 400 to 700, Latin, Latin Extended and Greek. Pinned by the owner (chosen 2026-10-08, kept after comparisons on 2026-10-12 and 2026-10-13). There is no second face.

**Character:** measured, not loud. Direction G sets display at 500 instead of 700 (the PriceLabs and Sylvera register), large figures at 400 with tight tracking, and keeps 600 for labels and figures set inside text.

**The scale.** Nothing on the landing page is set under 15px at any width (owner, 2026-10-12).

| role | token | size | weight | used for |
|---|---|---|---|---|
| display | `.th-h1` in the hero | up to 64px, sized so the longest of three lines fits the column | 500, -0.035em | the headline |
| headline | `--th-heading` | 36 to 44px | 500, -0.035em | a product's name, "How the numbers are made.", "Ask the team." |
| figure | `--th-text-figure` | 40 to 64px | 400, -0.04em, tabular | the tipping point, the counts the database holds |
| statement | `--th-text-statement` | 24px | 400 | a product's claim under its name |
| lead | `--th-text-lead` | 20px | 400 or 500 | the hero's sentence, a panel's title, the verdict |
| body | `--th-text-body` | 18px | 400 | running text, every action (600) |
| small | `--th-text-small` | 16px | 400 | captions, notes, the cards on the map |
| fine | `--th-text-fine` | 15px | 500 | chart ticks, the hero's strip and credit, tags |

`--th-display-weight` is 500; the wordmark keeps 600 (`--th-wordmark-weight`) so the name holds beside its drawn "o".

### Named Rules
**One Face Rule.** Google Sans for everything; range comes from size and two weights, never a second family.

**The Floor.** 15px is the smallest text on the page.

**Figures Are Regular.** A large figure is 400 with tabular numerals; weight is for labels.

## Layout

A 1440px page with 16 / 32 / 64px gutters (phone / tablet / desktop) and the nav 72px tall.

- **First screen (from 1024px):** the words in a column of 42% (580px at most), vertically centred; the map frameless over the right 58%, from the top of the screen to its foot. It is nothing for its first 7% (so nothing of it lies behind the words: measured, every text token keeps its contrast against the worst pixel), whole from 28%, and fades under the nav (15%) and at its foot into the next section (8%); the listings fade in with it; the areas and their cards are not masked (a mask would make their layer the cards' backdrop root and fade a card) and are sited in `townAreas.ts` so that from 1280px every card sits inside the map's column, clear of the nav and of the strip, in all six towns (checked at 1280×720 to 1920×1080). Between 1024 and 1279px the column is too narrow for three cards: the last area drawn says its figures in one card docked at the column's top right, as on a tablet. A strip at the hero's foot, right-aligned: "Pause the tour", "Next town", the town's name, the key (short-lets this season, "Under 60%" four ringed swatches "80%+", an empty ring "No figure"), the Demo data tag, the map's credit. Below 1024px the map is a band under the words, 380px tall on a phone and 520px on a tablet, fading in at its top edge, the last area's figures docked at its top-left, the strip under it.
- **Fade B (shown, not built):** the map under the words almost to the left edge, a whisper of streets behind them. It lowers the text's worst-pixel contrast (ink 14.9 to 14.0, muted 7.1 to 6.7) and at its larger scale puts some towns' cards in the fade or under the nav, which only re-siting the tour's areas would fix.
- **Products:** one sentence, then three glass panels 32px apart over a faint map of the island (the island's picture at half strength, as tall as the panels, faded in and out at their top and foot), each a different composition (split, mirror, stack), at most 1312px wide.
- **How the numbers are made:** heading and sentence on one row, the three counts, then the line of five stops across (from 1100px) or down (below).
- **The close and footer:** deep olive, full width.

## Elevation & Depth

Surfaces are frosted, mostly opaque glass (The Glass Rule) told apart from the paper by a 1px ink edge at 12% and a 1px light rim inside. A shadow (`0 18px 36px -22px`, ink at 40%) only on what is raised over something else: the cards pinned on the map, the list of places that opens under the search, and the report's sheet, an object lying on its panel.

### The Glass Rule
The owner, 2026-10-14: "bring glass back. I like opaque glassomorphism for the most parts of the website". Professional, not consumer:
- **Where:** the nav once scrolled (the paper at 84%), the search field and its list, the cards pinned on the map, the three product panels, How's example listing card. Everything else is solid: every button (one flat fill), the deep-olive close and footer, and anything inside a glass panel (the report's sheet and the chat bubbles take the same rim and edge on solid white: a blur inside a blurred panel only sees that panel).
- **What:** 78% white, `blur(24px) saturate(1.4)`, a 1px light rim inside, a 1px ink edge at 12% (the search field keeps a 34% edge, which a control needs to be found). No coloured glass, no rainbow rim, no glow, no beaded buttons.
- **Something behind it:** glass shows only where there is something to blur: the map behind the hero's cards; behind the product panels the island's own map at half strength (`.ps-panels::before`), static, which no loose text sits on. How's card lies on paper and reads as a nearly white card.
- **Text holds:** measured against the worst pixel behind every text element on the panels (desktop and phone), every token keeps or betters its contrast on the paper (muted 7.06 → 7.42, ink 14.91 → 15.6): the glass is lighter than the paper.
- **Cost and fallbacks:** about five blurred layers on a screen at most (nav, a panel or two, the cards); no glass in glass. Without `backdrop-filter`, or with `prefers-reduced-transparency: reduce`, every surface is its solid fill and the backdrop map is not drawn.

## Shapes

Small, square-leaning corners, one per kind of thing: 2px the report's rail marks, 3px a tag, 4px a list row, 6px buttons, pinned cards and the report's sheet, 8px the search field (5px its button inside), its list and the occupancy curve, 12px a product panel, 14px a chat bubble. Round only for dots: a listing, a drawn area's corner, the wordmark's corners. There are no pills: the filled actions were fully round until G.

## Components

### Buttons
- **Action** (olive, white text, 6px): "Show me" in the search field, "Open the Playground". Hover deepens; press scales to 0.97; its arrow moves 3px.
- **Solid** (ink, 6px): "Ask for a report", "Ask for access".
- **Paper** (on the close): "Email the team".
- **Text buttons and links:** ink, underlined 1.5px, the underline drops on hover.

### Navigation
The wordmark, four links and "Open the Playground". Transparent over the paper at the top; once the page moves under it, the paper itself with a hairline under it.

### Place search
A glass field (The Glass Rule), 58px, 8px corners, a 1px ink edge at 34% (60% on hover), the search glyph, and the solid olive action inside its right end (the arrow alone on phones). The list of places opens under it as a glass sheet with the one soft shadow; the selected row is the tint.

### The map and the tour
`TownTour.tsx`. The light map, frameless and faded (Layout). On it every short-let in the town (`/api/dashboard/points`, season occupancy; demo data without `DATABASE_URL`) as a dot in its class, inside an ink ring; one with no figure as an empty grey ring. Those outside the drawn areas are smaller and step back to 60% once the first area closes; those inside light at full size in a wave from where the line closed. An area is drawn in ink, 1.5px, over a 4px edge of the land's colour, its corners olive dots ringed in ink; its figures float on a glass card over the map (name; short-let count, a night's price, occupancy as a bar in its class ended by an ink line; long-lets and homes for sale where the live database has them). The tour, its pause and "Next town" are unchanged.

### Product panels
`SectionParts.tsx` `Card`: a glass panel over the island's faint map, 12px corners, no shadow. The product's line icon (36px) and name in the headline role, the claim as a statement, a sentence or two, one action, and one working thing.

- **Playground: the tipping point and the occupancy curve.** The figure (75% on demo data) at the figure size, the slider "How booked would yours be?", the verdict (its square lime when a short-let wins), and under it the curve on the map's light land, framed by a hairline: the share of every Cyprus short-let booked at least each share of nights this season, the tipping point on it, and "Yours" from the slider. A press or drag along the curve sets the slider (`OccupancyCurve.tsx`); the plot is as wide as the slider's travel, so the two line up. The caption reads the figures out in words; with a tipping point over 100% it says no short-let can pass it. The line is `data-2`; lime is only the tipping point's dot, in an ink ring. Modelled on Our World in Data's chart-as-control and Robinhood's scrub.
- **Reports: a report you page through.** The sheet is as tall as its page (a short page leaves no empty space). It keeps its running head ("3 of 9"), and under it a rail of one mark per section: read sections in ink, the current one olive, the rest hairline; each is a 28px button that goes straight to its section. The arrow keys turn the page when focus is on the sheet; a sideways swipe of 48px turns it on a touch screen. Modelled on Pitch's slide strip and Linear's "1 / 84".
- **Connector: the answer streams.** The first exchange is in place, answered. A question the visitor picks is typed into the composer, sent, waited on, and its answer comes in word by word (34ms a word), with how firm it is and its date once the words are in. Every word is in the page from the start; only its opacity waits. Modelled on Claude's and Raycast's AI chat. The map answer is the island on the same light land (`AreaMiniMap`).

### How the numbers are made
`HowSection.tsx`, `landing-how.css`. The three counts at the figure size with one caption each (no count-up: Stripe's figures are final from the first frame). The line of five stops, the first the example listing in lime inside ink. As the line is scrolled into view the rail fills with olive from the listing's stop onwards and each stop it reaches turns olive (CSS scroll-driven animations; across from 1100px, down below). Without scroll timelines, or with reduced motion, the line is simply drawn and every stop is readable.

### The close and the footer
"Ask the team." on deep olive: the heading, one sentence, "Email the team" (paper), "Or open the Playground", a line about the team with the address, and "Copy the address" (only where the clipboard is available), which says "Copied" for 1.8s; where the browser refuses, it selects the address and says to press ⌘C or Ctrl+C. The footer below it in the same colour: the wordmark with light olive dots, the sources and credit, the address, the year.

### Brand mark and product icons
The wordmark: Google Sans 600, its "o" the plot (an ink line through five olive corner dots; `AreaMark`). On the close and footer the dots are `olive-light`. The product icons (`ProductIcons.tsx`): 1.6px ink line drawings on a 32px grid with small white square nodes and exactly one lime fill inside an ink line: the Playground a window with a plot and one lit listing, Reports a sheet whose tallest bar is the finding, the Connector a speech bubble with its cable.

### Charts and tables
Axes and ticks in muted at 15px; a single series in `data-2`; the scale's steps for occupancy; lime only at the top of the scale. On the curve, gridlines in `line` and the line in `data-2`. Tables and lists keep their hairlines.

## Motion

One authored moment per place, from an already readable state, exponential ease-out (`--th-ease`).

- **The opening** (first page of a visit, never with reduced motion; `Opening.tsx`, `lib/landing/opening.ts`): the name arrives large where the words will be, the tour's pointer draws its "o", the pointer walks to the map, the name rises to the nav; then the headline's three lines each rise out of a mask at their own foot, 80ms apart (G, 2026-10-14), and the sentence, the field and the counts follow. Any scroll, key or press ends it.
- **The tour:** areas drawn corner by corner, listings lighting in a wave, cards pinned; it waits while out of view or while the visitor types, pauses on request, and holds its first town with reduced motion.
- **The panels:** each arrives once (`useArrival`); the curve answers a press at once; a page turn is a 28px slide; a streamed answer.
- **How:** the line fills with the scroll.
- **Reduced motion:** no opening, no tour, no streaming, no scroll fill, no page slide; everything is in its final state.

## Do's and Don'ts

### Do:
- Keep the page paper; let the faded map be the rich thing.
- Put lime only on data, and ring it in ink on a light ground.
- Set large figures at 400 and display at 500.
- Show all three markets wherever an area is summed up ("don't mislead the customer", owner, 2026-10-09), and say what every figure covers.
- Give each section one working thing built from real data, usable with a thumb and readable without its script.

### Don't:
- Don't make lime a ground, a button, a link or a headline word.
- Don't wash a section in a tint, and don't put anything but the close and the footer on deep olive.
- Don't let the map, a listing, an area or a card under the words.
- Don't use pills, eyebrows, monospace labels, logo tiles, coloured or beaded glass, glass inside glass, gradients as decoration or shadows at rest.
- Don't count figures up, or hide content until a scroll or a script.
- Don't add a second face.

## Open

- **The opening:** two further ideas were storyboarded on 2026-10-14 (the plot leaving the name to become the first area; the listings lighting from the name's side); neither is built.
- **The Playground** (`/dashboard`) is not yet on G.
