"use client";

import { useState, useEffect, useRef } from "react";
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.querySelector(".lh");
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

  // The product icons are shown in the phone menu only; "How it works" and "Ask the team" are not products and
  // have none. "How it works" joins the bar from 1024px, where there is room for it.
  // In the page's order (plan 3): "How it works" comes straight after the first screen.
  const links = [
    { label: "How it works", href: "#how", Icon: null, wide: true },
    { label: "Reports", href: "#reports", Icon: ReportsIcon, wide: false },
    { label: "Connector", href: "#connector", Icon: ConnectorIcon, wide: false },
    { label: "Ask the team", href: "#access", Icon: null, wide: false },
  ];

  return (
    // No entrance: the bar is there from the first frame.
    <header
      className={`th-landing bn-nav${night ? " bn-night" : ""}`}
      data-day={night ? undefined : ""}
      data-menu={open ? "" : undefined}
    >
      <div className="bn-nav-in">
        <a href="#" className="bn-nav-name">
          {/* The wordmark: the plot is its "o", its dots the brand's colour on this ground (--th-a). */}
          <Wordmark size={26} />
        </a>
        {/* An eyebrow for the bar, as in the reference (owner, 2026-10-17: eyebrows on). From 1280px, where it has room. */}
        <span className="bn-nav-tag">Property data for Cyprus</span>

        <nav className="bn-nav-links" aria-label="Sections">
          {links.map((l) => (
            <a key={l.label} href={l.href} className={`th-navlink${l.wide ? " bn-nav-wide" : ""}`}>
              {l.label}
            </a>
          ))}
          <a href="/dashboard" className="th-go bn-nav-go">
            Open the Playground
          </a>
        </nav>

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
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}>
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
