// The first screen's opening (owner, 2026-10-12): on the first page of a visit the name arrives large where the
// words will be, as "Pl tsights"; the pointer that draws the tour's areas draws its "o"; the name goes up to its
// place in the nav, and as it goes the words come in and the picture starts to draw. The map is there throughout
// ("this only happens to the left of the hero. Map is still visible"). It is decided before the first paint by
// OPENING_SCRIPT (app/layout.tsx), which marks the document; components/landing/Opening.tsx plays it, the tour
// (TownTour.tsx) waits for it, and app/landing-hero.css holds everything back while the mark is there.

/** Set for the visit once the opening has been given its turn: it plays on the first page of a visit only. */
const OPENED_KEY = "ps-opened";

/** Fired when the words come in: the tour starts to draw then. */
export const OPENING_WORDS = "ps:opening-words";

/** A page that comes alive later than this after it was asked for lets the name go at once: the stylesheet lets
    the words through at 5s whatever happens, and there would be no time left to lift the name off them. */
export const OPENING_LATEST_MS = 4000;

/** How long after the words come in the tour's pointer starts on the first corner. The opening's pointer is
    already resting there, so the stop it hands over to needs none of a later town's lead-in. */
export const OPENING_TOUR_LEAD_MS = 450;

/**
 * Run from the document itself, ahead of the page, so the first paint already knows. It plays on the landing page
 * only, once a visit, never for a visitor who has asked for less motion, and never when the link points into the page.
 * A press, key or wheel before the page's own script is there calls the opening off at once (the page is then
 * simply as it is on any other visit); once Opening.tsx is mounted it marks itself live and answers them itself.
 */
export const OPENING_SCRIPT = `try{var r=document.documentElement;if(location.pathname==="/"&&!location.hash&&!sessionStorage.getItem("${OPENED_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){sessionStorage.setItem("${OPENED_KEY}","1");r.dataset.opening="on";var t=["pointerdown","keydown","wheel","touchstart"],f=function(){t.forEach(function(n){removeEventListener(n,f,true)});if(r.dataset.opening==="on"&&!document.querySelector(".op[data-live]"))delete r.dataset.opening};t.forEach(function(n){addEventListener(n,f,{capture:true,passive:true})})}}catch(e){}`;

/** "on" while the name is being drawn, "landing" from the moment the words come in until the name is in the nav. */
export const openingState = (): "on" | "landing" | null => {
  if (typeof document === "undefined") return null;
  const state = document.documentElement.dataset.opening;
  return state === "on" || state === "landing" ? state : null;
};

/** The words come in and the tour may draw; the name is still on its way up. */
export function landOpening() {
  document.documentElement.dataset.opening = "landing";
  window.dispatchEvent(new Event(OPENING_WORDS));
}

/** The name is in the nav: the page is as it is on every other visit. */
export function endOpening() {
  delete document.documentElement.dataset.opening;
}
