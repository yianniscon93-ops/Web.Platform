"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ConnectorIcon, ReportsIcon } from "@/components/landing/ProductIcons";
import { LANDING as C } from "@/components/landing/tokens";
import Wordmark from "@/components/landing/Wordmark";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // True while the first screen's search is in view: it is then the screen's one filled action, and the bar's way to
  // the Playground is a plain link beside the others (critique, 2026-10-14: one filled action per screen). It starts
  // true, since the page opens on the search, so the first paint never shows a second filled button; the observer
  // turns it off once the search has gone by.
  const [quiet, setQuiet] = useState(true);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const find = document.querySelector(".lh-find");
    if (!find || typeof IntersectionObserver === "undefined") {
      setQuiet(false);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setQuiet(entry.isIntersecting), { rootMargin: "-72px 0px 0px 0px" });
    io.observe(find);
    return () => io.disconnect();
  }, []);

  // The product icons are shown in the phone menu only; "How it works" and "Ask the team" are not products and
  // have none. "How it works" joins the bar from 1024px, where there is room for it.
  const links = [
    { label: "Reports", href: "#reports", Icon: ReportsIcon, wide: false },
    { label: "Connector", href: "#connector", Icon: ConnectorIcon, wide: false },
    { label: "How it works", href: "#how", Icon: null, wide: true },
    { label: "Ask the team", href: "#access", Icon: null, wide: false },
  ];

  return (
    // No entrance: the bar is there from the first frame.
    <header
      className="th-landing fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      // The bar has a ground of its own once the page has moved under it, or its menu is open.
      data-solid={scrolled || open ? "" : undefined}
      // The open menu is solid paper: the page must not read through the links laid over it.
      data-menu={open ? "" : undefined}
      style={{
        color: C.ink,
        ...(scrolled || open
          ? {
              background: C.ground,
              borderBottom: `1px solid ${C.groundLine}`,
            }
          : { background: "transparent", borderBottom: "1px solid transparent" }),
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-16">
        <a href="#" className="flex min-h-11 items-center gap-2.5">
          {/* The wordmark is the display role: its weight is the headline's (globals.css). The plot is its "o". */}
          <Wordmark size={28} />
        </a>

        {/* Closer set between 768 and 1024px, and the button a little narrower: at the type's size the three links
            and the button need the room, and the wordmark keeps 20px clear of them at 768px. */}
        <nav className="hidden items-center gap-5 whitespace-nowrap md:flex lg:gap-9">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`th-navlink ${l.wide ? "hidden lg:flex" : "flex"} min-h-11 items-center text-[length:var(--th-text-body)] font-medium`}
              style={{ color: C.ink }}
            >
              {l.label}
            </a>
          ))}
          {/* Olive, as every way into the Playground is; a plain link while the search below is the screen's action. */}
          <a
            href="/dashboard"
            className={
              quiet
                ? "th-navlink flex min-h-11 items-center text-[length:var(--th-text-body)] font-semibold"
                : "th-go"
            }
            style={quiet ? { color: C.ink } : undefined}
          >
            Open the Playground
          </a>
        </nav>

        <button
          className="flex h-11 w-11 items-center justify-center md:hidden"
          style={{ color: C.ink }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 pb-5 sm:px-8 md:hidden"
            style={{ borderTop: `1px solid ${C.groundLine}` }}
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 text-[length:var(--th-text-body)] font-medium"
                style={{ color: C.ink, borderBottom: `1px solid ${C.groundLine}` }}
              >
                {/* The icon column is kept on every row, so the labels line up. */}
                <span className="flex w-6 shrink-0 justify-center">{l.Icon && <l.Icon size={24} />}</span>
                {l.label}
              </a>
            ))}
            <a href="/dashboard" onClick={() => setOpen(false)} className="th-go mt-4 flex w-full">
              Open the Playground
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
