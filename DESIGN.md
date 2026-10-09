---
name: PropSights landing (The Thread)
description: A messaging thread on a warm off-white ground where a visitor asks about a place and the data team answers with a street map of each area and the numbers.
colors:
  ground: "#F4F1E8"
  ink: "#161C11"
  muted: "#3F4A35"
  line: "#DDD7C6"
  surface: "#FFFFFF"
  visitor: "#4A5E3A"
  visitor-ink: "#F7F5EE"
  action: "#EE7B3C"
  action-ink: "#161C11"
  action-hover: "#E06C2C"
  tint: "#E6EBDA"
  tint-hover: "#D9E0C9"
  solid: "#161C11"
  solid-ink: "#FFFFFF"
  solid-hover: "#26331C"
  a: "#EE7B3C"
  a-ink: "#161C11"
  b: "#4A5E3A"
  b-ink: "#FFFFFF"
  map-sea: "#C2DADF"
  map-shore: "#6F929B"
  map-land: "#FBFAF4"
  map-road: "#BDB8A7"
  map-road-major: "#958F7B"
  dot: "#161C11"
  dot-out: "#9AA08E"
  rule: "color-mix(in srgb, #DDD7C6 60%, #FFFFFF)"
  placeholder: "color-mix(in srgb, #3F4A35 82%, #FFFFFF)"
  pending: "color-mix(in srgb, #3F4A35 60%, #FFFFFF)"
typography:
  display:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.5rem, 4.1vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  wordmark:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.035em"
  question:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 500
  lead:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    fontFeature: "tnum"
  action:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  label:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  note:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  tag:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.02em"
  place:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
  credit:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  tail: "6px"
  plate: "7px"
  action: "12px"
  map: "14px"
  bubble: "26px"
  pill: "9999px"
spacing:
  thread-gap: "12px"
  map-gap: "12px"
  bubble-pad: "18px"
  gutter-phone: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "64px"
  column-gap: "56px"
  touch: "44px"
  nav-height: "72px"
  composer-height: "64px"
components:
  button-send:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "46px"
    padding: "0 20px"
  button-send-hover:
    backgroundColor: "{colors.action-hover}"
  button-solid:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.solid-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "{spacing.touch}"
    padding: "0 20px"
  button-solid-hover:
    backgroundColor: "{colors.solid-hover}"
  chip-action:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    height: "{spacing.touch}"
    padding: "0 15px"
  chip-action-hover:
    backgroundColor: "{colors.tint-hover}"
  bubble-visitor:
    backgroundColor: "{colors.visitor}"
    textColor: "{colors.visitor-ink}"
    typography: "{typography.question}"
    rounded: "{rounded.bubble}"
    padding: "14px 22px"
  bubble-team:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "16px 18px 18px"
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "{spacing.composer-height}"
    padding: "0 9px 0 26px"
  tag-state:
    backgroundColor: "{colors.solid}"
    textColor: "{colors.solid-ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.tail}"
    height: "20px"
    padding: "0 8px"
  badge-area-a:
    backgroundColor: "{colors.a}"
    textColor: "{colors.a-ink}"
    rounded: "{rounded.pill}"
    size: "18px"
  badge-area-b:
    backgroundColor: "{colors.b}"
    textColor: "{colors.b-ink}"
    rounded: "{rounded.pill}"
    size: "18px"
  area-map:
    backgroundColor: "{colors.map-land}"
    rounded: "{rounded.map}"
  vertex-handle:
    backgroundColor: "{colors.surface}"
    size: "7px"
  place-name:
    textColor: "{colors.ink}"
    typography: "{typography.place}"
  locator:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.plate}"
    padding: "4px 5px"
  nav:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    height: "{spacing.nav-height}"
---

# Design System: PropSights landing (The Thread)

## Overview

**Creative North Star: "The Thread"**

The page is one conversation. A visitor asks about a place and a small data team answers with a street map of each of two hand-drawn areas and the numbers facing off beneath them. Everything visual follows from that: messages have a speaker and a corner that points at them, the team's reply carries real data inside the bubble, and the primary action is the message field, not a button under a headline. The ground is a warm off-white, the type is one clear, UI-friendly sans, and the only bright colour is the tangerine action colour.

The mood is serious about the numbers and light about everything else. Figures are exact and set in tabular numerals; shapes are round, soft and a little playful; the brand mark is a drawn area with square handles, the same object the team draws on each map and a visitor drags in the Playground. Motion is conversational: replies rise in from the speaker's corner, the team types before it answers.

**Scope of this record.** This world is implemented for the landing page's first viewport (the hero) and the top navigation only. The landing sections below the hero (data strip, product tabs, access form, footer) are still in the previous dark design and are due to be rebuilt in this world; the dashboard ("Playground") has its own dark system. Neither is described here, and neither should be used as a source for new landing work.

**Decisions.** The palette and the typeface were confirmed by the owner on 2026-10-08: the palette was kept after comparison with seven alternatives, and Google Sans was chosen over Inter, Commissioner and Geologica. The product name is still undecided; PropSights is in use and appears in the wordmark and the team's signature.

**Key Characteristics:**
- One conversation on a warm off-white ground: visitor on the right in olive, team on the left in white.
- One face (Google Sans; Latin, Latin Extended and Greek) at four weights and six sizes under the headline; tabular figures wherever numbers are compared.
- One accent (the tangerine action colour) for area A, the send action and the brand mark.
- Data inside the message: a street map per area with the drawn outline and its listings, and a face-off comparison under the pair.
- Every colour is a role, defined once as a `--th-*` custom property; nothing in this world names a colour directly.
- Hue belongs to identity (an area, the visitor, the action); which figure leads is said with weight.
- Flat surfaces separated by hairlines and tone; a shadow only where something floats over content.
- Round forms throughout, with square vertex handles as the single hard-cornered motif.

## Colors

Warm off-white, green-black ink and olive carry almost everything; tangerine is the one loud voice, and the maps add one cool note for the sea and its shoreline. Every value lives once, as a role-named `--th-*` custom property in the "Landing thread" block of the global stylesheet, and components read the role, never the hex. Token keys here are those role names without the `--th-` prefix.

### Primary
- **Action** (`action`, tangerine): the send button in the message field and the text caret in the field. Text on it is `action-ink`. Darkens to `action-hover` on hover.
- **Area A** (`a`, the same tangerine): area A wherever it appears: outline and fill on its map, the border of its handles, its dot on the island locator, its key badge. Text on it is `a-ink`. The brand mark's fill follows this role.

### Secondary
- **Visitor** (`visitor`, olive): the visitor's message bubbles, the typing dots and text selection. Text on it is `visitor-ink`, a near-white.
- **Area B** (`b`, the same olive): area B wherever it appears, as for area A. Text on it is `b-ink`, white.
- **Solid Hover** (`solid-hover`, deep olive): the hover state of solid buttons.

### Neutral
- **Ground** (`ground`): the page ground of the hero and the scrolled navigation bar; the fill of the brand mark's handles and of the island locator plate.
- **Ink** (`ink`): headline, body text, leading figures, place names on the maps, the message field's border and every focus ring.
- **Solid** (`solid`, the same green-black): the navigation's button, the team avatar disc and the state tag. Text on it is `solid-ink`, white.
- **Muted** (`muted`): secondary text: the introduction, the metric names and the trailing figure in a comparison row, the thread note, the map credit; also the island silhouette in the locator at half strength.
- **Surface** (`surface`): team message bubbles, the message field and the fill of the handles on the maps, so replies sit one step brighter than the ground.
- **Tint** (`tint`): the action chip inside a reply, and nothing else. Darkens to `tint-hover` on hover.
- **Line** (`line`): hairline borders on team bubbles, the maps and the locator plate; the navigation's bottom rule once scrolled and the dividers in the phone menu.
- **Rule / Placeholder / Pending** (`rule`, `placeholder`, `pending`): derived by mixing line or muted into surface: the fainter hairline between comparison rows, the field's placeholder text, and the dashes that hold a figure's place while it loads.
- **Map Sea / Shore / Land** (`map-sea`, `map-shore`, `map-land`): the street maps only: a pale blue-grey sea, a darker blue-grey 1px shoreline where it meets the land, and a warm near-white land.
- **Map Road / Major Road** (`map-road`, `map-road-major`): the two road weights, both warm greys, the major roads clearly darker.
- **Dot / Dot Out** (`dot`, `dot-out`): listings on the maps: solid ink inside the drawn line, a faint olive-grey outside it.

### Named Rules
**The Roles Rule.** A colour is named for what it does (ground, visitor, action, area A), never for its hue, and is defined once. A new element takes an existing role; a look is changed by changing the role's value, not by writing a hex into a component.

**The Two Areas Rule.** Area A is the tangerine and area B is the olive in every representation: outline, handles, locator dot, key badge. The colour is the area's identity, so it never swaps and never decorates anything unrelated to that area.

**The Dark On Action Rule.** Text and icons on the action colour are ink (about 6.2:1). White on it is about 2.8:1 and is never used. On the olive, text is white or near-white.

**The One Loud Voice Rule.** The tangerine appears on area A, the send action, the brand mark and the caret, and nowhere else. Secondary actions are solid or tint.

**The Inside The Line Rule.** On a map, a listing inside the drawn area is a solid ink dot ringed in the land colour; a listing outside is smaller, faint and unringed. The listings inside the line are the content; the rest is context, and on a phone-sized map the context is left out.

## Typography

**Display Font:** Google Sans (with sans-serif fallback)
**Body Font:** Google Sans (with sans-serif fallback)

**Character:** One sans for everything, chosen by the owner as crystal clear and UI friendly. It is self-hosted (OFL) as three files covering Latin, Latin Extended and Greek, because place names appear in both scripts, and spans weights 400 to 700. Bold and slightly tightened for the headline, regular and open for conversation, semibold for anything you can press and for the figure that leads. The family is set through one custom property, and the headline's weight and tracking through two more, so the display voice can be retuned in one place.

### Hierarchy
- **Display** (700, `clamp(2.5rem, 4.1vw, 3.6rem)`, 1.02, -0.025em): the hero headline only, balanced across about four lines on desktop and capped at 9.4em wide.
- **Wordmark** (700, 22px, -0.035em): the product name beside the mark in the navigation.
- **Question** (500, 18px; 17px on phones): the visitor's messages, balanced, with each area's name kept on one line.
- **Lead** (400, 18px, 1.5; 17px on phones): the team's introduction under the headline, in muted, capped at 26em.
- **Body** (400, 17px, 1.45): everything the team says, including the first sentence of the data reply on its own line in ink, and the text typed into the message field.
- **Figure** (16px, tabular numerals): the numbers in the comparison: 600 in ink for the leader, 400 in muted for the figure it beats. The metric names between them are 400 at 15px in muted.
- **Action** (600, 15px): buttons and chips. Navigation links are 500 at 15.5px; the text link is 600 at 16px.
- **Label** (600, 15px): the team's name at the head of a reply and the area names heading each side of the comparison.
- **Note** (400, 13px, muted): the centred line that opens the thread and says what kind of data answered it.
- **Tag** (600, 11px, 0.02em): the state tag inside a reply.
- **Place** (600, 11px, line-height 1): a place name on a map.
- **Credit** (400, 11px, muted): the map credit at the foot of the reply.

### Named Rules
**The One Face Rule.** Everything in this world is Google Sans. The previous design's Inter and Barlow Condensed are still loaded for the sections not yet rebuilt and must not appear inside it.

**The Six Sizes Rule.** Under the headline, text in the hero is 11, 13, 15, 16, 17 or 18px and nothing between. A new piece of text takes the size of the role it plays.

**The Weight Leads Rule.** In a compared pair the leader is semibold ink and the figure it beats is regular muted; a pair with no leader stays semibold on both sides. Leading is never shown with a hue, a fill or a badge, so it cannot be mistaken for either area's colour.

**The Tabular Figures Rule.** Any set of numbers a reader compares is set with tabular numerals so figures align digit for digit. A missing figure is an em dash, never a zero.

## Layout

A single container up to 1440px wide with gutters of 20px on phones, 32px from 640px and 64px from 1024px.

From 1024px the hero is two columns in a 5:8 ratio with a 56px gap: headline, introduction and a text link on the left (starting 80px below the top of the thread); the thread on the right. The thread column is one viewport tall (`calc(100svh - 116px)`, never under 540px or over 840px): messages stack with 12px between them, older messages scroll inside the column with a thin scrollbar, and the message field stays at the bottom. The section starts 96px down to clear the fixed 72px navigation.

Inside the thread the visitor's bubbles align right and take at most 85% of the width; the team's bubbles align left beside a 42px avatar column (30px on phones) and take at most 640px (560px for a short follow-up). The data reply is a fixed stack: the team's name, its sentence, the two area maps side by side in equal columns (12px apart, 10px on phones), the comparison, the credit. Each side of the comparison sits flush with the outer edge of its own map. A reply that will receive data holds its final shape while loading, so nothing moves when the figures land.

Below 1024px the hero is one column: headline, introduction, link, then the thread at full width. The message field is pinned to the bottom of the screen on a fade from transparent to the ground colour, so the thread passes under it cleanly. Below 768px the navigation links collapse into a menu. Below 640px the page tightens to reach the thread sooner: the section starts 76px down, 16px separates the introduction from the thread, the text link under the introduction is left out (the menu and the verdict's action lead to the Playground), and the maps become square.

Desktop windows compact in two steps so the whole exchange and the field stay in view. At 960px tall or less the gap between messages drops to 8px, team bubbles take 12px of vertical padding, comparison rows tighten and the action chip drops from 44px to 36px. At 860px or less each map's frame also crops from 4:3 to 2:1 around its centre. Everywhere else, anything pressable is at least 44px tall.

## Elevation & Depth

Flat. Depth comes from tone and hairlines: white bubbles with a 1px line border on the ground, the tint chip inside white, the sea against the land. At rest on desktop no surface casts a shadow.

### Shadow Vocabulary
- **Docked field** (`box-shadow: 0 10px 24px -12px` in ink at 35%): the message field on phones and tablets only, where it floats over the thread. Removed from 1024px, where the field sits in the layout.

### Named Rules
**The Floats-Only Rule.** A shadow means the element is sitting over other content, and the docked field on small screens is the only case. Bubbles, chips, buttons, maps, the locator plate and the navigation never carry one. The scrolled navigation separates itself with an opaque ground and a bottom hairline instead. The halo behind a place name is a legibility device in the colour of the map beneath it, not elevation.

## Shapes

Round and soft, with one deliberate exception. Message bubbles have a generous radius (26px) with a single tight corner (6px) at the bottom on the speaker's side: bottom-right for the visitor, bottom-left for the team. Buttons, the message field, avatars and key badges are full pills or circles. Actions that live inside a reply are softer rectangles (12px), each map is a rounded panel (14px), and the smallest pieces (the state tag at 6px, the locator plate at 7px) stay small.

The exception is the vertex handle: a small unrounded square at each corner of a drawn area. On a map it is 7px (6px on phones), filled with the surface colour and bordered (1.5px) in the area's colour, the same size on screen whatever the map's width; on the brand mark it is filled with the ground colour and stroked in ink. It is the only hard-cornered form in the world. Area outlines themselves are straight-edged polygons with rounded joins and a 2px stroke in the area's colour; the 18% fill sits beneath the sea, so it tints the land only and stays one colour.

Borders are hairlines (1px, line) on bubbles, maps and the locator plate; the message field is the one element with a heavier ink border (1.5px), which marks it as the thing to use.

## Components

### Buttons
- **Shape:** full pill (9999px).
- **Send (primary):** the action colour with dark text and a right arrow, 46px tall inside the message field, 20px side padding. On phones the label is hidden and only the arrow shows (14px side padding). One per view.
- **Solid:** green-black with white text, 44px tall, 20px side padding. The navigation's "Ask the team"; 48px tall and full width in the phone menu.
- **Hover / Focus:** background darkens over 0.15s (send to action-hover, solid to solid-hover); pressing scales to 0.97. Focus is a 2px ink outline offset 3px.

### Chips
- **Action chip:** a tint rectangle (12px radius) with ink text at 15px semibold and a trailing right arrow, 44px tall, 15px side padding. The follow-on action inside a team reply, and the only tint fill in the world. Its label shortens on phones. Hover darkens to tint-hover; press scales to 0.97.
- **State tag:** a small solid tag with white text (20px tall, 6px radius, 11px semibold) beside the team's name, stating a condition of the answer such as "Demo data". Used for status, never as a section label.
- **Key badge:** an 18px circle in the area's colour holding its letter (11px bold; dark on area A, white on area B). It sits on the outer side of the area's name: before it for area A, after it for area B.

### Cards / Containers
- **Visitor bubble:** olive, near-white text, 26px radius with the bottom-right corner at 6px, 14px by 22px padding (10px by 22px on phones), right-aligned, no border.
- **Team bubble:** white, ink text, 1px line border, 26px radius with the bottom-left corner at 6px, 16 to 18px padding (14px on phones).
- **Team avatar:** a solid disc holding the brand mark without handles, set at the bubble's bottom edge. A run of consecutive team messages carries one avatar, on its last message; the earlier ones keep the empty column so the bubbles stay aligned.
- **Arrival:** each message fades and rises 14px from slightly smaller (0.98) over 0.5s on an ease-out-expo curve, scaling from its bottom-left. The example reply waits 1.5s so the question can be read, and the verdict follows 0.9s later. With reduced motion everything is present immediately and nothing animates.
- **Loading:** the data reply is whole from first paint except for what the team has not said yet. Both maps show their roads, sea and drawn area; three olive dots bounce beside the team's name; the team's sentence is withheld with its line reserved; the comparison shows its rows with em dashes in the pending tone. Listings fade onto the maps and figures replace the dashes without anything moving.

### Inputs / Fields
- **Message field:** a white pill 64px tall with a 1.5px ink border, 17px text, a caret in the action colour, placeholder in the derived placeholder tone, and the send button docked inside its right end.
- **Focus:** the whole field takes a 2px ink outline offset 3px; the input inside shows no separate ring.
- **Empty submit:** returns focus to the field rather than showing an error.

### Navigation
- Fixed bar 72px tall, transparent over the hero; after 60px of scroll (or with the menu open) it takes the opaque ground colour with a bottom hairline.
- Left: the brand mark (32px) and the wordmark. Right: text links at 15.5px medium in ink, whose underline (1.5px, offset 6px) fades in on hover, then the solid "Ask the team" button.
- Below 768px the links collapse behind a 44px menu button; the open menu lists them as 48px rows divided by hairlines, with the solid button full width beneath.

### Text link
Ink, semibold, always underlined (1.5px, offset 4px); on hover the underline drops to 7px. Used from 640px up for the quieter route to the Playground beside the primary action.

### Brand mark
A five-point drawn area filled with area A's colour, with an ink outline and a ground-filled square handle at each vertex. Inside the team avatar it is drawn with a ground-coloured outline and no handles.

### Area map
One static street map per area, in a 4:3 panel (14px radius, hairline border, land-coloured ground). It is drawn, not tiled, and everything that needs no data is there at first paint, in this order from the bottom: the area's fill, the sea, a 1px shoreline, minor roads (0.7px), major roads (1.6px), the area's 2px outline, then its square handles. Strokes keep their width at any size. The view is framed so the area spans a little over half of the panel's tighter side, which leaves the surrounding streets and coast in view.

When the listings arrive they fade in over 0.4s as dots that hold their size on screen: 2 to 2.6px in radius, three-quarters of that when an area holds more than 250, and about half for the faint dots outside the line. Listings that fall in the sea are not drawn, and no dot is drawn under a place name.

A phone-sized map (below 640px) is a different drawing, not a smaller one: a square frame that crops the sides, major roads only (1.2px), no dots outside the line, no place name and no locator.

### Place name
One real place name per map, as text over the drawing: 11px semibold ink on a single line, centred on its point, with a tight halo in the colour of whatever lies beneath it (the land colour, or the area's tinted land when the name sits inside the area), so it reads over roads without a box. It appears only when the map itself is at least 260px wide, so narrow desktop columns and phones carry none.

### Island locator
A small plate (ground fill, hairline border, 7px radius, 4px by 5px padding) in the bottom-left corner of each map from 640px up: the whole island as a 44px-wide muted silhouette with one dot in the area's colour, ringed in the ground colour, where the area lies.

### Comparison table
A face-off under the pair of maps: area A's figures flush left under its map, the metric name centred between them, area B's figures flush right under its map, in columns of 36%, 28% and 36%. Each side is headed by the area's name and key badge. Rows are separated by the faint rule; metric names are muted and regular; figures are tabular, with the leader in semibold ink and the figure it beats in regular muted. Until the figures arrive every cell holds an em dash in the pending tone. A row with nothing to compare is not shown, during loading or after, and its height is held beneath the table so the bubble does not resize if it appears.

### Map credit
One right-aligned, balanced line at 11px in muted at the foot of the data reply, naming the map's sources as links whose underline appears on hover and on focus.

## Do's and Don'ts

### Do:
- **Do** set everything in this world in Google Sans, with tabular numerals for compared figures.
- **Do** take every colour from a `--th-*` role, and give a new element an existing role before adding one.
- **Do** keep text under the headline to 11, 13, 15, 16, 17 or 18px.
- **Do** keep area A in the tangerine and area B in the olive in every representation of that area.
- **Do** mark the leading figure with weight and ink, and step the trailing one back to regular muted.
- **Do** put dark text on the action colour and white or near-white text on the olive.
- **Do** point each bubble's one tight corner (6px against 26px) at its speaker: bottom-right for the visitor, bottom-left for the team.
- **Do** show a place with its own street map, the drawn outline with square handles, and solid dots for the listings inside the line.
- **Do** draw the map and the area before any data arrives, and let only the listings and figures come in later.
- **Do** simplify a phone-sized map (square, major roads, inside dots only) rather than shrinking the desktop one.
- **Do** credit the map's sources wherever a map is shown.
- **Do** hold a reply's final shape while its data loads, and show a missing figure as an em dash.
- **Do** give a run of team messages one avatar, on its last message.
- **Do** give everything pressable a visible hover, a 0.97 press, and a 2px ink focus outline offset 3px.
- **Do** honour reduced motion: messages are visible by default and nothing animates.
- **Do** keep pressable elements at least 44px tall on touch layouts.

### Don't:
- **Don't** use white text on the action colour.
- **Don't** use the tangerine for anything except area A, the send action, the brand mark and the field's caret.
- **Don't** use a hue or a fill to say which figure leads; the tint belongs to the action chip.
- **Don't** write a hex value into a component in this world; name the role.
- **Don't** add shadows to bubbles, chips, buttons, maps or the navigation; only an element floating over content carries one.
- **Don't** put a place name in a box, or draw a listing dot under one.
- **Don't** use Inter or Barlow Condensed inside this world; they belong to the sections not yet rebuilt.
- **Don't** round the vertex handles; the square handle is the one hard-cornered form.
- **Don't** take colours, type or components from the dark sections below the hero or from the Playground when extending this world.
- **Don't** use the state tag as a section label or decoration; it reports a condition of the answer.
