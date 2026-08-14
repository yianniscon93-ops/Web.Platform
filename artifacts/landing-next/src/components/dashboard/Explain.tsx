"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EXPLAINERS, type ExplainerId } from "@/lib/dashboard/explain";
import { UI } from "./tokens";

const TIP_WIDTH = 272;
const GAP = 8; // space between the bulb and the tooltip
const EDGE = 8; // min clearance from the viewport edge

/**
 * 💡 next to a stat label → a plain-language explanation of the number.
 * Clarity rules apply: readable sizes, near-white text, no jargon.
 * Hover opens on desktop; click/tap toggles (and works on mobile).
 *
 * The tooltip renders in a portal with fixed, viewport-aware positioning so
 * it never gets clipped by a card/table edge or run off the top of the page —
 * it flips below the bulb when there isn't room above, and clamps horizontally.
 */
export default function Explain({ id, align = "center" }: { id: ExplainerId; align?: "left" | "center" | "right" }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number; placement: "top" | "bottom" } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const { title, text } = EXPLAINERS[id];

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipH = tipRef.current?.offsetHeight ?? 132;

    // Prefer above; flip below when the tooltip wouldn't clear the top edge.
    const placement: "top" | "bottom" = r.top - tipH - GAP < EDGE ? "bottom" : "top";
    const top = placement === "top" ? r.top - GAP - tipH : r.bottom + GAP;

    // Anchor horizontally by alignment, then clamp inside the viewport.
    const center = r.left + r.width / 2;
    let left =
      align === "left" ? r.left : align === "right" ? r.right - TIP_WIDTH : center - TIP_WIDTH / 2;
    left = Math.max(EDGE, Math.min(left, vw - TIP_WIDTH - EDGE));
    // Keep it on-screen vertically too, just in case.
    const clampedTop = Math.max(EDGE, Math.min(top, vh - tipH - EDGE));
    setCoords({ left, top: clampedTop, placement });
  }, [align]);

  // Measure once opened, then keep it glued while open. Positioned only after
  // measuring (visibility gate below), so there's no wrong-place flash.
  useEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target as Node) &&
        tipRef.current && !tipRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const reflow = () => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reflow);
    // Reposition on any scroll (capture catches scrolling containers too).
    window.addEventListener("scroll", reflow, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
    };
  }, [open, place]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label={`What does ${title} mean?`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center justify-center w-[19px] h-[19px] rounded-full text-[11px] leading-none transition-transform hover:scale-110"
        style={{
          background: open ? "rgba(143,204,128,0.18)" : "rgba(255,255,255,0.07)",
          border: `1px solid ${open ? "rgba(143,204,128,0.4)" : UI.border}`,
        }}
      >
        💡
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.span
                ref={tipRef}
                role="tooltip"
                initial={{ opacity: 0, y: coords?.placement === "bottom" ? -4 : 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords?.placement === "bottom" ? -4 : 4, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="fixed z-[2000] block rounded-xl p-3.5 shadow-2xl"
                style={{
                  left: coords?.left ?? -9999,
                  top: coords?.top ?? -9999,
                  width: TIP_WIDTH,
                  visibility: coords ? "visible" : "hidden",
                  background: "rgba(16,20,12,0.98)",
                  border: `1px solid rgba(143,204,128,0.25)`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
              >
                <span className="block text-[13.5px] font-bold mb-1" style={{ color: UI.green }}>
                  💡 {title}
                </span>
                <span className="block text-[13.5px] leading-[1.5] font-normal normal-case tracking-normal" style={{ color: UI.text }}>
                  {text}
                </span>
              </motion.span>
            )}
          </AnimatePresence>,
          document.body
        )}
    </span>
  );
}

/** Label row with a built-in 💡 — the standard header for stat cards. */
export function StatLabel({
  id,
  children,
  align,
}: {
  id: ExplainerId;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: UI.text }}>
        {children}
      </span>
      <Explain id={id} align={align} />
    </span>
  );
}
