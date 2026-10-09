---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Landing page

Scope: the public landing page (`app/page.tsx`), starting with its first viewport. Visitor mode: Persuade.

Audience and job: property investors, short-let hosts and managers, and agents, in equal weight, finding out what PropSights is and whether it is worth exploring. The hero has to say exactly what the three products are (owner, 2026-10-08): the Playground (free dashboard comparing short-lets, long-lets and sales), Reports (written data insights on Cyprus property), and the MCP connector (the same data in Claude). Action: open the Playground. Proof: the visitor reshapes a drawn area on a real street map and the numbers change.

Constraints: no testimonials, client names or prices exist; the name is undecided (PropSights in use); nothing delivers a question or request to the team yet, so "ask for a report" and "get the connector" hand off to the existing access form; the Playground can be opened on a named area by id but not on a hand-drawn shape.

Chosen direction: Draw it, get it three ways. Memorable moment: dragging a corner of the area and watching the listings re-sort and the three products update.

History: the earlier direction, The Thread (a message thread answering an example question), was built and reviewed on 2026-10-08 and replaced the same day when the owner asked for a hero that presents the three products. Typeface (Google Sans), palette (beige, olive, tangerine) and the street maps carry over.

Below the hero (owner, 2026-10-08, verbatim: "for all 3 of the products the redirect should be find out more about connector etc. Then we scroll down and we reach the part where we are explaining more on each of our products"): three product sections, Playground, Reports and Connector, in the hero's world, each reached from its hero panel's "Find out more" link and from the nav. The area drawn in the hero carries down: a line above the sections names it, and every section's figures follow it. Each section promises one working object: the Playground's five real views previewed live with a working calculator; a report that can be leafed through by its real section titles; the connector's real kinds of question played as an exchange. The page closes on an ink band with the "Ask the team" form. The owner said of the hero and sections: "the fonts you used and the creativity I LOVE. You need to continue like this", and that more interaction is welcome.

Owner decisions on record: the public site launches on the live database (demo data is a local state only); delivery of report and connector requests is left for later (the form still only simulates sending); the accent is teal (replacing tangerine).

Unresolved: how a request reaches the team; no capture with live data exists yet.

## Direction contract

THESIS: The hero is a working instrument, not a picture of one: a street map with a hand-drawn area the visitor reshapes, and the three products shown as three things made from that one area. It refuses the category arrangement of headline, dashboard screenshot and a row of three equal feature cards.

OWN-WORLD: Beige ground (#F4F1E8), ink (#161C11), olive (#4A5E3A), teal (#0E7F7A, chosen by the owner on 2026-10-08 to replace the earlier tangerine) for the drawn area and the single primary action, white surfaces with a hairline. Google Sans for everything, tabular figures. The map is the committed street basemap (sea, shoreline, two road weights, place names). Square white handles are the brand's motif and here they are real controls. Three product icons drawn in the brand mark's vocabulary: 2px ink line, square nodes, one accent fill each.

STORY: The visitor understands that PropSights is Cyprus property data in three forms; believes it because moving a corner changes real numbers in front of them; opens the Playground, or asks for a report or the connector.

FIRST VIEWPORT: Nav. A top band: the headline at about 52px in two lines on the left, and on the right one sentence naming the three products. Below, the stage, one viewport tall with the nav and band: on the left seven-twelfths, the map with the teal area, its draggable handles, a live count of listings inside and a switch between two places; on the right five-twelfths, three product panels stacked, each with its icon, name and one live line, the Playground expanded by default with a short-let / long-let / for-sale comparison and the page's one accent-filled action. Thin lines run from the area to each panel.

SIGNATURE INTERACTION AND MOTION: Dragging a handle re-sorts the listing dots in and out of the line and ticks the count as the hand moves; the lines follow; the panels refresh from the API on release. On load the area draws itself once (handles, outline, listings, count), then the lines reach the panels. After that nothing moves unless the visitor moves it, with one kept exception: a slow pulse ring on one handle (a filled handle under reduced motion) and a "Drag a corner" label beside it, both removed for good at the first touch. The accent fill appears on exactly two controls on the page, both the same action: "Open the Playground, it's free" in the hero and in the Playground section.

FORM: Draw it, get it three ways: third on the ordered list of seven grounded structures, dealt in the surface roll with the conversation tour (lead) and three windows; the owner delegated the choice ("You choose") and it was picked for demonstrating the product's own mechanism. Seed key 0cde2279.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
