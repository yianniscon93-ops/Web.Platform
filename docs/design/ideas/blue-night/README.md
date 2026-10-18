# Blue Night — saved design idea (Oct 2026)

**Keyword: `blue night`.** Saved style reference, not built yet. Source shot:
`reference.jpg` (a "Quantix" AI-consultancy template — borrow the style,
not the copy or brand). Not decided against DESIGN.md / the Aug landing
rework; picking it up means deciding where it fits.

## The idea

Calm, expensive, "night sky over data". A dark navy hero that feels like
deep space, a soft blue glow rising from the bottom, faint horizontal light
streaks, and one centred two-tone headline. Then the page **turns to white**
for content sections, with dark navy cards and image tiles carrying the
mood down the page. Lots of air, tiny labels, thin type, no loud colour.

## Palette (sampled from the reference)

| Token | Hex | Use |
|---|---|---|
| `night-950` | `#14191F` | Hero background, top |
| `night-900` | `#18202B` | Hero mid / dark image tiles (`#1B222C`) |
| `night-800` | `#213047` | Dark cards (feature card, top right) |
| `glow-600` | `#2E3D50` | Bottom-of-hero radial glow edge |
| `glow-500` | `#3D5E7F` | Brightest blue in cards / glow core |
| `mist-300` | `#A3AFBB` | Second half of headline ("uncertainty", "intelligent advantage") |
| `ice-200` | `#B7C9DD` | Pale blue tiles (map card) |
| `cloud-100` | `#E6E6EE` | Light grey cards |
| `paper` | `#FFFFFF` | Light sections |
| `ink` | `#F5F7FA` / `#1A1F26` | Text on dark / text on light |
| `pill` | `#353A40` + 1px `rgba(255,255,255,.15)` | Hero CTA pill |

No saturated accent at all — the "accent" is the muted blue-grey `mist-300`.

## Typography

- One clean neo-grotesk sans, **light/regular weight (300–400)**, never bold.
  Reference looks like Inter / Geist; good candidates: **Geist**, **Inter
  Tight**, **Manrope** (already in our style tile), or **Satoshi**.
- Headlines: large, tight leading (~1.1), slight negative tracking,
  **two-tone** — first words in white/ink, the payoff words in `mist-300`.
- Body: small (13–14px), grey, short measure.
- Eyebrow labels ("Delivery", "About Us"): tiny (10–11px), very faint grey,
  sits above the heading.
- Buttons/links: tiny text + arrow (`Start Your AI Journey →`, `Learn more →`).

## Hero recipe

1. Full-viewport dark navy, rounded bottom corners optional (the shot frames
   it as a card).
2. Radial gradient glow from bottom-centre (`glow-500` → transparent),
   subtle grain/noise.
3. A few thin horizontal light streaks drifting slowly (CSS/canvas, low
   opacity) — feels like motion through space.
4. Centred: two-tone headline, one faint sub-line, one ghost pill CTA.
5. Minimal nav: logo left, small tagline centre, hamburger right.
6. "Scroll down ↓" tiny label at the bottom.

## Below the hero

- White section, split: dark image tile left (dotted/particle globe),
  eyebrow + two-tone heading + paragraph + `Learn more →` right.
- Logo strip in grey.
- Card grid mixing dark navy cards (photo/3D render, icon chip top-left,
  title + one line) with pale grey / ice-blue cards.
- Numbered "3-phase" approach section with a dark feature card + cinematic
  warm-light photo for contrast.

## Decisions (2026-10-17)

Explored as a standalone concept, not built:
https://claude.ai/artifact/YLoKv3HGBY5ktWzkjNnfZU. The owner's picks:

- **Google Sans** (the Flex cut, for light 300; Geist has no Greek).
- **Eyebrow labels and pill buttons on**, as in the reference.
- **Town-tour hero**: words left; a night map of each town with three drawn
  areas and short-let / long-let / for-sale cards.
- **The Playground follows later**, not now.

Built on the landing page the same day (see DESIGN.md, docs/LANDING.md). It
departs from the concept in two ways: the drifting light streaks were dropped,
and the long-let and for-sale rows show only on live data. The Playground
is still on direction G.

## Plotsights angle (to explore)

Hero visual could be Cyprus at night — the coastline in dots, listings as
faint lights — instead of a stock globe. Two-tone headline e.g. "We turn
listings into *insight*".
