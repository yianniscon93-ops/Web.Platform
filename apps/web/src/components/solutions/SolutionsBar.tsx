"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { id: "playground", label: "Playground" },
  { id: "reports", label: "Reports" },
  { id: "connector", label: "Connector" },
  { id: "custom", label: "Custom solutions" },
  { id: "data", label: "The data" },
] as const;
type Id = (typeof ITEMS)[number]["id"];

/**
 * The Solutions page's own bar (owner, 2026-10-18: no scrolling down and back up to reach a product): the four
 * solutions and the data, as pills, under the site's bar. It is sticky in CSS, so it follows the reader without script
 * too (under the site's bar once that bar is fixed, at the window's top before). With script it lights the band being
 * read (the one across the window's middle) and, once it has left its place under the hero and floats over the page,
 * takes the day's glass (`data-stuck`, the one surface here that floats, DESIGN.md's Glass Rule). On a phone the pills
 * scroll sideways and the lit one is kept in view. No scroll listener: two IntersectionObservers.
 */
export default function SolutionsBar() {
  const [current, setCurrent] = useState<Id | null>(null);
  const [stuck, setStuck] = useState(false);
  const mark = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // Stuck: the line just above the bar has gone up under the site's bar.
    const nav = () => (window.matchMedia("(min-width: 1024px)").matches ? 72 : 64);
    const stick = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < nav() + 1),
      {
        rootMargin: `-${nav() + 1}px 0px 0px 0px`,
      },
    );
    if (mark.current) stick.observe(mark.current);
    // The band across the window's middle is the one being read.
    const bands = ITEMS.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const seen = new Map<string, boolean>();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const on = ITEMS.find((i) => seen.get(i.id));
        setCurrent(on ? on.id : null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    bands.forEach((b) => spy.observe(b));
    return () => {
      stick.disconnect();
      spy.disconnect();
    };
  }, []);

  // A page opened on one of its addresses (/solutions#reports): the browser goes there before everything has arrived,
  // and the Playground's curve, read after the page loads, then pushes the bands under it down. For the first few
  // seconds, while the visitor has not touched the page, each change of the page's height puts the band back in place.
  useEffect(() => {
    const target = window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null;
    if (!target || typeof ResizeObserver === "undefined") return;
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    let done = false;
    const stop = () => {
      if (done) return;
      done = true;
      ro.disconnect();
      window.clearTimeout(timer);
      events.forEach((n) => window.removeEventListener(n, stop, true));
    };
    const ro = new ResizeObserver(() => {
      if (!done) target.scrollIntoView({ behavior: "instant", block: "start" });
    });
    ro.observe(document.body);
    const timer = window.setTimeout(stop, 3000);
    events.forEach((n) => window.addEventListener(n, stop, { capture: true, passive: true }));
    return stop;
  }, []);

  // On a phone the pills scroll sideways: the lit one is brought into the row's view, never the page's.
  useEffect(() => {
    const ul = list.current;
    if (!ul || !current || ul.scrollWidth <= ul.clientWidth) return;
    const a = ul.querySelector<HTMLElement>(`[href="#${current}"]`);
    if (!a) return;
    const left = a.offsetLeft - ul.offsetLeft;
    if (left < ul.scrollLeft + 16 || left + a.offsetWidth > ul.scrollLeft + ul.clientWidth - 16) {
      ul.scrollTo({
        left: Math.max(0, left - 24),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  }, [current]);

  return (
    <>
      <div ref={mark} className="so-bar-mark" aria-hidden="true" />
      <nav className="so-bar" aria-label="On this page" data-stuck={stuck ? "" : undefined}>
        <div className="so-bar-in">
          <ul ref={list}>
            {ITEMS.map((i) => (
              <li key={i.id}>
                <a href={`#${i.id}`} aria-current={current === i.id ? "true" : undefined}>
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
