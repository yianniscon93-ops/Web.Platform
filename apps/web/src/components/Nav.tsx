"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import AreaMark from "@/components/landing/AreaMark";
import { ConnectorIcon, ReportsIcon } from "@/components/landing/ProductIcons";
import { LANDING as C } from "@/components/landing/tokens";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // The product icons are shown in the phone menu only; "Ask the team" is not a product and has none.
  const links = [
    { label: "Reports", href: "#reports", Icon: ReportsIcon },
    { label: "Connector", href: "#connector", Icon: ConnectorIcon },
    { label: "Ask the team", href: "#access", Icon: null },
  ];

  return (
    // No entrance: the bar is there from the first frame.
    <header
      className="th-landing fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
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
          <AreaMark size={32} />
          <span className="text-[22px] font-bold" style={{ letterSpacing: "-0.035em" }}>
            {BRAND.name}
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="th-navlink flex min-h-11 items-center text-[15px] font-medium"
              style={{ color: C.ink }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/dashboard"
            className="th-solid inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold"
            style={{ background: C.solid, color: C.solidInk }}
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
                className="flex min-h-12 items-center gap-3 text-base font-medium"
                style={{ color: C.ink, borderBottom: `1px solid ${C.groundLine}` }}
              >
                {/* The icon column is kept on every row, so the labels line up. */}
                <span className="flex w-6 shrink-0 justify-center">{l.Icon && <l.Icon size={24} />}</span>
                {l.label}
              </a>
            ))}
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="th-solid mt-4 flex h-12 items-center justify-center rounded-full text-base font-semibold"
              style={{ background: C.solid, color: C.solidInk }}
            >
              Open the Playground
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
