"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHeroArea } from "@/lib/landing/areaContext";
import { countLine } from "@/lib/landing/areaLines";
import AreaMark from "./AreaMark";
import ConnectorSection from "./ConnectorSection";
import PlaygroundSection from "./PlaygroundSection";
import ReportsSection from "./ReportsSection";
import { stillPreferred } from "./SectionParts";

const IDS = ["playground", "reports", "connector"] as const;
type CardId = (typeof IDS)[number];
const isCard = (id: string): id is CardId => (IDS as readonly string[]).includes(id);

// The stack's measures, in CSS pixels. landing-sections.css has the same ones as custom properties.
/** Where a pinned card's top rests: under the 72px nav, with a little of the ground showing between. */
const PIN_TOP = 80;
/** A card's header row: with room, each card pins this much lower than the one before, so the rows stay in view. */
const TAB = 56;
/** The ground left under a pinned card. */
const PIN_BOTTOM = 16;
/** The window height from which the header rows of covered cards are kept in view. */
const TABS_FROM = 880;
/** The window width from which cards may pin at all. */
const PIN_FROM = 1024;

/** Back up to the hero's map, with the keyboard on its first corner. */
function toMap(e: React.MouseEvent) {
  const map = document.querySelector<HTMLElement>(".th-map");
  if (!map) return; // No hero on this page: the link's own href takes the visitor to the top.
  e.preventDefault();
  map.scrollIntoView({ block: "center" });
  map.querySelector<HTMLElement>(".th-handle")?.focus({ preventScroll: true });
}

/**
 * The three products under the hero, as a stack of cards: Playground,
 * Reports, Connector, then the page's close (`close`, the ink band), which
 * comes up over the stack as its last sheet. All three cards are about the
 * area on the hero's map, which they read from HeroAreaProvider.
 *
 * Stacking. Where the window is at least 1024px wide and every card's own
 * content fits the room a pinned card has, each card is `position: sticky`
 * under the nav and the next slides up over it; from 880px of height each
 * pins 56px lower than the one before, so the header rows of the covered
 * cards stay in view like the tabs of a stack of folders. Whether that holds
 * is measured here (on load, on resize and whenever a card's content changes
 * height) and written on the stack as `data-pin` and `data-tabs`; the
 * stylesheet does the rest, and nothing here runs on scroll. Otherwise the
 * cards simply follow one another.
 */
export default function ProductSections({ close }: { close?: React.ReactNode }) {
  const area = useHeroArea();
  const stack = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState({ pin: false, tabs: false });
  // The window's height as last measured: what the "covered" observers' margins are worked out from.
  const [winH, setWinH] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Decide whether the cards pin: every card's own height against the room it would have when pinned.
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ps-card"));
    const measure = () => {
      const tabs = window.innerHeight >= TABS_FROM;
      const pin =
        window.innerWidth >= PIN_FROM &&
        cards.every((card, i) => {
          const own = card.firstElementChild as HTMLElement | null;
          // The card's border is outside what is measured.
          const room = window.innerHeight - PIN_TOP - (tabs ? i * TAB : 0) - PIN_BOTTOM - 2;
          // A pixel of give: under browser zoom the two heights can differ by a fraction and would flip the answer.
          return own != null && own.offsetHeight <= room + 1;
        });
      setMode((m) => (m.pin === pin && m.tabs === (pin && tabs) ? m : { pin, tabs: pin && tabs }));
      setWinH(window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const card of cards) if (card.firstElementChild) ro.observe(card.firstElementChild);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /**
   * Scrolls the page to where card `id` is settled. A pinned card does not say where it really is (it reports
   * where it is stuck), so its place is worked out from the stack: the stack's top plus the cards before it.
   */
  const goTo = useCallback((id: CardId, behavior: ScrollBehavior) => {
    const el = stack.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ps-card"));
    const at = cards.findIndex((c) => c.id === id);
    if (at < 0) return;
    let y = el.getBoundingClientRect().top + window.scrollY;
    for (const card of cards.slice(0, at)) y += card.offsetHeight + parseFloat(getComputedStyle(card).marginBottom || "0");
    const { pin, tabs } = modeRef.current;
    window.scrollTo({ top: Math.round(y - PIN_TOP - (pin && tabs ? at * TAB : 0)), behavior });
  }, []);

  // Links to a card (the nav, the hero's "find out more", a covered card's own name) land it settled under the
  // nav; so does the address on load and on back and forward.
  useEffect(() => {
    const smooth = (): ScrollBehavior => (stillPreferred() ? "auto" : "smooth");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const url = new URL((link as HTMLAnchorElement).href, window.location.href);
      const id = url.hash.slice(1);
      if (url.pathname !== window.location.pathname || !isCard(id)) return;
      e.preventDefault();
      if (window.location.hash !== url.hash) window.history.pushState(null, "", url.hash);
      goTo(id, smooth());
    };
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (isCard(id)) goTo(id, "auto");
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, [goTo]);

  // Once it is known whether the cards pin (their heights change with it), an address that names a card lands on it.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    const id = window.location.hash.slice(1);
    if (!isCard(id)) {
      landed.current = true;
      return;
    }
    const t = requestAnimationFrame(() => {
      landed.current = true;
      goTo(id, "auto");
    });
    return () => cancelAnimationFrame(t);
  }, [mode, goTo]);

  // A card is "covered" once the next one has settled over it: its header row is then a tab, and its action
  // steps out of it. An observer per card watches a thin band at the next card's resting place; no scroll listener.
  // The band is set from the window's height, so the observers are made again whenever that changes.
  useEffect(() => {
    const el = stack.current;
    if (!el || !mode.pin || !winH || typeof IntersectionObserver === "undefined") return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ps-card"));
    const observers = cards.slice(1).map((next, n) => {
      const rest = PIN_TOP + (mode.tabs ? (n + 1) * TAB : 0);
      const io = new IntersectionObserver(([entry]) => cards[n].toggleAttribute("data-covered", entry.isIntersecting), {
        rootMargin: `-${rest}px 0px -${Math.max(0, winH - rest - 40)}px 0px`,
      });
      io.observe(next);
      return io;
    });
    return () => {
      observers.forEach((io) => io.disconnect());
      cards.forEach((c) => c.removeAttribute("data-covered"));
    };
  }, [mode, winH]);

  // The keyboard reaching into a card that is under another (Tab backwards): bring that card to the top.
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    const onFocus = (e: FocusEvent) => {
      if (!modeRef.current.pin) return;
      const target = e.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>(".ps-card");
      if (!target || !card || !isCard(card.id) || !target.matches(":focus-visible")) return;
      const r = target.getBoundingClientRect();
      // Something of another card (or the close) is where the focused control should be: at its near corner,
      // its middle or its far corner, so a control the next card only half covers is brought out too.
      const hidden = [
        [r.left + Math.min(r.width / 2, 12), r.top + Math.min(r.height / 2, 12)],
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.right - Math.min(r.width / 2, 12), r.bottom - Math.min(r.height / 2, 12)],
      ].some(([x, y]) => {
        const over = document.elementFromPoint(x, y);
        return over != null && !card.contains(over) && over.closest(".ps-card, .ps-close") != null;
      });
      if (hidden) goTo(card.id, "auto");
    };
    el.addEventListener("focusin", onFocus);
    return () => el.removeEventListener("focusin", onFocus);
  }, [goTo]);

  return (
    <div className="th-landing ps-sections">
      <div className="ps-in">
        <p className="ps-tie">
          <span className="ps-tie-mark">
            <AreaMark size={28} />
          </span>
          <span className="ps-tie-text">
            Everything below is about <b>{area.name}</b>
            {/* "The area you drew" would not be true of a place's own area: until a corner has moved it is the one on the map. */}
            {area.changed ? "" : ", the area on the map above"}
            {area.count != null && (
              <>
                : <b>{countLine(area.count)}</b>
              </>
            )}
            .{" "}
            <a href="#" className="th-link" onClick={toMap}>
              Change the area
            </a>
          </span>
        </p>
      </div>
      <div ref={stack} className="ps-stack" data-pin={mode.pin ? "" : undefined} data-tabs={mode.tabs ? "" : undefined}>
        <PlaygroundSection area={area} index={0} />
        <ReportsSection area={area} index={1} />
        <ConnectorSection area={area} index={2} />
        {close}
      </div>
    </div>
  );
}
