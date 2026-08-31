# Landing + Playground rework — design mockups (Aug 2026)

Mockups only; no app code yet. Live, editable canvas:
https://claude.ai/code/artifact/3479eeeb-ad2a-4224-9f46-7627269858d8

| Artboard | What |
|---|---|
| `Main.dc.html` | Landing page, desktop. Hero = copy left, real Cyprus map right (geoBoundaries coastline/districts/municipalities, OSM roads, all active listings plotted from the serving DB, coloured by effective occupancy). 34s one-shot story: draw area A → draw area B → zoom out → comparison. Stats are real values queried 2026-08-30. |
| `LandingMobile.dc.html` | Landing, mobile (hero + services). |
| `StyleTile.dc.html` | Palette (beige/olive, accent A terracotta vs B mustard — undecided), type (Sora / Manrope / JetBrains Mono), controls. |
| `Playground.dc.html` | Dashboard renamed Playground, restyled; new "Where?" control (search / draw / radius / locate). |
| `MapStates.dc.html` | Map control states: idle → search → drawing → applied → compare. |
| `canvas.json` | Artboard layout + sticky notes (decisions, build notes). |

Decisions so far: editorial hero with a single headline; Playground keeps the
current layout but restyled; selection persisted in the URL; free account
gates drawing/compare (soft gate). Open: accent colour A vs B.

Build notes carried in the sticky notes: start the hero sequence on view,
~1s after the headline; play once; pause when scrolled away; mobile shows
act 1 + the final comparison only.
