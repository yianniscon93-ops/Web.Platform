# PropSights PWA — mobile-first sketch (Sep 2026)

Mockups only; no app code yet. Live, editable canvas:
https://claude.ai/artifact/PoU8rknzYo4vAXcPxEEXGc

Phone frames are 390×844 (Area view 390×900, it scrolls on device); the
desktop frame is 1440×900. Brand as in `../landing-rework-2026-08/`: paper
`#F5F1E8` / card `#FFFFFF`, ink `#1A2014`, olive `#4A5E3A`, terracotta
`#D98C4A`; Sora display, Manrope body, JetBrains Mono labels. No dark theme.

| Artboard | Screen |
|---|---|
| `Main.dc.html` | 1 · Install / first open — logo over a faint island, one-line value prop, "Add to home screen" sheet. |
| `Home.dc.html` | 2 · Home (Explore tab) — search, "Draw an area" chip, Cyprus map with listing dots coloured by effective occupancy, hollow rings = sale listings, legend, popular-area cards. |
| `Area.dc.html` | 3 · Area view — drawn polygon strip, 3 KPI ranges (occupancy, nightly rate, gross yield) with comp counts, 12-month occupancy sparkline with IQR band, asking-price and long-let ranges, Compare / Get Buyer Report. |
| `Listing.dc.html` | 4 · Listing sheet — bottom sheet over the map: photo, asking price, €/m², days listed, price-change history, "Get the Buyer Report for this property — €390". |
| `Order1..3.dc.html`, `OrderDone.dc.html` | 5 · Order flow — link or brochure → contact + closing date → Stripe pay → confirmation with the 48-hour promise. |
| `Report.dc.html` | 6 · Report delivered — PDF preview thumbnail, download, share to lawyer. |
| `More.dc.html` | 7 · More — methodology, sample reports, about, contact. No login. |
| `Desktop.dc.html` | 8 · Explore at 1440 — filter rail left, map centre, area card right. |
| `canvas.json` | Artboard layout + sticky notes (colour roles, data provenance, flow links). |

Conventions carried on every screen: ranges rather than point estimates on
each KPI, the snapshot date in mono small caps, and the comp count (`n = …`)
beside every short-term-rental figure. Olive is navigation and primary
actions; terracotta is reserved for the €390 Buyer Report entry points and
the drawn-area highlight.

Data: numbers are sketch values in the shape the app returns (ranges are
interquartile across comps). The map reuses the real coastline and district
borders from the August landing mockup plus a 10% sample of its plotted
listings; the Protaras · Pernera polygon sits on the densest cluster there.

Artboards link to each other for Play mode: Install → Home; the tab bar joins
Home / Area / Report / More; Area and Listing → Order 1 → 2 → 3 →
Confirmation → Home.
