---
target: rate this as a design thing (the first screen and its opening)
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/yiannisconstantinides/vscode/Web.Platform/apps/web/app/page.tsx"
target_fingerprint: "sha256:ea807aae6ca84e0136707091aafad9be76adaea0f2e31305033ae559573ff1e6"
target_path: /Users/yiannisconstantinides/vscode/Web.Platform/apps/web/app/page.tsx
timestamp: 2026-10-12T18-32-20Z
slug: apps-web-app-page-tsx
---
Method: dual-agent (A: a7abb48f1d8196c26 · B: a64d12326dedc03e2)

Scope: the landing page's first screen with its opening sequence (built 2026-10-12, uncommitted at the time of this run). Dev server on demo data.

## Rating

The opening alone: 6.5 out of 10. The idea is about a 9; the execution loses it at the joins. The first screen with the opening: 23/32 on the usability heuristics (72%, Good, at the bottom of that band).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Nothing says the opening is short or skippable; "Pause the tour" and the dot key show over a map with no tour and no dots |
| 2 | Match with the real world | 3 | Plain language; the headline says "Plot" but nothing on this screen can be plotted |
| 3 | User control and freedom | 3 | Any scroll, key or press skips it, but only once the page has come alive |
| 4 | Consistency and standards | 3 | The name's lift uses a second easing; the words arrive by a stock fade-up |
| 5 | Error prevention | 3 | Place matching is strong; Enter before the place list loads drops what was typed (read from code) |
| 6 | Recognition rather than recall | 3 | Nothing says where plotting happens |
| 7 | Flexibility and efficiency | n/a | Landing page with one action |
| 8 | Aesthetic and minimalist design | 3 | Calm at rest; at the hand-off the name passes through the headline |
| 9 | Error recovery | 3 | Messages are plain; a late page ends in a jump cut |
| 10 | Help and documentation | n/a | Not applicable to a first screen |
| **Total** | | **23/32** | **Good** |

## Design specificity verdict

Specific where it counts. The missing letter is closed corner by corner with the same line, dots and pointer that draw areas on the map, and it teaches "Plot" two seconds before the headline uses the word. No other product could use it unchanged. The connecting parts are generic: a name that shrinks to the corner, and three blocks that fade up. "The hand that draws the areas draws the name" is not quite true yet: the pointer fades out beside the "o" and a different one appears on the map about a second and a half later.

Deterministic scan: `impeccable detect` found 0 findings in the opening's files (Opening.tsx, TownTour.tsx, LandingHero.tsx, Wordmark.tsx, AreaMark.tsx, layout.tsx). One advisory elsewhere: `design-system-color`, the page wrapper's background #0C100A at apps/web/app/page.tsx:30 is not in DESIGN.md. The in-page detector reported 31 findings on desktop and 34 on phone, none in the opening; most are false positives (16 are the screen-reader-only list's text-overflow). Headless run, no user-visible overlay.

## What's working

- The "o" is plotted, not faded in: brand and product are one gesture.
- The landing is exact: the large name ends within 0.01px of the nav's on desktop and phone (the plot sits 0.2 to 0.5px lower), so the swap is invisible.
- It is safe: no flash of the full page first, no console errors, a second load shows the hero at once, and the page shows itself after 8 seconds whatever the script does.

## Priority issues

1. [P1] The name runs through the headline as it leaves. Confirmed in frames: about 130ms on desktop (3194 to 3321ms) and 200ms on phone, the large name sits on top of the headline while it fades in; on a skip the fading name ghosts over the rising headline for 160ms. It is the opening's last impression and reads as a bug. Fix: start the words from geometry (when the name's bottom edge has cleared the headline's top), give the lift an ease-out-led curve so it leaves at once, cut the name faster on skip, and seat it in the nav with the corner pulse. Command: /impeccable animate
2. [P1] On a slow phone the name stays misspelt. The two halves rise from the stylesheet, but the "o", the hold and the lift wait for the page's script. Under a throttled processor the visitor gets "Pl tsights" with a hole and no words for 4.5 to 8 seconds, then a jump cut. A press before the script has mounted focuses the invisible field but does not skip. Fix: draw the "o" (and the pointer, on an offset-path) from the stylesheet as AreaMark's intro does, so a late script only delays the lift; lower OPENING_LATEST_MS to about 2000 and the stylesheet's bail to about 5s; fade, not cut, on bail. Command: /impeccable harden
3. [P2] The hold is dead air and the proof arrives late. For 1.2 seconds nothing moves; "Pause the tour" and the dot key are on screen over a bare map; the tour then restarts with a 1.1s lead-in, so the first figure appears about 5.5 seconds in (inferred from the tour's constants), where a returning visitor gets all three cards at 0.8 seconds. Fix, keeping the owner's hold and bare map: hold the tour's controls and key back until the words come, start the map's pointer about 250ms after the words instead of 1100ms, and let the pointer that drew the "o" walk across to the map and start the first area. Command: /impeccable animate
4. [P2] The headline breaks mid-thought: "Plot an area on / the map. Get / the insights." at 390, 1024, 1440 and 1920, with "Get" stranded. Fix: keep "Get the insights." together. Command: /impeccable typeset
5. [P2] The search's edges (inferred from PlaceSearch.tsx, not reproduced): Enter before the place list has loaded sends the visitor to the Playground without their place; an empty "Show me" picks the largest place; focus shows nothing while the list loads. Command: /impeccable harden

## Persona red flags

- Jordan (first-timer): for three seconds the page says only a name beside an unlabelled map; the key explains dots that are not there; the headline says to plot, the map takes no click, and nothing says plotting is one screen down.
- Casey (phone): the name passes straight through the headline; the search field is not visible until about 3.6 seconds; a slow phone shows the holed name for seconds.
- Riley (stress tester): a key mid-draw ghosts the name over the headline; a new tab replays the opening and a reload does not; pressing "Pause the tour" during the opening likely skips and pauses on a bare map (inferred).
- Maria (returning Limassol agent): every new tab costs 3.5 seconds of a name she already knows before the figures she came for.

## Minor observations

- At full size the "o" still uses the small logo's line weight: the line looks thin against the stems and the dots heavy.
- The name arrives in the nav with no settle.
- The pointer is 22px beside a 110px name and fades out with no relation to the map's pointer.
- DESIGN.md says the opening is "about 3.5s"; it measures 3.7s on the dev server. Its Display row and the areas' corner description have drifted from the screen.
- At 1024 the "Limassol" label sits about 8px above the Anexartisias card.

## Questions to consider

- A stranger waits 5.5 seconds for the first figure and a returning visitor gets three cards at 0.8. Which of them needed the proof first?
- The screen now says the name three times (opening, nav, the olive letters in the headline). What is splitting "insights" into two colours still buying?
