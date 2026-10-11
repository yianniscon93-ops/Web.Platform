---
target: landing page
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/home/user/Web.Platform/apps/web/app/page.tsx"
target_fingerprint: "sha256:ea807aae6ca84e0136707091aafad9be76adaea0f2e31305033ae559573ff1e6"
target_path: /home/user/Web.Platform/apps/web/app/page.tsx
timestamp: 2026-10-11T13-53-20Z
slug: apps-web-app-page-tsx
---
Target: landing page (apps/web/app/page.tsx), after the 2026-10-11 type-scale change. Method: dual-agent.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Live counts, pending state; the close form shows "Sent" when nothing is sent |
| 2 | Match system / real world | 3 | Bare "Short-let 9" on pins, "Get it three ways", "Connector" alone |
| 3 | User control and freedom | 3 | Pause tour, Reset, Whole island, Change the area |
| 4 | Consistency and standards | 3 | Nav Playground button ink vs olive elsewhere; connector has four names |
| 5 | Error prevention | 3 | Accent-folding search, email field |
| 6 | Recognition rather than recall | 3 | "Everything below is about Limassol" is excellent; products not named on screen one |
| 7 | Flexibility and efficiency | 3 | Arrow keys in search, deep links, double-click zoom |
| 8 | Aesthetic and minimalist design | 2 | Same numbers in six places; empty report sheet; 11 phone screens |
| 9 | Error recovery | 3 | Good no-match copy and fetch fallback |
| 10 | Help and documentation | 3 | "How the numbers are made"; occupancy undefined beside figures |
| Total | | 29/40 | Good |

Specificity: authored for Plotsights (drawn-area language everywhere). Structural sameness: split header x3, identical card anatomy x3, products presented three times.

Priority issues
- [P0] Close form simulates sending ("Sent… Thanks. We will write back.", CTASection.tsx:44-53); Privacy/Terms go to "#" (Footer.tsx:20-21). Both "Ask for a report" and "Ask for access" end here. Fix: wire the form or remove the promise; real links; two-path close (Playground + team) with true team facts. /impeccable harden, /impeccable clarify.
- [P1] First screen never names the three products (PRODUCT.md requirement). Fix: three rows under search (icon, name, one clause) linking to #playground/#reports/#connector; one name for the connector. /impeccable clarify, /impeccable layout.
- [P1] Card stack glass looks like a rendering bug: ghost text from the card beneath shows through covered headers (frost at 70%, landing-glass.css:59-69); How section slides over the stack with no edge, cutting the Connector header. Fix: headers >=96% opaque; give .hw a top edge. /impeccable polish.
- [P1] Middle repeats itself: the same three figures appear in six places; 5,407px desktop / 9,401px phone; nested mock-up cards. Fix: stage panels closed by default; each card shows only what it alone can show. /impeccable distill.
- [P2] Headline verb unavailable: hero map takes no pointer (TownTour.tsx:523, landing-hero.css:144). Fix: hover cue + click sends the town to the stage. /impeccable onboard.

Type after the scale-up: nothing under 13px, figures calm and exact; overshoots at the hero lede 24px between 1024-1279px (4 lines in 484px), and 18px muted card ledes above 17px ink statements (inverted). Eight sizes in use, four within 3px.

Detector/browser: 1 advisory on markup (#0C100A wrapper, never visible). CSS advisories mostly false positives (mask #000, inner radii). Real: .lh-list 18px radius off scale; phone display clamp and 24px lede not on the ramp. Overlay: sr-only overflow, crossfade img, hatch stripes, heading rhythm are false positives; nested-cards x3-4 real. Contrast: only the orange "Plot"/"sights" fails (1.86:1; owner's decision, display only). Non-breaking hyphens (47, "short‑let") missing from the Google Sans subset, drawn in a fallback face. Inter + Barlow (92 KiB) downloaded on the landing and never used. "See it on the map" link 130x23 touch target. No horizontal overflow 360-1440.

Minor: lh-list radius; DESIGN.md has a second stale Typography section (lines ~395-422); landing-hero.css:17 comment says "Prop"; search glow smudge at 1x; ~40% empty sea on stage map; no as-of date on hero figures.
