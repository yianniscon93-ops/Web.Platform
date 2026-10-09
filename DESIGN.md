---
name: PropSights landing
description: A beige page that asks for your place, shows drawn towns one after another with areas and their figures pinned to them, then answers on a map of the island where an olive area does the work and a light orange marks what is counted.
colors:
  ground: "#F4F1E8"
  ink: "#161C11"
  muted: "#3F4A35"
  line: "#DDD7C6"
  surface: "#FFFFFF"
  a: "#4A5E3A"
  action: "#4A5E3A"
  action-ink: "#FFFFFF"
  action-hover: "#3C4E2E"
  visitor: "#4A5E3A"
  visitor-ink: "#F7F5EE"
  mark: "#F2A154"
  occ-1: "#FDEBD3"
  occ-2: "#F7C48B"
  occ-3: "#EE9740"
  occ-4: "#B85F14"
  occ-ring: "#7A3D0A"
  solid: "#161C11"
  solid-ink: "#FFFFFF"
  solid-hover: "#26331C"
  tint: "#E6EBDA"
  map-land: "#FBFAF4"
  map-sea: "#C2DADF"
  map-shore: "#6F929B"
  map-road: "#BDB8A7"
  map-road-major: "#958F7B"
  picture-green: "#DFE7CF"
  picture-sand: "#F3EAD3"
  picture-building: "#E9E3D3"
  picture-built: "#E3DCCB"
  picture-road-minor: "#D2CCBB"
  picture-road-secondary: "#CBC5B3"
  picture-road: "#B7B09C"
  picture-motorway: "#A69F8A"
  dot: "#161C11"
  dot-out: "#9AA08E"
  pending: "color-mix(in srgb, #3F4A35 80%, #F4F1E8)"
  wire: "color-mix(in srgb, #3F4A35 45%, #F4F1E8)"
  rail: "color-mix(in srgb, #4A5E3A 70%, #F4F1E8)"
  edge: "color-mix(in srgb, #3F4A35 70%, #FFFFFF)"
  area-land: "color-mix(in srgb, #4A5E3A 22%, #FBFAF4)"
  card-playground: "#FFFFFF"
  card-reports: "#E6EBDA"
  card-connector: "color-mix(in srgb, #F2A154 18%, #FBFAF4)"
  close: "#161C11"
  close-ink: "#F4F1E8"
  close-muted: "color-mix(in srgb, #F4F1E8 74%, #161C11)"
  close-edge: "color-mix(in srgb, #F4F1E8 46%, #161C11)"
  close-line: "color-mix(in srgb, #F4F1E8 20%, #161C11)"
typography:
  display:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.75rem, 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.125rem, 2.78vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  card-name:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "calc(clamp(2.125rem, 2.78vw, 2.5rem) * 0.7)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  wordmark:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  lede:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
    fontFeature: "tnum"
  action:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
  caption:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  micro:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
rounded:
  none: "0"
  sm: "6px"
  pin: "8px"
  row: "10px"
  md: "12px"
  map: "14px"
  list: "16px"
  card: "26px"
  full: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-tablet: "32px"
  gutter-desktop: "64px"
  column-gap: "40px"
  column-gap-wide: "56px"
  card-gap: "16px"
  card-head: "56px"
  nav: "72px"
  pin-top: "80px"
  target: "44px"
  field: "60px"
  page-max: "1440px"
  card-max: "1312px"
components:
  button-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "46px"
  button-action-hover:
    backgroundColor: "{colors.action-hover}"
  button-solid:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.solid-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "46px"
  button-solid-hover:
    backgroundColor: "{colors.solid-hover}"
  button-paper:
    backgroundColor: "{colors.close-ink}"
    textColor: "{colors.close}"
    typography: "{typography.action}"
    rounded: "{rounded.full}"
    padding: "0 22px"
    height: "48px"
  button-paper-hover:
    backgroundColor: "{colors.surface}"
  link-text:
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    height: "44px"
  field-search:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.lede}"
    rounded: "{rounded.full}"
    padding: "0 5px 0 18px"
    height: "60px"
  field-search-button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "48px"
  list-places:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.list}"
    padding: "6px"
  list-places-row-selected:
    backgroundColor: "{colors.tint}"
    typography: "{typography.body-small}"
    rounded: "{rounded.row}"
    padding: "8px 12px"
    height: "44px"
  pin-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.pin}"
    padding: "8px 12px 0"
  switch:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "3px"
  switch-option-selected:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.solid-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  switch-option-hover:
    backgroundColor: "{colors.tint}"
  map-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  map-control-hover:
    backgroundColor: "{colors.tint}"
  handle:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    size: "12px"
  handle-hover:
    backgroundColor: "{colors.a}"
  node:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    size: "9px"
  node-picture:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    size: "8px"
  node-counted:
    backgroundColor: "{colors.mark}"
    rounded: "{rounded.none}"
    size: "11.5px"
  map-frame:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.map}"
  card-playground:
    backgroundColor: "{colors.card-playground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  card-reports:
    backgroundColor: "{colors.card-reports}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  card-connector:
    backgroundColor: "{colors.card-connector}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "22px 26px 16px"
  listing-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.row}"
    padding: "10px 16px 11px 10px"
  bubble-visitor:
    backgroundColor: "{colors.visitor}"
    textColor: "{colors.visitor-ink}"
    typography: "{typography.body}"
    padding: "10px 18px"
  bubble-answer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "13px 18px 14px"
  field-close:
    textColor: "{colors.close-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  nav:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    height: "72px"
---

# Design System: PropSights landing

Scope: the public landing page (`apps/web/app/page.tsx`). Every value here is read from the built page: the `--th-*` roles in the "Landing (nav and hero)" block of `apps/web/app/globals.css`, then `apps/web/app/landing-hero.css` (the first screen), `apps/web/app/landing-sections.css` (the product cards and the close) and `apps/web/app/landing-how.css` ("How the numbers are made"), and the five map pictures in `apps/web/public/landing/` (six towns and the island), whose colours are baked in by `apps/web/scripts/build-hero-town.mjs` and `build-island-map.mjs`. The Playground under `/dashboard` is a separate, dark surface and is not described here.

## Overview

**Creative North Star: "The Drawn Area"**

The whole page is drawn with the tool the product hands the visitor: an area with an olive outline and square white corners you can pick up. The brand mark is that area with five square handles. The first screen shows them being drawn: a tour of six drawn town maps that runs by itself, three areas a few streets wide on each, every one answered on a small white card with how full its short-lets are and what a night costs, next to a search field that asks the visitor for their own place. The second screen, the stage, is one map of the island that zooms, with one such area on it whose corners drag, joined by thin lines to three product panels. The product icons, the chart ends, the report's contents rail, the chosen question, the slider's handle and the five stops of "How the numbers are made" are all the same square corner. Nothing on the page is illustrated in another hand.

The ground is a warm beige on every screen and nearly everything on it is ink. Two colours carry meaning and they do not trade jobs: olive works (every drawn area, its outline and its lines, the one filled action, the visitor's own words) and a light orange marks (the brand mark, the three product icons, the listing that is being counted, a booked night, and in four steps how full each listing has been). The map pictures (six towns and the island) are generated from OpenStreetMap data in the page's own quiet map colours; they carry no labels of their own and no boundary lines, they are credited on the page, and what names appear on them are set by the page in its own type. The page ends by turning the palette over: paper on ink, for the close and the footer only.

Density rises as the visitor goes down. The first screen holds a headline, one sentence, one field and one picture. The stage and the cards are working instruments set in small, exact type with tabular figures. The system is flat: hairlines divide, and a shadow appears only under something that lies on top of something else.

Confirmed rejections: teal and tangerine are both out of the palette; a dark first screen was built and rejected by the owner, and the ground stays beige; the page must not read as AI-generated (no pill or badge labels, no monospace labels, no logo tiles) and must not read as a research publication. Google Sans is pinned by the owner.

**Key Characteristics:**
- One drawing vocabulary: an olive area outlined at 2px, and square white corners with an ink border.
- Olive works, light orange marks. Ink does everything else.
- Beige ground on every screen; the close alone is ink.
- Maps are drawn from open data in the page's own colours, unlabelled, and fade into the paper or sit in a hairline frame.
- One typeface, Google Sans; hierarchy by weight and size, never by case or a second face.
- Flat surfaces divided by 1px hairlines; one soft ink shadow, kept for things that lie on top.
- Every figure is tabular and exact; a stale figure steps back in colour, it never disappears.
- Motion is one authored moment per surface, drawn the way the thing would be drawn; the first screen's picture alone runs on by itself, and can be paused. Under reduced motion everything is simply there.

## Colors

A warm paper palette in which two hues have fixed jobs and ink carries the rest.

### Primary
- **Working Olive** (`a`, `action`, `visitor`): every drawn area's outline and its tint over the land (22% as a role, `area-land` where a name's halo sits on it), the line from the stage's area to the open product panel, the filled action with white on it (7.1:1), the visitor's bubble in the conversation, the text selection, and the fill a square handle takes when it is hovered or held. Hover on the button deepens to `action-hover`.
- **Rail** (`rail`): the olive at 70% over the ground. The line of "How the numbers are made", its fork to the three products, and the middle ring of that section's small map. It is a local property of that section, not yet a `--th-*` role.

### Secondary
- **Marking Orange** (`mark`): the fill of the brand mark, the one filled element in each product icon, and the listing being followed in "How the numbers are made" (its picture on the listing card, its square on the small map, the first stop of the line). It always sits inside an ink line; it is never text and never a button (1.9:1 on the ground).
- **Fullness steps** (`occ-1` to `occ-4`, with `occ-ring`): how full a listing inside the line has been this season, from nearly white to burnt orange. Every such dot wears a thin ring of `occ-ring`, which is what makes the palest step visible on the land (8.0:1 on plain land). The same four dots, ringed, are the key under the map. The third step with the ring is also a booked night and the "really booked" bar. On the first screen the bar along the foot of an area's card is filled in the step that area's occupancy falls in and ended by a line of `occ-ring`.

### Tertiary
- **Map water and shore** (`map-sea`, `map-shore`): the only blue on the page, and only inside a map. Every map on the page uses the same two.
- **Picture colours** (`picture-green`, `picture-sand`, `picture-building`, `picture-built`, `picture-road-minor`, `picture-road-secondary`, `picture-road`, `picture-motorway`): what the generated pictures add over `map-land`. A town has parks and forest, beach, single buildings and two weights of street; the island has forest, built-up ground and three weights of road. They are constants in the two build scripts and are baked into the SVGs, so they are not `--th-*` roles.

### Neutral
- **Beige Ground** (`ground`): the page on every screen, the nav once scrolled, and the text colour of the close.
- **Ink** (`ink`, `solid`, `dot`, `close`): text, the border of every square corner, the cut edge of the search field's glass (at 56%), chart lines and bars, the solid button, the selected option of a switch, a listing with no figure, a blocked night's hatching, the one-pixel edge of a card pinned on the first screen's picture and the hairline from it to its area, and the ground of the close.
- **Muted Olive-Grey** (`muted`): secondary text, units beside figures, captions, a placeholder, the search glyph (8.3:1 on the ground, 7.7:1 on the olive tint).
- **Hairline** (`line`): every 1px divider and surface outline. On the two tinted cards it is remixed from that card's ground (24% `muted`) so it still holds.
- **White Surface** (`surface`): a pinned figure's card, the thin edge under a drawn area's line on the first screen, the map frame's bar, the controls that float on the stage's map, the switch, the report sheet, the listing card, the answer bubble, the Playground card, the inside of an empty square corner, a free night.
- **Olive Tint** (`tint`, `card-reports`): the Reports card's ground, the hover of an unselected switch option and of a control on the map, and the current row of the place list.
- **Orange Wash** (`card-connector`): the Connector card's ground, 18% of the marking orange over the map's land.
- **Map land and streets** (`map-land`, `map-road`, `map-road-major`): the land in every map and the frame's ground while a map loads; the halo behind a name set on land. The two street weights now colour only the two street maps the page mounts out of sight for the head-to-head's counts; nothing on screen uses them.
- **Pending** (`pending`): a figure whose area has moved and whose new value has not arrived (4.9:1 on the ground).
- **Edge** (`edge`): the outline of a control drawn on a surface and a slider's empty track (3:1 or better on white, the ground and the tint).
- **Wire** (`wire`): the lines from the area to the product panels that are not open, and the outer ring of the How section's small map.
- **Outside dot** (`dot-out`): a listing outside the drawn line; deliberately recessive.
- **The close** (`close-ink`, `close-muted`, `close-edge`, `close-line`): the same paper and ink turned over, with a quieter paper for secondary lines and two weights of rule.

### Named Rules
**The Olive Works, Orange Marks Rule.** Olive is for what the visitor does or has drawn; light orange is for what is counted and what is the brand's. Neither does the other's job, and neither is used as decoration.

**The Beige Ground Rule.** Every screen the visitor works on is the beige ground. A screen does not open on ink, on a tinted wash or on a picture with a frame of its own colour.

**The Ring Rule.** A pale orange never stands alone on a pale ground. A listing dot and a booked night wear the `occ-ring`; the mark sits inside an ink line.

**The Step Back Rule.** A figure that no longer describes the area on screen goes to `pending` until the new one arrives. It is never hidden, blurred or replaced by a spinner.

**The Turned Over Rule.** The close is the same palette inverted (`close` and `close-*`), not a second palette. The focus ring inverts with it.

## Typography

**Display Font:** Google Sans (with sans-serif), self-hosted variable 400 to 700, Latin, Latin Extended and Greek. Pinned by the owner.
**Body Font:** Google Sans. There is no second face.

**Character:** One friendly geometric sans doing every job, from a 60px headline to an 11px chart tick. The page gets its range from size and three working weights (400, 500, 600) under a 700 display, with tight tracking only at display sizes.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 4vw, 3.75rem)` from 1024px, `clamp(2.5rem, 7vw, 3.5rem)` below; line-height 1.04; -0.025em; balanced): the first screen's headline only, in three lines. In it the letters "Prop" of "Property" and "sights" of "insights" are set in `mark`, so the name is read out of the sentence; nothing else on the page sets words in the marking orange (it is 1.9:1 on the ground, and is used here on the owner's word, at display size only).
- **Headline** (700, `clamp(2.125rem, 2.78vw, 2.5rem)`, line-height 1.04 to 1.08, -0.025em): the stage's heading, the heading of "How the numbers are made" and the close's heading.
- **Card name** (700, the headline size times 0.7, line-height 1): a product's name in its card's 56px header row.
- **Wordmark** (700, 22px, -0.035em): the name beside the brand mark; 18px in the footer.
- **Title** (600, 18px/24px): a product's name in a stage panel and a stop's name on the How line; 700 for a report page's title.
- **Lede** (400, 17px on phones, 18px from 640px; line-height 1.5; `muted`; 34em measure, 30em on the close): the one sentence under a heading. The first screen's is a size up, 18px on phones and 20px from 1024px on a 28em measure, because it is read beside the page's largest words (owner, 2026-10-09: "arent the letters a bit small?"), and its last clause, what the visitor gets, is picked out in ink at weight 500. The search field's own text is 17px in ink.
- **Body** (400, 16px, line-height 1.45): the report page, the conversation, form input. 15px for notes, panel text, a row of the place list and what a stop on the How line says.
- **Figure** (600, 16px/22px, tabular): a number, always followed by its unit at 13px in `muted`. On a pinned card the figures are set as a small table at 13px/20px: a count and a figure in ink at weight 600, their words in `muted`.
- **Action** (600, 15px): buttons, text links, switch options, tabs (500 until selected).
- **Caption** (400, 13px/18px, `muted`): what a figure block covers, chart captions, notes under controls, what kind of place a row is.
- **Micro** (600, 11px): place names on a map (with a halo in the colour beneath them), chart axis ticks (400), the map credit and the tour's pause control beside it (600, ink), the words under a pinned card's figures and its count (400), the "sample" and "an example listing" notes.

### Named Rules
**The Seven Sizes Rule.** Running type is 11, 13, 15, 16, 17 or 18px, plus the headline size. A new element takes one of them. The one exception is the first screen's sentence at 20px from 1024px.

**The Weight Not Case Rule.** A label is a sentence-case word at weight 600. There is no uppercase and no monospace anywhere, and tracking is never what makes something a label; the name of a body of water on a map is spaced out (0.08em) as maps do.

**The Tabular Rule.** Every surface that shows figures sets `tabular-nums`, and a figure's unit is smaller and muted beside it, never in a separate column.

**The Bold Twin Rule.** Where choosing an item makes it bolder (a tab, a contents entry), its bold setting is laid out invisibly under the regular one, so selecting moves nothing.

## Layout

One centred column up to 1440px wide with gutters of 16px on phones, 32px from 640px and 64px from 1024px. Breakpoints are 640, 1024 and 1280px (the nav alone switches at 768px, the How line at 1100px, the search button's words at 480px), and the working surfaces also answer to window height (stage: 860 and 760px; cards: 880, 779 and 699px) so that an instrument and its action stay inside one screen on a laptop.

- **First screen.** From 1024px one screen tall (at least 720px). The words sit in the left 42% of the column, at most 580px wide and vertically centred: headline, sentence, then the search field (up to 540px wide) with nothing under it. The picture is not in the column: it fills the right 58% of the screen from top to bottom, runs off the right edge, and fades into the paper on its left (over 24% of its width), under the nav (15%) and at its foot (6%). It has no frame. Below 1024px one column in reading order, and the picture becomes a band under the words, 364px tall (520px from 640px), the full width of the screen, fading in from its top. The band is a window onto a larger map (at least 860px wide), centred on the area in hand and never so far over that the map's own edge shows; the cards pinned beside their areas on the whole picture give way there to one card docked in the band's corner.
- **The stage.** From 1024px a 7:5 grid, 40px apart (56px from 1280px), one viewport tall between 700 and 860px: the framed map on the left, three product panels on the right as one list divided by hairlines with at most one open at a time: a header opens its panel and, pressed again, closes it. The heading and its sentence share the row above, their bottoms aligned. Thin lines join the area to the panels on desktop only.
- **The stack.** Three product cards up to 1312px wide, 16px apart, each a 56px header row (icon, name, the card's one action) over a body. From 1024px the body is a 3:9 grid (sentence and plain statements left, the working object right; Reports and Connector add a middle column for what drives the object) and each card pins 80px from the top, one header row lower than the last, so covered cards remain as working tabs.
- **How the numbers are made.** Comes up over the cards, on the ground. The heading and its sentence share a 7:5 row as on the stage. Under them one line with five stops: from 1100px it runs left to right across five columns of slightly unequal width, each stop a square on the line with its name, its exhibit in a 164px row, a sentence and a fact beneath; at the fifth the line turns down and forks to the three products. Below 1100px the line is a rail down the left with the stops stacked beside it.
- **The close.** A 7:5 grid on ink: heading and sentence left, the form right, aligned to their bottoms.

Rhythm is small and even: 4 to 8px inside a row, 12 to 20px between parts of a block, 24 to 32px between blocks, and 64 to 104px only above and below a full section. Every pressable thing reaches a 44px target even when what shows is 12px.

**The Card Is The Surface Rule.** Charts, tables, tabs and lists sit directly on their card, divided by hairlines. They do not get boxes of their own; the things that are boxed are objects in their own right (a sheet of paper, a message, a switch, a listing, a figure pinned to a map).

## Elevation & Depth

Flat. Depth is said with hairlines and with tone: the ground, white, the olive tint, the orange wash. There is one shadow family, a soft ink shadow at 35% (`color-mix(in srgb, ink 35%, transparent)`) pulled in tight under the object, and it is used only where something lies on top of something else: paper on a card, a card or a control over a map, the field and its list over the first screen. A card pinned on the first screen's picture also has a one-pixel ink edge, because it sits on a busy drawing and not on a plain ground; that edge belongs to the card, not to the shadow family. Over that flat structure the page's surfaces are glass (see The Glass Rule): the material changed, the layout and the hairlines did not.

### Shadow Vocabulary
- **Sheet on a card** (`box-shadow: 0 1px 2px -1px var(--th-shadow), 0 20px 30px -20px var(--th-shadow)`): the report sheet lying on the Reports card. It shortens in short windows so it stays inside the card.
- **Sheet in a panel** (`box-shadow: 0 10px 20px -12px var(--th-shadow)`): the sample report page in the stage's Reports panel.
- **Pinned to a map** (`box-shadow: 0 8px 16px -10px var(--th-shadow)`): an area's card on the first screen's picture, pinned beside its area or docked in the band's corner.
- **Floating control** (`box-shadow: 0 8px 18px -10px var(--th-shadow)`): the zoom control on the stage map's top-right corner and the "Draw an area here" button on its bottom-left. The example listing's card takes nearly the same (`0 8px 18px -12px`).
- **The way in** (`box-shadow: 0 2px 3px -1px` at 24% ink and `0 20px 32px -18px` at 50%): the glass search field, a contact shadow and a deep one, with a soft white light set in the middle of the deep one (the light the glass gathers). Its open list drops further (`0 26px 44px -22px` at 50%).
- **Knock-out ring** (`box-shadow: 0 0 0 2px var(--th-surface)`): around a chart's hover dot, so it reads off the line. Not a shadow in effect.

### Named Rules
**The Glass Rule.** The page's surfaces are glass (owner, 2026-10-09: first "a nice liquid glass search thing. crystalized" for the search field, then "lets try glass everywhere to see how it shows", then "great I prefer it"). Three forms, in `app/landing-hero.css` (the search field) and `app/landing-glass.css` (the rest). *Clear*: the search field alone, a slab lying on the paper with nothing frosted, said by its edges and its light. *Frost*: anything that lies on something else, namely the nav once the page moves under it (the paper's tone at 80% falling to 56%, a 22px blur), a card pinned on the first screen's map, the stage map's controls, the three product cards (their own ground at 86% falling to 70%, a 30px blur, so each shows the last through it), a report sheet, the switch's tray, an answer bubble, the example listing and the search field's list: white at 80% falling to 58%, an 18px blur with the colour behind raised, a 1px edge of ink at 38% (58% on a busy map), a white rim inside and a line of light along the top. *Bead*: every filled button, the visitor's bubble and the chosen side of the switch keep their colour and take a line of light along the top and a shade at the foot. The stage's map lies under a plate: a cut edge round its frame and a lit rim over the map. On the ink close the email field is clear glass on the dark. Text on glass keeps its contrast: the frost is never thinner than 56%. With transparency turned down, or where nothing can be blurred, every piece goes back to its plain surface. An element that blurs what is behind it must not sit inside a parent with `isolation: isolate` or a `backdrop-filter` of its own, or it will blur only that parent.

**The Lying On Top Rule.** A shadow means "this is a separate thing resting on what is under it": a sheet, a pinned card, a floating control, the field. Product cards, stage panels, filled buttons and bubbles are flat at rest and stay flat on hover.

**The Faded Edge Rule.** A map with no frame meets the paper by fading into it, with a mask on the drawing alone. What is drawn over the map (areas, corners, names, pinned cards) is on a sheet of its own and never fades.

**The Covered Card Rule.** A card under another recedes by scaling its body to 0.97 and taking a 6% veil of ink, driven by scroll. Its header row does neither, because it is still a working link.

## Shapes

Three kinds of corner, each with a meaning. **Square** (0 radius, ink border, 9 to 17px): anything that marks a point, can be picked up, or is one counted unit, such as an area's corners (12px with a 2px border on the stage, 8px with a 1.5px border on the first screen's picture), a stop on the How line (11.5px), a chart's last value, the contents rail, the chosen question, the slider's thumb, the typing indicator, a night on a calendar (17px, 1.5px border). **Round** (full radius): a listing among many on a map being read (map dots, the key, a chart's hover dot), a button, and the search field. **Softly rounded**: surfaces, in a ladder of 6px (sheet, switch options, focus on inner controls), 8px (a card pinned on the first screen's picture), 10px (a row of the place list, the listing card), 12px (the switch, the select, the email field, the controls that float on the stage's map), 14px (the map frame), 16px (the place list, whose 10px rows sit 6px inside it) and 26px (the product cards).

Message shapes take the card's 26px on three corners and 6px on the corner nearest the speaker (bottom-right for the visitor, bottom-left for the answer and for a map sent as a message).

Lines: 2px for anything drawn as a shape (an area's outline in olive, chart lines and icons in ink, the selected tab's underline), 1.5px for a line that leads somewhere on the ground (the How line and its fork, underlines on links) and for the polished rim of the search field's glass, 1px for the glass's cut edge and for a hairline that ties one thing to another (in ink from an area to its pinned card, in olive from the stage's area to a panel), for a pinned card's ink edge and for every `line` divider and outline. Joins are round on the stage, in charts and in icons; the areas on the first screen's picture are drawn hard-cornered (mitred), over a thin white edge (5px, of which about 1.5px shows each side of the line) that lifts the line off the streets. Node corners are mitred. Hatching (ink on white at 135 degrees, 1.5px in 4px) means "taken but not counted": a night the owner blocked, the calendar's raw share. Dashed rules appear once, for a report finding the team has not written yet.

**The Square Corner Rule.** If it can be dragged, chosen, or stands for a point on a map, a line or a chart, it is a square with an ink border: white when empty, olive when hovered or held, ink when chosen, light orange when it is the thing being counted.

## Components

### Buttons
Calm and exact: one shape, three fills, and each fill means something.
- **Shape:** fully rounded (9999px), 46px tall with 22px side padding, 15px at weight 600, an arrow (18px, 2.4 stroke) after the words. 48px with 20px padding inside the search field; 40px in a card's header row; 42px on the stage in windows under 760px tall.
- **Action (olive, white text):** the page's filled action, the next step with the visitor's place: "Show me" in the search field, and "Open the Playground, it's free" on the stage (under the sentence on phones, in the Playground panel from 640px) and in the Playground card.
- **Solid (ink, white text):** the nav's "Open the Playground" and a request to the team ("Ask for a report", "Ask for access").
- **Paper (beige, ink text):** the submit on the ink close; hover goes to white.
- **Hover / Active:** the fill deepens over 0.15s and the arrow moves 3px in its direction over 0.2s; pressed scales to 0.97. Focus is a 2px ink outline offset 3px (paper on the close).

### Text links
Ink at weight 600 with a 1.5px underline 4px below the baseline; on hover the underline drops to 7px over 0.2s. A link that goes down the page carries a down arrow that moves 3px on hover. Nav, footer and credit links are not underlined until hovered. A link inside a line of text keeps a 44px target with negative margins so the line does not move.

### Navigation
A fixed 72px bar: brand mark (32px) and wordmark left; three text links at 15px weight 500 and the solid button right. Transparent over the first screen, so the picture runs up under it; after 60px of scroll it takes the ground and a hairline. Below 768px the links fold into a menu of 48px rows divided by hairlines, each product with its icon at 24px, then a full-width solid button.

### Place search
The first screen's way in, and the largest control on the page.
- **Field:** glass, fully rounded, 60px tall. The slab is nearly clear, with the faintest smoke (ink at 5%) so that the light on it can be lighter than the paper: a white sheen along its top that thins out by the middle, its edges a little brighter all round, a bright line along its lower lip and, above that lip, the green of the glass's thickness (olive at 32%). Round it a 1px cut edge (ink at 56%, 3:1 on the paper) with a 1.5px polished rim inside, which is bright where it catches the light: on top at one point and, across from it, underneath. Under it the "way in" shadow. Whatever is behind it is blurred (14px) and a little more saturated. The point where the light falls (`--gx`, 24% along at rest) follows a mouse along the field and glides to 76% when the field takes the focus; with reduced motion it stays put. Inside: a 20px search glyph in `muted`, the text at 17px, a muted placeholder that says what to type, and the action button ("Show me" and an arrow) inside its right end, with a line of light along its own top edge. With transparency turned down (`prefers-reduced-transparency`) the field and its list are plain white; with forced colours the cut edge is a real border. Below 480px, and between 1024 and 1179px where the words' column is narrow, the button is its arrow alone, a 48px circle.
- **Focus:** the 2px ink ring goes round the whole field, offset 3px; the input itself shows none.
- **List:** opens 10px under the field at its full width: a sheet of the same glass, frosted (white at 80% falling to 64%, over a 22px blur of whatever it opens on, which below 1024px is the map), a 1px edge of ink at 34% with a white rim inside, 18px radius, 6px padding, the deeper shadow. Up to six rows of at least 44px on a 10px radius: the place's name at weight 600 with its Greek name after it in `muted`, what kind of place it is beneath at 13px where that helps, and its listing count at the right in tabular figures. The current row is olive at 14%. No match is one muted sentence in the list, never an empty box.
- **Picking** a row or pressing the button hands the place to the stage and moves the page down to it. If the list of places cannot be fetched, the sentence under the field says so and the button opens the Playground.

### The picture and its pinned figures
A tour of six drawn street maps of real towns (Limassol, Nicosia, Paphos, Ayia Napa, Larnaca, Protaras), each generated from OpenStreetMap data and fetched one stop ahead: land, sea and shore, parks, beach, single buildings and two weights of street, with no labels and no boundary lines of its own. One town shows at a time, and the picture runs by itself (see Motion). On it:
- **Listings:** the town's short-lets as small round dots, `dot-out` until an area closes round them, then their fullness step inside its ring. A crowded area is thinned to dots that stand apart, so the shades stay readable.
- **Areas:** three, a few streets wide, each a firm 2.5px olive line with hard corners over a light olive tint (12%, lighter than the stage's 22%, so the streets and the listings read through it), with a thin white edge under the line, and an 8px white square with a 1.5px ink border at every corner.
- **Lead:** a 1px ink hairline from one corner of an area to its card.
- **Pinned card:** white, a 1px ink edge, 8px radius, the "pinned" shadow. A small table at 13px/20px in three columns 10px apart: the area's name across the top at weight 600 (15px from 1440px), then a line to each market inside the area. "Short-let", its count, a night's median price and how full ("58% full"); "Long-let", its count, a month's median rent; "For sale", its count, the median asking price. The market's name and the unit words are `muted`; the count (ranged right) and the figures are ink at weight 600, tabular. The short-lets are the dots on the map, so their line alone starts with an 8px ringed dot in the fullness step the area falls in; the other two names are indented to line up with it. Between 1024 and 1439px the prices go without "a night" and "a month". A market with fewer than five listings gives its count and "too few". Along the card's foot, under a 1px ink rule, a 6px bar filled to the occupancy in that fullness step, ended by a 1px line of `occ-ring`. About 255px by 110px from 1440px, 210px by 103px below. Cards are set over open water where they can be. An area with too few short-lets to quote is drawn without its card and its lead.
- **Pointer:** a small drawn arrow, white with a 1.6px ink line, that goes round each area's corners as it is drawn.
- **Name:** the town's name once, at 17px weight 600 with a halo in the land colour: the largest word on the map.
- **Below 1024px:** the picture is a band that shows a few streets and follows the area in hand. Cards are not pinned on the map there: one card is docked in the band's bottom-left corner for the area the band is on, coming when that area closes and going when the band moves on; the town's name sits in its top-left corner at 15px; and only the area in hand is tinted, the others keeping their line and their listings.
- **Credit line:** one 11px muted line at the picture's bottom-right (under the band below 1024px): the control that stops the tour, as ink words at weight 600 with a 12px glyph ("Pause the tour", "Play the tour") and a 44px target, then the key to the dots ("Short-lets this season: emptier", four ringed dots, "fuller"; "this season" left out below 1440px and the whole key between 1024 and 1279px), then the credit naming OpenStreetMap contributors and OpenMapTiles.

### Switch
Options in a white tray (12px radius, 3px padding, hairline), flat on its card. The chosen option is solid ink with white text on a 6px radius; an unchosen one tints olive on hover. Options are 44px tall at 15px weight 600. It is used once, for the kind of report ("For a property", "For an area") at the head of the Reports card's contents; from 1024px it spans the contents rail in two equal halves at 13px, and 15px again from 1280px. The stage's map no longer carries a switch: there is one map, and the visitor zooms it.

### Cards / Containers
- **Product card:** 26px radius, 1px hairline, flat, in its own ground: white for the Playground, the olive tint for Reports, the orange wash for the Connector. A 56px header row holds the icon (40px), the name and the card's one action, under a hairline. Body padding 16px on phones, 24px from 640px, 20 to 28px from 1024px.
- **Stage panel:** not a card. A row in a hairline-divided list: icon, name, one muted sentence, one live line, a chevron; it opens by growing its row over 0.32s.
- **Map frame:** 14px radius, hairline, the map above a 48px white bar that holds the count, the key and Reset. On phones the frame is the map alone and the count, key and credit sit under it on the ground.
- **Report sheet:** white, 6px radius, no outline, the sheet shadow; a running head and a pager divided by hairlines.
- **Listing card:** the example listing as its site shows it: white, hairline, 10px radius, a 44px light-orange square with a 1.5px ink border standing for its picture, then its kind at weight 600, its place and its price in `muted`. Always followed by the note "An example listing".
- **Messages:** the visitor's in olive with `visitor-ink` text at weight 500, the answer on white with a hairline; 16px (17px from 640px), up to 35em wide.

### Inputs / Fields
- **Email field (on ink):** transparent, 1.5px `close-edge` outline, 12px radius, 48px tall; the outline goes to paper on hover and focus.
- **Select (phones, report contents):** white, 1px `edge` outline, 12px radius, 48px tall, a drawn 2px ink chevron.
- **Slider:** a 2px track filled in ink up to a 16px square white thumb with a 2px ink border; the thumb fills olive and grows to 1.2 on hover; the focus ring goes on the thumb.
- **Tabs:** text at 15px, muted until hovered, ink at weight 600 when selected with a 2px ink underline on the row's own rule; an overflowing row fades at the hidden side and shows an arrow.
- **Choice list (questions, contents):** rows divided by hairlines, each behind a 12px square corner that is ink when chosen.

### Brand mark and product icons
The mark is a five-sided drawn area filled light orange, stroked in ink (2.2), with five square handles in the ground colour. The three product icons are drawn on a 32px grid in the same hand: a 2px ink line with round joins, small square white nodes, and exactly one shape filled with the marking orange. Each has one part that makes one small move when its product is opened (the pointer reaches its corner, the chart line draws, the cable seats). At the last stop of the How line they appear at 40px beside the product's name and one muted line.

### The area on the stage's map
The stage has one map in one frame: the island, a single generated picture (sea, coast, forest, built-up ground, lakes and three weights of road, unlabelled), shown whole at first, enlarged in steps (2, 4 and 8 times) and, for a place picked in the search, opened on the ground round that place. On the whole island five towns are named by the page, each set in the sea beside it with a halo in the sea's colour (Nicosia on land); closer in, the towns in the window are named at their centres, and a picked place at its own. The area is a 2px olive outline with round joins and a 22% olive fill laid over the picture, with a 12px white square handle at each corner; held, the fill deepens and the outline thickens to 3px. Listings are dots: fullness steps with their ring inside the line, `dot-out` outside, drawn smaller on the whole island where a town is a few dots wide. Inside the line they are thinned until they stand side by side, never one on another, so a dense town is beads with readable shades and not a blot; outside it a finer grey stipple fills in between, so a town the area does not hold still reads as a town. A 1px olive line runs from the area to the open product panel; the lines to the others are `wire`. One corner sends out a slow ring, with the invitation "Drag a corner, or the whole area" set beside it like a place name, until a corner is first moved. The bar under the map counts what is inside the line and, for a picked place, says both counts ("421 short-lets inside, of 545 in Paphos").
- **Zoom control:** floats on the frame's top-right corner, 10px in (12px from 640px): plus over minus, two 44px squares on one white surface with a hairline, a 12px radius and the floating shadow, divided by a hairline, each an 18px ink glyph. Hover and press tint olive; a step that cannot be taken stays in place and steps back in colour. Once the map is zoomed, "Whole island" appears under it on the same surface, smaller (36px tall, 13px weight 600, reaching a 44px target).
- **Moving the map:** a mouse takes the map by its ground (a grab cursor) and a double click or double tap goes in on that point. Once the map is zoomed in a finger takes it by its ground too, or by a quick swipe across the area; on the whole island a finger's swipe scrolls the page.
- **Draw an area here:** the same white surface as a 44px button at 15px weight 600 on the frame's bottom-left corner, offered whenever the map is zoomed in, and whenever nothing of the area is in the window to take hold of.

### The How line
One listing followed along a 1.5px `rail` line with five stops. Each stop is an 11.5px white square with a 2px ink border; the first, where the listing is published, is filled light orange. Each stop shows the listing as it is at that point, small and in the page's own marks: the listing card; a month of its calendar as thirty 17px squares (booked in the third fullness step with its ring, blocked in ink hatching, free in white with a hairline) over a key of the same three marks at 9px; a small map of three nested outlines (`wire`, `rail`, then an olive area with square corners) holding the listing as a light-orange square, with its place as a muted trail beneath; two bars 13px tall, the hatched one for what the calendar shows and the orange one for what is counted, each with its figure at 16px weight 600 and the nights it stands for; and the three products. Real counts and the time of the last read appear under their stops at weight 600 when they can be had and are left out when they cannot.

### Charts and tables
One 2px ink line between two hairlines, ending in a 9px square node; ink bars with their value above and name beneath; the value axis shows only its two ends and the time axis up to three ticks, at 11px. Tables are hairline rows; the leading figure of a row is ink at 600 and the others step back to muted.

### Motion
One easing, `cubic-bezier(0.16, 1, 0.3, 1)`. State changes take 0.15 to 0.2s; a panel opening takes 0.32s. Below the first screen each surface has one authored moment and plays it once: on the stage the handles drop, the outline closes, the fill and the listings arrive and the lines reach the panels; in the cards lines are traced, bars grow from the baseline, a sheet is dealt on from the right, a message comes up from the composer. The first screen's picture is the one thing that runs on. It arrives complete on the first town and holds (3.6s). Then, for each town in turn: the map slides in from the east as the last leaves to the west (3% of its width over 1.2s, fading over 0.9s), the listings appear west to east, and a pointer draws each area corner by corner (0.17s a corner), each corner dropping in as it is reached and the line traced behind it; when the line closes the tint and its white edge come in (0.3s), the listings inside take their colours and the card rises 6px into place (0.4s), and the area stays to be read (1.1s; 1.7s in the band) before the pointer goes on; after the third area everything holds for 2.2s more and leaves (0.45s). In the band the map moves from one area to the next over 0.7s, and the docked card goes as it moves. The tour waits while the picture is out of view, the tab is hidden or the visitor is typing in the search field, and its pause control stops it where it is. "How the numbers are made" has no motion of its own. No figure counts up in a card. Everything is in its final state before and without the motion, and `prefers-reduced-motion` removes all of it (the first town stays, complete, with no pause control; the typing squares become words; the pulsing corner is filled instead).

## Do's and Don'ts

### Do:
- **Do** draw anything new in the page's own hand: a 2px olive outline for an area, square nodes with an ink border, a 2px ink line for a chart or an icon, and at most one shape filled with the marking orange.
- **Do** keep olive for what the visitor does or has drawn and light orange for what is counted or is the brand's.
- **Do** keep the ground beige on every screen, and let a frameless map fade into it.
- **Do** take every colour from a `--th-*` role, and mix a hairline from the card's own ground when the ground is tinted.
- **Do** make a new map picture from open map data in the map colours recorded here, with no labels and no boundary lines of its own, and credit it on the page.
- **Do** pin a figure to the place it describes: a white card with a one-pixel ink edge and the pinned shadow, joined to its area by an ink hairline, and say on the card what each figure is of.
- **Do** set figures in tabular numerals at weight 600 with the unit beside them at 13px in muted, and say under each block what it covers.
- **Do** send a stale figure to `pending` rather than hiding it, and leave out a figure that cannot be had rather than standing something in for it.
- **Do** give every pressable thing a 44px target and a visible 2px focus ring, placed on the square itself for handles and sliders and round the whole field for the search.
- **Do** put charts, tables and lists straight on the card, divided by hairlines.
- **Do** make a new surface's one moment of motion the way the thing would be drawn, and leave everything in place under reduced motion.

### Don't:
- **Don't** use teal or tangerine; both were tried on this page and dropped by the owner.
- **Don't** open a screen on a dark ground; a dark first screen was built and rejected. The close is the one ink surface, and it is the palette turned over.
- **Don't** use the marking orange for text, for a button, or without an ink line or ring around it.
- **Don't** add pill or badge labels, eyebrow lines above headings, monospace labels, uppercase or letter-spaced labels, or logo tiles.
- **Don't** add a second typeface or a type size outside the seven.
- **Don't** put a shadow on a product card, a stage panel, a filled button or a hover state; a shadow is for something lying on top of something else, as a control floating on a map is.
- **Don't** round a handle or a node, and don't square a listing dot on a map of many listings.
- **Don't** put a frame, a label layer or administrative boundaries on a generated map picture.
- **Don't** use a gradient as decoration; the only gradients are the fade at the edge of something that scrolls or of a frameless map, the slider's two-colour track, and the ink hatching that means "blocked".
- **Don't** let a figure count up, flash or animate on the cards; it shows its true value throughout.
- **Don't** invent testimonials, client names, prices or plan contents.
