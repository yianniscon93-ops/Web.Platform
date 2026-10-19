"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectorIcon, ReportsIcon } from "@/components/landing/ProductIcons";
import Wordmark from "@/components/landing/Wordmark";

/**
 * The landing's bar (Blue Night, owner 2026-10-17). While the night hero lies under it, it is part of the hero: no
 * ground of its own, the night's ink, the brand's dots in ice, a short tagline in mist and the ice pill to the
 * Playground, set inside the hero card's top. Once the hero has gone by it turns to day: a white frosted bar the
 * width of the page (it floats over the page, so it is glass, DESIGN.md), the navy pill. Its styles are
 * `.bn-nav` in app/landing-hero.css.
 */
export default function Nav() {
  // True while the hero is under the bar.
  const [night, setNight] = useState(true);
  // True once this script runs: only then can the bar turn to day, so only then is it fixed (`.bn-nav` in
  // landing-hero.css). Without it the bar scrolls away with the hero instead of lying, night-coloured, over white.
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
    // The landing's hero (.lh), or another page's night card that says the bar lies over it (`data-nav-night`, the
    // Solutions page).
    const hero = document.querySelector(".lh, [data-nav-night]");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    // Night while the hero fills the top of the window; day well before its foot (its strip, its last card) can slide
    // under the bar.
    const io = new IntersectionObserver(([entry]) => setNight(entry.isIntersecting), { rootMargin: "-200px 0px 0px 0px" });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // The sheet belongs to the narrow bar only: from 768px the links are in the bar, so a menu left open while the
  // window widens is closed (the sheet is also hidden there in CSS, `.bn-nav-sheet`).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    if (mq.matches) setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // While open: focus goes to the sheet's first link, and Escape closes it and hands focus back to the Menu pill.
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      menuRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The bar is on the landing and on the Solutions page. "How it works" is the landing's, so from elsewhere it goes
  // there; "Ask the team" (#access, the close) and the products' own addresses are on both pages. "Solutions" (owner,
  // 2026-10-19) takes the place of "Reports" and "Connector" in the bar: a fifth link did not fit beside the pill at
  // 768 to 1023px nor beside the tagline from 1280px, and the page it opens holds both. The phone menu has room, so it
  // keeps them, with their icons (the product icons are shown in the phone menu only). "How it works" joins the bar
  // from 1024px, where there is room for it. In the page's order (plan 3): "How it works" comes straight after the
  // first screen.
  const path = usePathname();
  const home = path === "/";
  const links = [
    { label: "How it works", href: home ? "#how" : "/#how", Icon: null, wide: true, bar: true },
    { label: "Solutions", href: "/solutions", Icon: null, wide: false, bar: true, here: path === "/solutions" },
    { label: "Reports", href: "#reports", Icon: ReportsIcon, wide: false, bar: false },
    { label: "Connector", href: "#connector", Icon: ConnectorIcon, wide: false, bar: false },
    { label: "Ask the team", href: "#access", Icon: null, wide: false, bar: true },
  ];

  return (
    // No entrance: the bar is there from the first frame.
    <header
      className={`th-landing bn-nav${night ? " bn-night" : ""}`}
      data-day={night ? undefined : ""}
      data-menu={open ? "" : undefined}
      data-ready={ready ? "" : undefined}
    >
      <div className="bn-nav-in">
        {/* Home: the top of the landing, from the landing itself without a reload. */}
        <a href={home ? "#" : "/"} className="bn-nav-name" aria-label={home ? undefined : "Plotsights home"}>
          {/* The wordmark: the plot is its "o", its dots the brand's colour on this ground (--th-a). */}
          <Wordmark size={26} />
        </a>
        {/* An eyebrow for the bar, as in the reference (owner, 2026-10-17: eyebrows on). From 1280px, where it has room. */}
        <span className="bn-nav-tag">Property data for Cyprus</span>

        <nav className="bn-nav-links" aria-label="Sections">
          {links
            .filter((l) => l.bar)
            .map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`th-navlink${l.wide ? " bn-nav-wide" : ""}`}
                aria-current={l.here ? "page" : undefined}
              >
                {l.label}
              </a>
            ))}
          <a href="/dashboard" className="th-go bn-nav-go">
            Open the Playground
          </a>
        </nav>

        {/* On a phone and a tablet the way into the Playground stays in the bar beside "Menu" (owner, 2026-10-18). Where
            the whole name does not fit (under 420px) it reads "Playground", and keeps "Open the" for a screen reader. */}
        <a href="/dashboard" className="th-go bn-nav-go bn-nav-go-short">
          <span className="bn-go-more">Open the&nbsp;</span>Playground
        </a>

        <button
          ref={menuRef}
          type="button"
          className="bn-nav-menu"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="bn-nav-sheet"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="bn-nav-sheet"
            ref={sheetRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            // The menu is a night sheet over whatever is under it, solid: the page must not read through the links.
            className="bn-nav-sheet bn-night"
          >
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} aria-current={l.here ? "page" : undefined}>
                {/* The icon column is kept on every row, so the labels line up. */}
                <span className="bn-nav-icon">{l.Icon && <l.Icon size={24} />}</span>
                {l.label}
              </a>
            ))}
            <a href="/dashboard" onClick={() => setOpen(false)} className="th-go">
              Open the Playground
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
