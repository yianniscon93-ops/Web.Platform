---
target: landing page (re-run)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/Web.Platform/apps/web/app/page.tsx"
target_fingerprint: "sha256:ea807aae6ca84e0136707091aafad9be76adaea0f2e31305033ae559573ff1e6"
target_path: /home/user/Web.Platform/apps/web/app/page.tsx
timestamp: 2026-10-11T15-04-16Z
slug: apps-web-app-page-tsx
---
Target: landing page (apps/web/app/page.tsx), re-run after the 2026-10-11 fixes (commits 7c26c2c, ea92f6e, and the list fixes after). Method: dual-agent.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | |
| 2 | Match system / real world | 3 | "Connector", "MCP", "the line" are jargon |
| 3 | User control and freedom | 3 | |
| 4 | Consistency and standards | 3 | Occupancy named four ways ("occupancy", "occupied this season", "taken", "really booked") |
| 5 | Error prevention | 3 | |
| 6 | Recognition rather than recall | 3 | |
| 7 | Flexibility and efficiency | 3 | Arrow-key corners, deep links land on cards |
| 8 | Aesthetic and minimalist design | 2 | The three products are told four times |
| 9 | Error recovery | 3 | |
| 10 | Help and documentation | 3 | "How the numbers are made" |
| Total | | 29/40 | Good |

Same total as the first run, different backlog: the P0 fake form, the products missing from screen one, the ghosting glass and the unclickable hero map are fixed; the re-run found deeper issues.

Specificity: authored, not a template; one generic move (the icon + name + line row, which recurs in How's last stop).

Priority issues
- [P1] The headline promises streets; the stage stops at town scale: zoom maxes at 8x the island (lib/landing/compare.ts:104); a picked place gets a stock hexagon over the whole town (DrawHero.tsx:33,50-57). Fix: open a pick at street scale with an area a few streets wide (the hero's DRAWN rings exist), or say only what the stage does. /impeccable shape, /impeccable clarify.
- [P1] The products are told four times: hero row, stage panels, cards, How's last stop. Fix: stage = map + count + one action; cards explain; How's last stop one line. /impeccable distill.
- [P1] Numbers an agent can't quote: no as-of date on the hero cards or stage, no firmness under ~10 listings, four names for occupancy, no named people (team only in 15px print in the close). /impeccable clarify.

Fixed in this round after the re-run: bar values collided at 390px (13px again); see-through phone menu (solid); search appended to a picked name (select on focus); the plot button lay over the open place list on phones/tablets (stacking); the list was cut at the hero's foot under ~900px tall (overflow-x clip); covered card headers solid in short windows.

Detector: 0 primary findings; advisories are intentional (mask #000, inner radii) or dashboard-only; phone display clamp and 24px lede now tokens in DESIGN.md. Contrast: only "Plot"/"sights" 1.86:1 (owner's choice). No fallback faces anywhere (word joiner fix holds). Nothing under 13px. No horizontal overflow 360-1440. Inter + Barlow (~93 KB) still load on the landing from app/layout.tsx (Playground's fonts; move with the Playground re-theme).

Minor: How sheet full-width vs inset cards leaves a lone Playground tab mid-scroll; ~250px empty top of the Connector chat on desktop; ~100px dead space in the report page at 1440; "Draw an area. Get it three ways." restates the H1; stage map height shifts when a panel opens.
