---
name: Plotsights landing
description: A beige page that asks for your place and shows drawn towns one after another with areas and their figures pinned to them, then gives each of the three products a flat panel of its own holding one working thing; an olive area does the work and saffron marks what is counted.
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
  mark: "#E9A22B"
  occ-1: "#F8EDD2"
  occ-2: "#EEC987"
  occ-3: "#E9A22B"
  occ-4: "#AE6800"
  occ-ring: "#734300"
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
  card-connector: "color-mix(in srgb, #E9A22B 18%, #FBFAF4)"
  close: "#161C11"
  close-ink: "#F4F1E8"
  close-muted: "color-mix(in srgb, #F4F1E8 74%, #161C11)"
  close-edge: "color-mix(in srgb, #F4F1E8 46%, #161C11)"
  close-line: "color-mix(in srgb, #F4F1E8 20%, #161C11)"
typography:
  display:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(3rem, 4.4vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.25rem, 2.8vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  display-phone:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  lede-large:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.5
  figure-large:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.25rem, 4.16vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  statement:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.3
  wordmark:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "26px"
  lede:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "26px"
    fontFeature: "tnum"
  action:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1
  caption:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "22px"
  micro:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
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

# Design System: Plotsights landing

Scope: the public landing page (`apps/web/app/page.tsx`). Every value here is read from the built page: the `--th-*` roles in the "Landing (nav and hero)" block of `apps/web/app/globals.css`, then `apps/web/app/landing-hero.css` (the first screen), `apps/web/app/landing-sections.css` (the product cards and the close) and `apps/web/app/landing-how.css` ("How the numbers are made"), and the five map pictures in `apps/web/public/landing/` (six towns and the island), whose colours are baked in by `apps/web/scripts/build-hero-town.mjs` and `build-island-map.mjs`. The Playground under `/dashboard` is still a separate, dark surface (Inter and Barlow Condensed, a green ramp) and is not described here; the owner decided on 2026-10-11 that it moves onto this page's beige, olive and orange and Google Sans, which is not yet done.

## Overview

**Creative North Star: "The Drawn Area"**

The whole page is drawn with the tool the product hands the visitor: an area drawn as an ink line through round olive corner dots you can pick up, the hand the brand mark is drawn in (2026-10-12; until then an olive outline with square white corners). The brand mark is that area set as the "o" of the name: a line in the letters' own ink through five olive corner dots, with nothing inside (owner, 2026-10-12: "not filled with colour", "use the O of plotsights for the logo instead of outside of it", "black lines for the logo and then the dots that join these lines to be the olive green of our palette"). From 2026-10-10 until then it stood beside the name, snapped to the map's dots with an orange wash ("Actually use J"). The first screen shows them being drawn: a tour of six drawn town maps that runs by itself, three areas a few streets wide on each, every one answered on a small white card with how full its short-lets are and what a night costs, next to a search field that asks the visitor for their own place. The second screen, the stage, is one map of the island that zooms, with one such area on it whose corners drag, joined by thin lines to three product panels. The product icons, the chart ends, the report's contents rail, the chosen question, the slider's handle and the five stops of "How the numbers are made" are all the same square corner. Nothing on the page is illustrated in another hand.

The ground is a warm beige on every screen and nearly everything on it is ink. Two colours carry meaning and they do not trade jobs: olive works and is the brand's own (every drawn area's corner dots and tint, the dots of the wordmark, the name picked out of the headline, the one filled action, the visitor's own words) and saffron marks (the three product icons, the listing that is being counted, a booked night, and in four steps how full each listing has been). The map pictures (six towns and the island) are generated from OpenStreetMap data in the page's own quiet map colours; they carry no labels of their own and no boundary lines, they are credited on the page, and what names appear on them are set by the page in its own type. The page ends by turning the palette over: paper on ink, for the close and the footer only.

Density rises as the visitor goes down. The first screen holds a headline, one sentence, one field, the three products named under it, and one picture. The stage and the cards are working instruments set in small, exact type with tabular figures. The system is flat: hairlines divide, and a shadow appears only under something that lies on top of something else.

Confirmed rejections: teal and tangerine are both out of the palette; a dark first screen was built and rejected by the owner, and the ground stays beige; the page must not read as AI-generated (no pill or badge labels, no monospace labels, no logo tiles) and must not read as a research publication. Google Sans is pinned by the owner.

**Key Characteristics:**
- One drawing vocabulary: an area outlined in ink at 2px with round olive corner dots, as the brand mark is; a square with an ink border for what is chosen or stands for a point on a line or a chart.
- Olive works, saffron marks. Ink does everything else.
- Beige ground on every screen; the close alone is ink.
- Maps are drawn from open data in the page's own colours, unlabelled, and fade into the paper or sit in a hairline frame.
- One typeface, Google Sans; hierarchy by weight and size, never by case or a second face.
- Flat surfaces divided by 1px hairlines; one soft ink shadow, kept for things that lie on top.
- Every figure is tabular and exact; a stale figure steps back in colour, it never disappears.
- Motion is one authored moment per surface, drawn the way the thing would be drawn; the first screen's picture alone runs on by itself, and can be paused. Under reduced motion everything is simply there.

## Colors

A warm paper palette in which two hues have fixed jobs and ink carries the rest.

### Primary
- **Working Olive** (`a`, `action`, `visitor`): every drawn area's corner dots and its tint over the land (its outline is ink) (22% as a role, `area-land` where a name's halo sits on it), the line from the stage's area to the open product panel, the filled action with white on it (7.1:1), the visitor's bubble in the conversation, the text selection, and the fill a square marker takes when it is hovered or held (a drawn area's own corner dot is olive at rest and ink in the hand). Hover on the button deepens to `action-hover`.
- **Rail** (`rail`): the olive at 70% over the ground. The line of "How the numbers are made", its fork to the three products, and the middle ring of that section's small map. It is a local property of that section, not yet a `--th-*` role.

### Secondary
- **Marking Orange** (`mark`): the one filled element in each product icon, and the listing being followed in "How the numbers are made" (its picture on the listing card, its square on the small map, the first stop of the line). It always sits inside an ink line; it is never text and never a button (1.9:1 on the ground).
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
**The Olive Works, Saffron Marks Rule.** Olive is for what the visitor does or has drawn, and for the brand itself (the wordmark's dots, the name in the headline); saffron (`#E9A22B`, chosen 2026-10-12 from six compared, replacing the light orange `#F2A154`) is for what is counted. Neither does the other's job, and neither is used as decoration.

**The Beige Ground Rule.** Every screen the visitor works on is the beige ground. A screen does not open on ink, on a tinted wash or on a picture with a frame of its own colour.

**The Ring Rule.** A pale orange never stands alone on a pale ground. A listing dot and a booked night wear the `occ-ring`; in the product icons the orange sits inside an ink line.

**The Step Back Rule.** A figure that no longer describes the area on screen goes to `pending` until the new one arrives. It is never hidden, blurred or replaced by a spinner.

**The Turned Over Rule.** The close is the same palette inverted (`close` and `close-*`), not a second palette. The focus ring inverts with it.

## Typography

**Display Font:** Google Sans (with sans-serif), self-hosted variable 400 to 700, Latin, Latin Extended and Greek. Pinned by the owner.
**Body Font:** Google Sans. There is no second face. Free faces close to Gilroy were compared on 2026-10-12 (Figtree, Poppins, Urbanist, Red Hat Display, Montserrat, Outfit, Geologica, Google Sans Flex), and the owner kept Google Sans for now.

**Character:** One friendly geometric sans doing every job, from a 68px headline to a 15px chart tick. The page gets its range from size and a ladder of weights, with tight tracking only at display sizes.

**The weights.** 400 text. 500 quiet labels (an unselected tab, a question, the visitor's bubble, the words picked out of the first screen's sentence). 600 labels, actions and figures. 700 emphasis inside text, a title inside a card (a report page's title, the calculator's sum) and the display role: the headline, the section headings, a card's name, the wordmark (`--th-display-weight`). 700 is the face's heaviest: nothing asks for 800 or 900, which the browser would fake.

**The floor, 2026-10-12.** The owner: "in a website all letters should be clearly visible, big and readable to the customer". Nothing on the landing page is set under 15px, at any width. The sizes are four roles, each a token beside `--th-font` in `globals.css`, and every text rule takes one of them:

| role | token | size | was |
|---|---|---|---|
| fine | `--th-text-fine` | 15px | 13px |
| small | `--th-text-small` | 16px | 15px |
| body | `--th-text-body` | 18px | 17px |
| lead | `--th-text-lead` | 20px | 20px |

Above them are only the display sizes: the first screen's 24px sentence, the 28px wordmark, and the heading clamps. Line heights went up with their sizes at the ratio they had (15/20 became 16/22, 17/24 became 18/26). Where the bigger type pressed on a fixed layout it was given room, never cut or set smaller: the tour's lowest cards are pinned a little higher and its credit row runs on to the left to stay on one line; table rows close up in short windows (the stage's under 860px tall, the cards' under 880px) so the stage still fits a 768px window and every card still pins; between 1024 and 1279px the stage's panel column is held to 400px; a bar chart leaves out every other label where the bars stand closer than their labels are wide (a phone); a chart's caption wraps, with its readout laid over it. Text sizes given in the component notes further down predate both this and the 2026-10-11 scale: 11 or 13px there reads 15, 15 reads 16, 16 to 18 read 18, and 18 or 20 for a title reads 20. Sizes of squares, dots, glyphs and gaps did not change.

### Hierarchy
- **Display** (700, `clamp(3rem, 4.4vw, 4.25rem)` from 1024px, `clamp(2.5rem, 7vw, 3.5rem)` below; line-height 1.04; -0.025em; balanced): the first screen's headline only, "Plot an area on the map. Get the insights.", in three lines. In it "Plot" and "sights" of "insights" are set in `mark`, so the name is read out of the sentence; nothing else on the page sets words in the marking orange (it is 1.9:1 on the ground, and is used here on the owner's word, at display size only).
- **Headline** (700, `--th-heading`, `clamp(2.25rem, 2.8vw, 2.5rem)`: 36px on a phone, 40px from 1440px; line-height 1.04 to 1.08, -0.025em): a product's name at the head of its panel (its icon beside it), the heading of "How the numbers are made" and the close's heading. Since 2026-10-14 there is no separate card-name size (it was 30px) and the heading is a step smaller (it was up to 44px), so one size does the section heads.
- **Figure** (400, `--th-text-figure`, `clamp(2.25rem, 4.16vw, 3.75rem)`: the headline's size on a phone and the display's at 1440px, so it adds no size of its own; tabular, -0.03em): a figure that is the point, set large at the regular weight in PriceLabs' manner (the owner's reference for professional type, 2026-10-13): the Playground panel's tipping point and the three counts that head "How the numbers are made".
- **Statement, 24px** (500, `--th-text-statement`, line-height 1.3 to 1.35): a product's claim under its name and the sentence that opens the panels, from 640px (20px below). A statement is a paragraph, never a heading.
- **Wordmark** (700, 28px, -0.035em): the name with the brand mark as its "o"; 20px in the footer. It is the display role at the brand's own size and tracking.
- **24px:** the first screen's sentence from 1280px, on a 27em measure, with "Updated every day" and what the visitor gets picked out in ink.
- **Lead, 20px** (600 as a title, 20px/26px): a product's name in a stage panel, a stop's name on the How line, the town's name on the first screen's map; 700 for a report page's title. At 400, a section's lede from 640px, the tie line from 640px, and the first screen's sentence on phones and between 1024 and 1279px.
- **Body, 18px** (400, line-height 1.45 to 1.5, or 26px): everything read as running text, in the full ink (since 2026-10-14: running text in `muted` read as grey and unfinished; `muted` is for notes and units). The lede on phones, a panel's sentences, notes, panel text, the report page, the conversation, form input and the search field's text; a figure at weight 600 in tabular numerals; an action at weight 600 (buttons, the nav's links at 500, text links, switch options, tabs at 500 until selected). A card's opening sentence is never larger than the ink statements under it.
- **Small, 16px** (400, 22 to 24px line-height, `muted`): a figure's unit beside it, what a figure block covers, chart captions, notes under controls, what kind of place a row is, the tool a reply came from (600), the words on a card over the first screen's map. Captions wrap rather than cut off with an ellipsis.
- **Fine, 15px** (600): place names on the stage's map (with a halo in the colour beneath them), a bar's value, the "sample" and "an example listing" notes, the "Demo data" tag (in a 22px box), a tour card's occupancy label; at 400, chart axis ticks, the map credits and the key beside them (the tour's pause control there is 600, ink).

### Named Rules
**The Four Roles Rule.** Running type is one of the four role tokens, 15, 16, 18 or 20px, plus the 24px statement, the figure and the heading clamps for display. The page uses eight sizes in all (15, 16, 18, 20, 24, 28 for the wordmark, 40, 60); it used nine, with a 30px card name and a 43px heading, until 2026-10-14. A new element takes a token, never a literal size; a role that seems to need a size between two steps takes the nearer one and is told apart by weight or colour. Nothing goes under the fine size.

**The Weight Not Case Rule.** A label is a sentence-case word at weight 600. There is no uppercase and no monospace anywhere, and tracking is never what makes something a label; the name of a body of water on a map is spaced out (0.08em) as maps do.

**The Tabular Rule.** Every surface that shows figures sets `tabular-nums`, and a figure's unit is smaller and muted beside it, never in a separate column.

**The Bold Twin Rule.** Where choosing an item makes it bolder (a tab, a contents entry), its bold setting is laid out invisibly under the regular one, so selecting moves nothing.

## Layout

One centred column up to 1440px wide with gutters of 16px on phones, 32px from 640px and 64px from 1024px. Breakpoints are 640, 1024 and 1280px (the nav alone switches at 768px, the How line at 1100px, the search button's words at 480px), and the stage also answers to window height (860 and 760px) so that its map and its action stay inside one screen on a laptop. The product panels need no such steps since they stopped pinning (2026-10-14).

- **First screen.** From 1024px one screen tall (at least 720px). The words sit in the left 42% of the column, at most 580px wide and vertically centred: headline, sentence, then the search field (up to 540px wide). Nothing else is on this screen: the three products are introduced on the second (2026-10-12). The picture is not in the column: it fills the right 58% of the screen from top to bottom, runs off the right edge, and fades into the paper on its left (over 24% of its width), under the nav (15%) and at its foot (6%). It has no frame. Below 1024px one column in reading order, and the picture becomes a band under the words, 364px tall (520px from 640px), the full width of the screen, fading in from its top. The band is a window onto a larger map (at least 860px wide), centred on the area in hand and never so far over that the map's own edge shows; the cards pinned beside their areas on the whole picture give way there to one card docked in the band's corner. The picture only plays: nothing over it takes a click or the focus and the cursor is the default one (an offer to plot on it was removed on 2026-10-12, since drawing belongs to the second screen only).
- **The stage.** From 1024px a 7:5 grid, 40px apart (56px from 1280px), one viewport tall between 700 and 860px: the framed map on the left, three product panels on the right as one list divided by hairlines with at most one open at a time: a header opens its panel and, pressed again, closes it. The panels were replaced by a table of the area's figures for a day (2026-10-11) and put back on the 12th: the owner prefers the products on the second screen, "with the line syncing to the map", and off the first screen. The heading and its sentence share the row above, their bottoms aligned. Thin lines join the area to the panels on desktop only.
- **The panels** (since 2026-10-14; until then a stack of cards that pinned and covered one another, ended at the owner's word: "no card may be covered before it has had its full screen"). One statement opens them ("Three ways to use it: …"). Then three panels up to 1312px wide, 40px apart from 1024px, each a section of its own on its own ground that nothing ever covers. Each holds the product's name as its heading, one claim, a sentence or two, its one action, at most one line of small print, and one working thing. From 1024px the three are composed three ways, so neighbours never share one: the Playground is *split* (the words in 5 columns, the object in 7), Reports is *mirrored* (the sheet in 7, the words in 5), the Connector is *stacked* (the words across the top in the same 7:5, then the conversation beside the questions). In a split or mirrored panel the words are one block at the top, beside the object. Below 1024px a panel is one column: the words, the object, then the action again.
- **How the numbers are made.** Follows the panels, on the ground, with no sheet's edge or shade of its own. The heading and its sentence share a 7:5 row as on the stage. Under them one line with five stops: from 1100px it runs left to right across five columns of slightly unequal width, each stop a square on the line with its name, its exhibit in a 164px row, a sentence and a fact beneath; at the fifth the line turns down and forks to the three products. Below 1100px the line is a rail down the left with the stops stacked beside it.
- **The close.** A 7:5 grid on ink: heading and sentence left; on the right the actions ("Email the team", "Or open the Playground") over a line on who the team is, aligned to their bottoms. The footer under it: the wordmark, where the listings come from and the map credit, the team's address and the year.

Rhythm is small and even: 4 to 8px inside a row, 12 to 20px between parts of a block, 24 to 32px between blocks, and 64 to 104px only above and below a full section. Every pressable thing reaches a 44px target even when what shows is 12px.

**The Card Is The Surface Rule.** Charts, tables, tabs, scales and lists sit directly on their panel, divided by hairlines. They do not get boxes of their own; the things that are boxed are objects in their own right (a sheet of paper, a message, a switch, a listing, a figure pinned to a map).

## Elevation & Depth

Flat. Depth is said with hairlines and with tone: the ground, white, the olive tint, the orange wash. There is one shadow family, a soft ink shadow at 35% (`color-mix(in srgb, ink 35%, transparent)`) pulled in tight under the object, and it is used only where something lies on top of something else: paper on a card, a card or a control over a map, the field and its list over the first screen. A card pinned on the first screen's picture also has a one-pixel ink edge, because it sits on a busy drawing and not on a plain ground; that edge belongs to the card, not to the shadow family. Glass is kept for what floats over the first screen's map (see The Glass Rule).

### Shadow Vocabulary
- **Sheet on a card** (`box-shadow: 0 1px 2px -1px var(--th-shadow), 0 20px 30px -20px var(--th-shadow)`): the report sheet lying on the Reports card. It shortens in short windows so it stays inside the card.
- **Sheet in a panel** (`box-shadow: 0 10px 20px -12px var(--th-shadow)`): the sample report page in the stage's Reports panel.
- **Pinned to a map** (`box-shadow: 0 8px 16px -10px var(--th-shadow)`): an area's card on the first screen's picture, pinned beside its area or docked in the band's corner.
- **Floating control** (`box-shadow: 0 8px 18px -10px var(--th-shadow)`): the zoom control on the stage map's top-right corner and the "Draw an area here" button on its bottom-left. The example listing's card in "How the numbers are made" is flat since 2026-10-14: it lies on the paper, not over anything.
- **The way in** (`box-shadow: 0 2px 3px -1px` at 24% ink and `0 20px 32px -18px` at 50%): the glass search field, a contact shadow and a deep one, with a soft white light set in the middle of the deep one (the light the glass gathers). Its open list drops further (`0 26px 44px -22px` at 50%).
- **Knock-out ring** (`box-shadow: 0 0 0 2px var(--th-surface)`): around a chart's hover dot, so it reads off the line. Not a shadow in effect.

### Named Rules
**The Glass Rule** (owner, 2026-10-14, narrowing his choice of 2026-10-09, "great I prefer it"). Glass only where something floats over the first screen's map. That is three things: the nav once the page moves under it (frost: the paper's tone at 80% falling to 56%, a 22px blur), the search field (*clear*: a slab lying on the paper, said by its edges and its light, in `app/landing-hero.css`; its list is the same glass, nearly solid), and the cards pinned on the tour's areas (frost: white at 66% falling to 42%, a 22px blur, a soft ink edge with a white rim inside). The stage's map controls keep frost for the same reason, though the stage is not mounted. Everything else is flat: the three product panels in their own grounds, the report sheet (white paper with its one soft shadow), the chat bubbles, the switch, the example listing, and every filled button, which is one fill with no line of light and no shade (the "bead" is gone). The critique of 2026-10-14 found the panels' glass invisible at 93 to 97% and the beaded buttons reading as a consumer app beside PriceLabs' flat ones. Text on glass keeps its contrast: the frost is never thinner than 42% over the map's pale land. With transparency turned down, or where nothing can be blurred, every piece goes back to its plain surface. An element that blurs what is behind it must not sit inside a parent with `isolation: isolate` or a `backdrop-filter` of its own, or it will blur only that parent.

**The Lying On Top Rule.** A shadow means "this is a separate thing resting on what is under it": a sheet, a pinned card, a floating control, the field. Product cards, stage panels, filled buttons and bubbles are flat at rest and stay flat on hover.

**The Faded Edge Rule.** A map with no frame meets the paper by fading into it, with a mask on the drawing alone. What is drawn over the map (areas, corners, names, pinned cards) is on a sheet of its own and never fades.

**No Covered Card.** Nothing on the page slides over anything else (2026-10-14): the cards no longer pin, recede or take a veil.

## Shapes

Three kinds of corner, each with a meaning. **Square** (0 radius, ink border, 9 to 17px): anything that marks a point, can be picked up, or is one counted unit, such as an area's corners (12px with a 2px border on the stage, 8px with a 1.5px border on the first screen's picture), a stop on the How line (11.5px), a chart's last value, the contents rail, the chosen question, the slider's thumb, the typing indicator, a night on a calendar (17px, 1.5px border). **Round** (full radius): a listing among many on a map being read (map dots, the key, a chart's hover dot), a button, and the search field. **Softly rounded**: surfaces, in a ladder of 6px (sheet, switch options, focus on inner controls), 8px (a card pinned on the first screen's picture), 10px (a row of the place list, the listing card), 12px (the switch, the select, the controls that float on the stage's map), 14px (the map frame), 16px (the place list, whose 10px rows sit 6px inside it) and 26px (the product cards).

Message shapes take the card's 26px on three corners and 6px on the corner nearest the speaker (bottom-right for the visitor, bottom-left for the answer and for a map sent as a message).

Lines: 2px for anything drawn as a shape (an area's outline in olive, chart lines and icons in ink, the selected tab's underline), 1.5px for a line that leads somewhere on the ground (the How line and its fork, underlines on links) and for the polished rim of the search field's glass, 1px for the glass's cut edge and for a hairline that ties one thing to another (in ink from an area to its pinned card, in olive from the stage's area to a panel), for a pinned card's ink edge and for every `line` divider and outline. Joins are round on the stage, in charts and in icons; the areas on the first screen's picture are drawn hard-cornered (mitred), over a thin white edge (5px, of which about 1.5px shows each side of the line) that lifts the line off the streets. Node corners are mitred. Hatching (ink on white at 135 degrees, 1.5px in 4px) means "taken but not counted": a night the owner blocked, the calendar's raw share. Dashed rules appear once, for a report finding the team has not written yet.

**The Square Corner Rule.** If it can be dragged, chosen, or stands for a point on a map, a line or a chart, it is a square with an ink border: white when empty, olive when hovered or held, ink when chosen, saffron when it is the thing being counted. The corners of a drawn area are the exception since 2026-10-12: on the first screen's tour, on the stage and in the close they are the brand mark's round olive dots, edged in the map's paper.

## Components

### Buttons
Calm and exact: one shape, three fills, and each fill means something.
- **Shape:** fully rounded (9999px), 46px tall with 22px side padding, 15px at weight 600, an arrow (18px, 2.4 stroke) after the words. 48px with 20px padding inside the search field; 40px in a card's header row; 42px on the stage in windows under 760px tall.
- **Action (olive, white text):** every way into the Playground, so one action has one colour: "Show me" in the search field, "Open the Playground" in the Playground panel, and the nav's "Open the Playground" once the search has scrolled out of view (while the search is on screen the nav's is a plain link at weight 600, so the first screen has one filled action; 2026-10-14). "It's free" left the buttons on 2026-10-14: the free part will sit behind an account (roadmap), and the panel says "Free to explore" in its sentence instead.
- **Solid (ink, white text):** a request to the team ("Ask for a report", "Ask for access").
- **Flat:** every button is one fill (2026-10-14): no line of light along the top, no shade at the foot, no shadow.
- **Paper (beige, ink text):** the submit on the ink close; hover goes to white.
- **Hover / Active:** the fill deepens over 0.15s and the arrow moves 3px in its direction over 0.2s; pressed scales to 0.97. Focus is a 2px ink outline offset 3px (paper on the close).

### Text links
Ink at weight 600 with a 1.5px underline 4px below the baseline; on hover the underline drops to 7px over 0.2s. A link that goes down the page carries a down arrow that moves 3px on hover. Nav, footer and credit links are not underlined until hovered. A link inside a line of text keeps a 44px target with negative margins so the line does not move.

### Navigation
A fixed 72px bar: the wordmark left, the plot as its "o"; text links at 18px weight 500 (Reports, Connector, Ask the team, and from 1024px How it works) and the way into the Playground right (36px apart from 1024px, 20px between 768 and 1024px): a plain link while the first screen's search is in view, the olive button after. Transparent over the first screen, so the picture runs up under it; after 60px of scroll it takes the ground and a hairline. Below 768px the links fold into a menu, on solid paper (not frost), of 48px rows divided by hairlines, each product with its icon at 24px, then a full-width solid button.

### Place search
The first screen's way in, and the largest control on the page.
- **Field:** glass, fully rounded, 60px tall. The slab is nearly clear, with the faintest smoke (ink at 5%) so that the light on it can be lighter than the paper: a white sheen along its top that thins out by the middle, its edges a little brighter all round, a bright line along its lower lip and, above that lip, the green of the glass's thickness (olive at 32%). Round it a 1px cut edge (ink at 56%, 3:1 on the paper) with a 1.5px polished rim inside, which is bright where it catches the light: on top at one point and, across from it, underneath. Under it the "way in" shadow. Whatever is behind it is blurred (14px) and a little more saturated. The point where the light falls (`--gx`, 24% along at rest) follows a mouse along the field and glides to 76% when the field takes the focus; with reduced motion it stays put. Inside: a 20px search glyph in `muted`, the text at 17px, a muted placeholder that says what to type, and the action button ("Show me" and an arrow) inside its right end, with a line of light along its own top edge. With transparency turned down (`prefers-reduced-transparency`) the field and its list are plain white; with forced colours the cut edge is a real border. Below 480px, and between 1024 and 1179px where the words' column is narrow, the button is its arrow alone, a 48px circle.
- **Focus:** the 2px ink ring goes round the whole field, offset 3px; the input itself shows none.
- **List:** opens 10px under the field at its full width: a sheet of the same glass, nearly solid because it opens over the products row (white at 96% falling to 90%, over a 22px blur of whatever it opens on, which below 1024px is the map), a 1px edge of ink at 34% with a white rim inside, 16px radius, 6px padding, the deeper shadow. Up to six rows of at least 44px on a 10px radius: the place's name at weight 600 with its Greek name after it in `muted`, what kind of place it is beneath at 13px where that helps, and its listing count at the right in tabular figures. The current row is olive at 14%. No match is one muted sentence in the list, never an empty box.
- **Picking** a row or pressing the button hands the place to the stage and moves the page down to it. If the list of places cannot be fetched, the sentence under the field says so and the button opens the Playground.

### The picture and its pinned figures
A tour of six drawn street maps of real towns (Limassol, Nicosia, Paphos, Ayia Napa, Larnaca, Protaras), each generated from OpenStreetMap data and fetched one stop ahead: land, sea and shore, parks, beach, single buildings and two weights of street, with no labels and no boundary lines of its own. One town shows at a time, and the picture runs by itself (see Motion). On it:
- **Listings:** the town's short-lets as small round dots, `dot-out` until an area closes round them, then their fullness step inside its ring. A crowded area is thinned to dots that stand apart, so the shades stay readable.
- **Areas:** three, a few streets wide, each a firm 2.5px olive line with hard corners over a light olive tint (12%, lighter than the stage's 22%, so the streets and the listings read through it), with a thin white edge under the line, and an 8px white square with a 1.5px ink border at every corner.
- **Lead:** a 1px ink hairline from one corner of an area to its card.
- **Pinned card:** white, a 1px ink edge, 8px radius, the "pinned" shadow. A small table at 13px/20px in three columns 10px apart: the area's name across the top at weight 600 (15px from 1440px), then a line to each market inside the area. "Short-let", its count, a night's median price and how full ("58% full"); "Long-let", its count, a month's median rent; "For sale", its count, the median asking price. The market's name and the unit words are `muted`; the count (ranged right) and the figures are ink at weight 600, tabular. The short-lets are the dots on the map, so their line alone starts with an 8px ringed dot in the fullness step the area falls in; the other two names are indented to line up with it. Between 1024 and 1439px the prices go without "a night" and "a month". A market with fewer than five listings gives its count and "too few". Along the card's foot, under a 1px ink rule, a 6px bar filled to the occupancy in that fullness step, ended by a 1px line of `occ-ring`. About 255px by 110px from 1440px, 210px by 103px below. Cards are set over open water where they can be. An area with too few short-lets to quote is drawn without its card and its lead.
- **Pointer:** a small drawn arrow, white with a 1.6px ink line, that goes round each area's corners as it is drawn.
- **Name:** the town's name once, at 17px weight 600 with a halo in the land colour: the largest word on the map.
- **Below 1024px:** the picture is a band that shows a few streets and follows the area in hand. Cards are not pinned on the map there: one card is docked near the band's top-left for the area the band is on (moved up from its foot on 2026-10-14, so a phone shows a card on its first screen), coming when that area closes and going when the band moves on; the town's name sits at the band's foot; and only the area in hand is tinted, the others keeping their line and their listings.
- **Credit line:** one 13px muted line at the picture's bottom-right (under the band below 1024px): the control that stops the tour, as ink words at weight 600 with a 12px glyph ("Pause the tour", "Play the tour") and a 44px target, then "Next town" (the same words and weight, a skip glyph), which goes on to the next town at once and starts a paused tour again, then the key to the dots ("Short-lets this season: emptier", four ringed dots, "fuller"; "this season" left out below 1440px and the whole key between 1024 and 1279px), then the credit naming OpenStreetMap contributors and OpenMapTiles.

### Switch
Since 2026-10-14 the kind of report ("For a property", "For an area") is two words set as tabs on a hairline over the report sheet, in the page's tab idiom: the chosen one ink at weight 600 with a 2px ink underline on the row's own rule, the other `muted` at 500 until hovered (its underline then shows in `line`). Its bold setting lies unseen under the label, so choosing moves nothing. There is no tray and no filled pill: the owner reads pills as machine-made. The stage's map no longer carries a switch: there is one map, and the visitor zooms it.

### Cards / Containers
- **Product panel:** 26px radius, 1px hairline, flat, in its own ground: white for the Playground, the olive tint for Reports, the saffron wash for the Connector. Padding 28/18px on phones, 36/32px from 640px, 48/44px from 1024px and 56px from 1280px. Its name is the heading with the icon (36px) beside it; there is no header row (until 2026-10-14 a 56px row held the icon, the name and the action).
- **A panel's words** stay one block (name, claim, sentence, action, small print), set at the top beside a taller object; they are never stretched to its height (2026-10-14).
- **The tipping point (Playground panel):** "Airbnb or a tenant?", the Playground's Buy & Rent verdict for Cyprus, worked. The tipping point as a figure (the median occupancy at which a short-let's takings equal a tenant's rent, scaled by the Playground's starting running costs, 40% and 15%); a slider asking "How booked would yours be?", starting at the median Cyprus short-let today, with the tipping point marked above its track (a 2px olive line, its name in olive at 16px weight 600) and today marked under it (a 10px saffron square in a 1.5px ink line); the verdict at 20px weight 600 behind an 11px square (olive when a short-let wins, white when a tenant does), compared with the same whole-per-cent tipping point the panel prints; and one line on what it rests on, the median asking price and the running costs. The Playground's yearly sums are not quoted there (review, 2026-10-14): they are independent medians and could contradict the verdict.
- **Stage panel:** not a card. A row in a hairline-divided list: icon, name, one muted sentence, one live line, a chevron; it opens by growing its row over 0.32s.
- **Map frame:** 14px radius, hairline, the map above a 48px white bar that holds the count, the key and Reset. On phones the frame is the map alone and the count, key and credit sit under it on the ground.
- **Report sheet:** white, 6px radius, no outline, the sheet shadow; a running head and a pager divided by hairlines.
- **Listing card:** the example listing as its site shows it: white, hairline, 10px radius, a 44px light-orange square with a 1.5px ink border standing for its picture, then its kind at weight 600, its place and its price in `muted`. Always followed by the note "An example listing".
- **Messages:** the visitor's in olive with `visitor-ink` text at weight 500, the answer on white with a hairline; 16px (17px from 640px), up to 35em wide. The conversation is as tall as what is in it (scrolling inside itself past 520px from 1024px), and the composer line shows only while a chosen question is being typed (2026-10-14).

### Inputs / Fields
- **The close's request** is an email (`mailto:` to `info@plotsights.com`, the carried request as its subject) on a solid paper button, "Email the team", with "Or open the Playground" beside it as a text link; there is no field on the page (the one that stood here only simulated a send, removed 2026-10-11).
- **Slider:** a 2px track filled in ink up to a 16px square white thumb with a 2px ink border; the thumb fills olive and grows to 1.2 on hover; the focus ring goes on the thumb.
- **Tabs:** text at 15px, muted until hovered, ink at weight 600 when selected with a 2px ink underline on the row's own rule; an overflowing row fades at the hidden side and shows an arrow.
- **Choice list (the Connector's questions):** rows divided by hairlines, each behind a 12px square corner that is ink when chosen.

### Brand mark and product icons
The mark is the five-cornered plot as an outline: a line in the ink of the text around it, with round joins, and five round corner dots in olive, nothing inside. It carries no orange. In the wordmark (`Wordmark.tsx`) it is the name's "o": 0.76em square in a tight frame, a little taller than the round letters, its line 2.1 and its dots 3.2 of the 34-unit drawing (about 1.3px and 4px across in the nav). On the footer's ink the line is the footer's light ink, as its letters are, and the dots are a lighter olive (`--olive-light`, #A8C290), since the palette's olive is 2.4:1 on ink. Standing alone (`AreaMark.tsx`, beside "Everything below is about…") it keeps a hairline of 1.25 and dots of 2.2; the favicon (`app/icon.svg`) is heavier, 2.6 and 3.2, so it holds at 16px, and on a dark tab strip it switches to the light line and the lighter olive. It moves twice. When the page first paints the dots pop in turn and the line draws through them once. On hover or keyboard focus of the link it sits in, the line vanishes and forms again from dot to dot in about 0.7s, each dot pulsing as the line reaches it; never on touch, and not at all with reduced motion. The idea of that motion came from an animated polygon icon the owner liked (Lordicon, 2026-10-12); nothing of that icon is used, the shape and the code are ours. The three product icons are drawn on a 32px grid in the same hand: a 2px ink line with round joins, small square white nodes, and exactly one shape filled with the marking orange. Each has one part that makes one small move when its product is opened (the pointer reaches its corner, the chart line draws, the cable seats). At the last stop of the How line they appear at 40px beside the product's name and one muted line.

### The area on the stage's map
The stage has one map in one frame: the island, a single generated picture (sea, coast, forest, built-up ground, lakes and three weights of road, unlabelled), shown whole at first, enlarged in steps (2, 4 and 8 times) and, for a place picked in the search, opened on the ground round that place. Past 8 times is street level (16, 32, 64 and 128 times; at 128 about 2.4 km of ground fills the window), and only over the six towns the first screen tours: there the island's picture gives way to its plain shape (sea and land) under the town's own street map (`public/landing/town-*.svg`), which fades into the land at its edges, and the map can be moved only within that street map. Picking one of the six towns opens at 128 times on one of the tour's own areas, a few streets wide, named for its streets and its town ("Old town, Limassol", "Kato Paphos, Paphos"). Elsewhere plus stops at 8. On the whole island five towns are named by the page, each set in the sea beside it with a halo in the sea's colour (Nicosia on land); closer in, the towns in the window are named at their centres, and a picked place at its own. The area is a 2px olive outline with round joins and a 22% olive fill laid over the picture, with a 12px white square handle at each corner; held, the fill deepens and the outline thickens to 3px. Listings are dots: fullness steps with their ring inside the line, `dot-out` outside, drawn smaller on the whole island where a town is a few dots wide. Inside the line they are thinned until they stand side by side, never one on another, so a dense town is beads with readable shades and not a blot; outside it a finer grey stipple fills in between, so a town the area does not hold still reads as a town. A 1px olive line runs from the area to the open product panel; the lines to the others are `wire`. One corner sends out a slow ring, with the invitation "Drag a corner, or the whole area" set beside it like a place name, until a corner is first moved. The bar under the map counts what is inside the line and, for a picked place, says both counts ("421 short-lets inside, of 545 in Paphos").
- **Zoom control:** floats on the frame's top-right corner, 10px in (12px from 640px): plus over minus, two 44px squares on one white surface with a hairline, a 12px radius and the floating shadow, divided by a hairline, each an 18px ink glyph. Hover and press tint olive; a step that cannot be taken stays in place and steps back in colour. Once the map is zoomed, "Whole island" appears under it on the same surface, smaller (36px tall, 13px weight 600, reaching a 44px target).
- **Moving the map:** a mouse takes the map by its ground (a grab cursor) and a double click or double tap goes in on that point. Once the map is zoomed in a finger takes it by its ground too, or by a quick swipe across the area; on the whole island a finger's swipe scrolls the page.
- **Draw an area here:** the same white surface as a 44px button at 15px weight 600 on the frame's bottom-left corner, offered whenever the map is zoomed in, and whenever nothing of the area is in the window to take hold of.

### The How line
One listing followed along a 1.5px `rail` line with five stops. Each stop is an 11.5px white square with a 2px ink border; the first, where the listing is published, is filled saffron. Each stop shows the listing as it is at that point, small and in the page's own marks: the listing card; a month of its calendar as thirty 17px squares (booked in the third fullness step with its ring, blocked in ink hatching, free in white with a hairline) over a key of the same three marks at 9px; a small map of three nested outlines (`wire`, `rail`, then an olive area with square corners) holding the listing as a saffron square, with its place as a muted trail beneath; two bars 13px tall, the hatched one for what the calendar shows and the orange one for what is counted, each with its figure at 16px weight 600 and the nights it stands for; and the three products. Real counts and the time of the last read appear under their stops at weight 600 when they can be had and are left out when they cannot.

### Charts and tables
One 2px ink line between two hairlines, ending in a 9px square node; bars with their value above and name beneath (on the report sheet saffron inside a 1.5px ink line, since they are data, 2026-10-14); the value axis shows only its two ends and the time axis up to three ticks, at 11px. Tables are hairline rows; the leading figure of a row is ink at 600 and the others step back to muted.

### Motion
One easing, `cubic-bezier(0.16, 1, 0.3, 1)`. State changes take 0.15 to 0.2s; a panel opening takes 0.32s. Below the first screen each surface has one authored moment and plays it once: on the stage the handles drop, the outline closes, the fill and the listings arrive and the lines reach the panels; in the panels the tipping point's mark rises from the scale and today's square lands, lines are traced, bars grow from the baseline, a sheet is dealt on from the right, and a question the visitor chooses comes up from the composer (the first exchange is there from the start, answered). The first screen's picture is the one thing that runs on. It arrives complete on the first town and holds (3.6s). Then, for each town in turn: the map slides in from the east as the last leaves to the west (3% of its width over 1.2s, fading over 0.9s), the listings appear west to east, and a pointer draws each area corner by corner (0.17s a corner), each corner dropping in as it is reached and the line traced behind it; when the line closes the tint and its white edge come in (0.3s), the listings inside take their colours and the card rises 6px into place (0.4s), and the area stays to be read (1.1s; 1.7s in the band) before the pointer goes on; after the third area everything holds for 2.2s more and leaves (0.45s). In the band the map moves from one area to the next over 0.7s, and the docked card goes as it moves. The tour waits while the picture is out of view, the tab is hidden or the visitor is typing in the search field, and its pause control stops it where it is. "How the numbers are made" has no motion of its own. No figure counts up in a card. Everything is in its final state before and without the motion, and `prefers-reduced-motion` removes all of it (the first town stays, complete, with no pause control; the typing squares become words; the pulsing corner is filled instead).

**The opening** (owner, 2026-10-12: "Plotsights logo coming in in the beginning", "the O ... constructed interactively after pl tsights comes in", "this only happens to the left of the hero. Map is still visible", "can we keep it for some more time?"; 2026-10-13, after the critique: "the pointer walks to the map"). On the first page of a visit the name arrives large where the words will be, set as the wordmark with a gap for its "o" (20% of the column's width as its type size, 128px at most). The tour's own pointer draws the "o" corner by corner (from 0.62s, for 0.82s, each corner dropping in as the line reaches it); all of this is the stylesheet's, so a page whose script is late still shows the whole name. The name then stays to be read for 1.2s, and in that time the pointer rests on the corner it closed (0.25s), crosses to the map (0.76s) and waits on the first area's first corner. The name goes up to its place in the nav (0.62s, the page's one easing, so it leaves at once); the headline, the sentence and the search rise in, 90ms apart, from the moment the name's foot has cleared the headline's head, never before; and 0.45s after that the tour takes the pointer over on the same corner and draws the first town, its listings arriving as it does. The map is there from the first frame, with nothing drawn on it and no tour control or key under it until the words come. About 3.3s from the first paint to the name in the nav. It plays once a visit, never with reduced motion or on a link into the page, and any scroll, key or press ends it at once, before the page's script has arrived as after. The stylesheet lets the words through after 5s whatever the script does. `lib/landing/opening.ts`, `components/landing/Opening.tsx`, the last block of `app/landing-hero.css`.

## Do's and Don'ts

### Do:
- **Do** draw anything new in the page's own hand: a 2px olive outline for an area, square nodes with an ink border, a 2px ink line for a chart or an icon, and at most one shape filled with the marking orange.
- **Do** keep olive for what the visitor does or has drawn and for the brand's own marks, and saffron for what is counted.
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
- **Don't** add a second typeface or a type size outside the eight.
- **Don't** put a shadow or glass on a product panel, a stage panel, a filled button or a hover state; a shadow is for something lying on top of something else, as a control floating on a map is, and glass only for what floats over the first screen's map.
- **Don't** round a handle or a node, and don't square a listing dot on a map of many listings.
- **Don't** put a frame, a label layer or administrative boundaries on a generated map picture.
- **Don't** use a gradient as decoration; the only gradients are the fade at the edge of something that scrolls or of a frameless map, the slider's two-colour track, and the ink hatching that means "blocked".
- **Don't** let a figure count up, flash or animate on the cards; it shows its true value throughout.
- **Don't** invent testimonials, client names, prices or plan contents.
