"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { int } from "@/lib/landing/areaLines";
import { useHeroArea, type HeroArea } from "@/lib/landing/areaContext";
import ConnectorChat, { type QuestionId } from "./ConnectorSection";
import CustomSheet from "./CustomSection";
import TippingPoint from "./PlaygroundSection";
import { PRODUCTS } from "./products";
import ReportsSheet from "./ReportsSection";
import { carryRequest, stillPreferred } from "./SectionParts";
import { IslandLights } from "./StoryLights";

type Id = (typeof PRODUCTS)[number]["id"];
/**
 * "static" is the server's HTML and a page without script: the core, the four ports as links, and the four products
 * one after another, every word and working thing in view. The script turns it to "tabs": the ports become a tablist,
 * the open product alone stands on the stage, and the lines from the core are drawn.
 */
type Mode = "static" | "tabs";
/** How a product was picked, which decides when its light runs: at once, once the page has scrolled to it, or not. */
type Light = "now" | "after-scroll" | "none";

const IDS: readonly Id[] = PRODUCTS.map((p) => p.id);
const isId = (v: string): v is Id => (IDS as readonly string[]).includes(v);
/** How long a working thing counts as arriving, for its one authored moment (as Reveal.tsx). */
const ARRIVING_MS = 3400;
/** The stage's height follows the open product: this long, on the page's travel ease. */
const STAGE_MS = 380;
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
/** Where a port's line meets it and how round the line turns off the bus. */
const NODE_R = 4.5;
const TURN_R = 14;
/** The lit line stops this far above the stage, so it never touches the words it points at. */
const SHORT = 12;

/** The models every figure goes through: How it works' steps 3 and 4, and the Playground's tipping point. */
const MODELS = ["Booked or blocked", "Priced three ways", "The tipping point"];

/** What the Playground shows, in three lines: its five views said as what they show (plan 3). */
const PROOF = [
  "Occupancy, nightly rates and booking pace",
  "Asking prices, rents and gross yields",
  "A revenue calculator that takes your own costs",
];

/**
 * Holds the browser's own scroll anchoring off while the page scrolls to a product picked from a link: the stage
 * changes height under the scroll, and anchoring on something lower on the page would move it a second time.
 */
function holdAnchoring() {
  const body = document.body;
  body.style.overflowAnchor = "none";
  window.setTimeout(() => body.style.removeProperty("overflow-anchor"), 900);
}

/** Runs `fn` once the page has stopped scrolling (or after a short wait where `scrollend` does not exist). */
function afterScroll(fn: () => void) {
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    window.removeEventListener("scrollend", once);
    fn();
  };
  window.addEventListener("scrollend", once, { once: true });
  window.setTimeout(once, 900);
}

/** A product's words on the stage: its claim, what it is, its one action. The copy is the chapters' own. */
function wordsFor(id: Id, area: HeroArea): { claim: string; body: React.ReactNode; action: React.ReactNode } {
  const go = <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />;
  if (id === "playground")
    return {
      claim: "Every street, three markets.",
      body: (
        <>
          <p>
            Street-level analytics for the whole island. Draw round a few streets or search a town, and see what the listings
            inside earn, rent for and sell for. Compare up to three places side by side.
          </p>
          <ul className="ps-proof">
            {PROOF.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ),
      action: (
        <a href={area.playgroundHref} className="th-go">
          Open the Playground
          {go}
        </a>
      ),
    };
  if (id === "reports")
    return {
      claim: "The full case, written up.",
      body: (
        <p>
          A data-driven case for one property or one area: nine sections for a property, from what it could earn to what it
          keeps after costs and what we would do with it; four for an area. Written by our team on the same data as the
          Playground, with what each figure rests on.
        </p>
      ),
      action: (
        <a href="#access" className="ps-solid" onClick={() => carryRequest(`A report on ${area.name}`)}>
          Ask for a report
          {go}
        </a>
      ),
    };
  if (id === "connector")
    return {
      claim: "Our data in Claude.",
      body: (
        <p>
          Add {BRAND.name} Cyprus to Claude and ask about any town, resort or district in plain words, in English or Greek.
          Every answer is built from our data, says what it rests on, and says so when it cannot answer.
        </p>
      ),
      action: (
        <>
          <a href="#access" className="ps-solid" onClick={() => carryRequest("Access to the Claude connector")}>
            Ask for access
            {go}
          </a>
          <span className="ps-action-note">Access is set up by the team for now.</span>
        </>
      ),
    };
  return {
    claim: "Built to your brief.",
    body: (
      <p>
        When your question is not one the Playground or a report asks, our data team builds the answer on the same Cyprus
        data: a bespoke analysis, a custom dataset or export, or a feed into your own systems.
      </p>
    ),
    action: (
      <a href={`mailto:${BRAND.email}?subject=${encodeURIComponent("Custom solutions")}`} className="ps-solid">
        Email the team
        {go}
      </a>
    ),
  };
}

// The real connector has no bedrooms filter (Data.Insights `area_summary`), so the landing leaves that chip out too.
const NOT_BACKED: readonly QuestionId[] = ["bedrooms"];

/** A product's working thing on the stage: live data on a navy card, paper on an ice tile inside the night. */
function stageFor(id: Id, area: HeroArea) {
  if (id === "playground") return <TippingPoint area={area} />;
  if (id === "connector") return <ConnectorChat area={area} without={NOT_BACKED} />;
  if (id === "reports")
    return (
      <div className="bn-tile bn-ice pd-tile">
        <ReportsSheet area={area} />
        <p className="pd-cap">A sample page, from the latest figures for {area.name}.</p>
      </div>
    );
  return (
    <div className="bn-tile bn-ice pd-tile">
      <CustomSheet />
    </div>
  );
}

/**
 * The core: the island at night with every short-let a light (How it works' own picture and lights, StoryLights.tsx),
 * what the database holds (the island's figures the page read on the server, getIsland: the same counts as the first
 * screen's line), and the models every figure goes through. On demo data the counts say "Sample data". Any count that
 * cannot be had is left out; the models are always there.
 */
function Core({ area, coreRef }: { area: HeroArea; coreRef: React.Ref<HTMLDivElement> }) {
  const { stats = null, rentals = null, invest = null } = area.figures ?? {};
  const counts = [
    { n: stats?.listingCount, label: "short-⁠lets" },
    { n: rentals?.supply, label: "long-⁠lets" },
    { n: invest?.supply, label: "for-⁠sale ads" },
  ].filter((c): c is { n: number; label: string } => c.n != null && c.n > 0);
  const demo = [stats, rentals, invest].some((part) => part?.source === "demo");
  return (
    <div ref={coreRef} className="pf-core">
      <div className="pf-core-in">
        <div className="pf-isl" role="img" aria-label="Cyprus at night: every short-let a light, brighter where it has been fuller this season">
          <div className="pf-isl-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- a drawn SVG, scaled with the canvas over it */}
            <img src="/landing/island.svg" alt="" loading="lazy" decoding="async" />
            <IslandLights />
          </div>
        </div>
        <div className="pf-data">
          {counts.length > 0 && (
            <div className="pf-group">
              <p className="pf-lab">Every listing we read</p>
              <dl className="pf-counts">
                {counts.map((c) => (
                  <div key={c.label}>
                    <dt>{c.label}</dt>
                    <dd>{int(c.n)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="pf-group">
            <p className="pf-lab">Run through our models</p>
            <ul className="pf-models">
              {MODELS.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          {demo && counts.length > 0 && (
            <p className="pf-sample">
              <span className="ps-tag">Sample data</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** A turn off the bus: down from the trunk, along the bus, down into a port, its corners rounded. */
function route(x0: number, y0: number, px: number, py: number, busY: number) {
  if (Math.abs(px - x0) < 2) return `M${x0} ${y0}V${py}`;
  const s = px > x0 ? 1 : -1;
  const r = Math.max(2, Math.min(TURN_R, Math.abs(px - x0) / 2, busY - y0, py - busY));
  return `M${x0} ${y0}V${busY - r}Q${x0} ${busY} ${x0 + s * r} ${busY}H${px - s * r}Q${px} ${busY} ${px} ${busY + r}V${py}`;
}
/** A circle as a path, so every resting node is one path. */
const circ = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/**
 * The products (owner, 2026-10-19, concept F "One database, four outputs"): one night band after "How it works". The
 * heading beside the core (the island at night, every short-let a light, with the counts of what we read and the models
 * it goes through); from the core a line runs down and splits to four ports, one per product, each its drawn icon, its
 * name and its verb; picking a port lights its line from the core down into the stage, which shows that product's words
 * and its working thing (the tipping point, the report's sheet, the Connector's conversation, the requests' sheet). A
 * light runs down the chosen line once per pick and rests; nothing moves by itself. On a phone the core stacks over the
 * ports in a two by two, the line running through their middle into the stage.
 *
 * The ports are a tablist (roving tabindex; the arrows, Home and End move and open) and each product on the stage a
 * tabpanel. The working things are mounted once and never remount, so the tipping point's figure, the report's page and
 * the conversation stay as the visitor left them. The stage is as tall as the open product: the others lie hidden over
 * it, keeping their width, and its height eases to the new product's in 380ms (the change is always under the ports, so
 * nothing under the pointer moves). The lines are decoration (aria-hidden) and need script; without it the core, the
 * four ports as links and the four products stand one after another.
 *
 * Links to #playground, #reports, #connector and #custom (the bar, the How line, the phone menu, back and forward)
 * open that product and bring its port row into view, and so does a page loaded on one of those addresses.
 */
export default function ProductsSection() {
  const area = useHeroArea();
  const uid = useId();
  const gid = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const [mode, setMode] = useState<Mode>("static");
  const [sel, setSel] = useState<Id>("playground");
  // A page opened on a product's address: its product opens at once, with no fade.
  const [instant, setInstant] = useState(false);
  const [jump, setJump] = useState(0);
  const allRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const wireRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tabs = useRef<Partial<Record<Id, HTMLButtonElement | null>>>({});
  const objs = useRef<Partial<Record<Id, HTMLDivElement | null>>>({});
  const selRef = useRef<Id>("playground");
  const pending = useRef<{ id: Id; smooth: boolean } | null>(null);
  const fromH = useRef<number | null>(null);
  const heightAnim = useRef<Animation | null>(null);
  const light = useRef<Light>("none");
  const running = useRef(0);
  const enough = useRef<Partial<Record<Id, boolean>>>({});
  const playOpen = useRef<() => void>(() => {});

  const enhanced = mode === "tabs";

  /**
   * Draws the lines from where things are laid out (offsets, so a press's scale or an arrival's rise never bends them):
   * from 1024px the trunk from the core's foot to a bus, a turn down into each port, and the chosen one lit and carried
   * on from its port into the stage; in the two by two, one line from the core's foot through the ports' middle into the
   * stage. With `play`, a light runs down the chosen line once and the line lights behind it.
   */
  const draw = useCallback((play: boolean) => {
    const all = allRef.current;
    const svg = svgRef.current;
    const core = coreRef.current;
    const stage = stageRef.current;
    if (!all || !svg || !core || !stage || !all.offsetWidth) return;
    const box = (el: HTMLElement) => {
      let x = 0;
      let y = 0;
      for (let e: HTMLElement | null = el; e && e !== all; e = e.offsetParent as HTMLElement | null) {
        x += e.offsetLeft;
        y += e.offsetTop;
      }
      return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight, cx: x + el.offsetWidth / 2 };
    };
    const ports = IDS.map((id) => tabs.current[id]).filter((el): el is HTMLButtonElement => !!el).map(box);
    if (ports.length !== IDS.length) return;
    const c = box(core);
    const st = box(stage);
    const R = Math.round;
    // The drawing starts at the core's foot, so it never lies over the heading or the core.
    const W = all.offsetWidth;
    const top = Math.max(0, Math.floor(c.b - 8));
    const H = Math.ceil(st.t + 2) - top;
    svg.style.top = `${top}px`;
    svg.setAttribute("viewBox", `0 ${top} ${W} ${H}`);
    svg.setAttribute("width", String(W));
    svg.setAttribute("height", String(H));
    const ch = ports[Math.max(0, IDS.indexOf(selRef.current))];
    const row = Math.abs(ports[0].t - ports[ports.length - 1].t) < 2;
    let base = "";
    let litA = "";
    let litB = "";
    let rest = "";
    let on: [number, number];
    let origin: [number, number];
    if (row) {
      const x0 = R(c.cx);
      const y0 = R(c.b);
      const top = R(Math.min(...ports.map((p) => p.t)));
      const busY = R(y0 + (top - y0) / 2);
      for (const p of ports) {
        base += route(x0, y0, R(p.cx), top, busY);
        if (p !== ch) rest += circ(R(p.cx), top, NODE_R);
      }
      litA = route(x0, y0, R(ch.cx), top, busY);
      litB = `M${R(ch.cx)} ${R(ch.b)}V${R(Math.max(ch.b + 8, st.t - SHORT))}`;
      on = [R(ch.cx), top];
      origin = [x0, y0];
    } else {
      const hx = R((ports[0].r + ports[1].l) / 2);
      const hy = R((ports[0].b + ports[2].t) / 2);
      litA = `M${hx} ${R(c.b)}V${hy}`;
      litB = `M${hx} ${hy}V${R(Math.max(hy + 8, st.t - SHORT))}`;
      on = [hx, hy];
      origin = [hx, R(c.b)];
    }
    const q = <T extends Element>(s: string) => svg.querySelector<T>(s)!;
    const A = q<SVGPathElement>(".pf-lit-a");
    const B = q<SVGPathElement>(".pf-lit-b");
    const spark = q<SVGGElement>(".pf-spark");
    const onG = q<SVGGElement>(".pf-on");
    q<SVGPathElement>(".pf-base").setAttribute("d", base);
    q<SVGPathElement>(".pf-rest").setAttribute("d", rest);
    A.setAttribute("d", litA);
    B.setAttribute("d", litB);
    onG.setAttribute("transform", `translate(${on[0]} ${on[1]})`);
    const o = q<SVGCircleElement>(".pf-origin");
    o.setAttribute("cx", String(origin[0]));
    o.setAttribute("cy", String(origin[1]));

    // Only geometry while a light is on its way; a new pick starts it again.
    if (running.current && !play) return;
    cancelAnimationFrame(running.current);
    running.current = 0;
    const settle = () => {
      for (const p of [A, B]) {
        p.style.removeProperty("stroke-dasharray");
        p.style.removeProperty("stroke-dashoffset");
      }
      onG.style.opacity = "1";
    };
    if (!play || stillPreferred()) {
      settle();
      spark.style.transition = "none";
      spark.style.opacity = "0";
      return;
    }
    const LA = A.getTotalLength();
    const LB = B.getTotalLength();
    const L = LA + LB;
    A.style.strokeDasharray = `${LA} ${LA}`;
    A.style.strokeDashoffset = `${LA}`;
    B.style.strokeDasharray = `${LB} ${LB}`;
    B.style.strokeDashoffset = `${LB}`;
    onG.style.opacity = "0";
    spark.style.transition = "none";
    spark.style.opacity = "1";
    const dur = Math.min(1100, Math.max(650, L * 0.9));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const d = (1 - Math.pow(1 - k, 3)) * L;
      let pt: DOMPoint;
      if (d <= LA) {
        A.style.strokeDashoffset = `${LA - d}`;
        pt = A.getPointAtLength(d);
      } else {
        A.style.strokeDashoffset = "0";
        B.style.strokeDashoffset = `${LB - (d - LA)}`;
        onG.style.opacity = "1";
        pt = B.getPointAtLength(d - LA);
      }
      spark.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      if (k < 1) {
        running.current = requestAnimationFrame(step);
        return;
      }
      running.current = 0;
      settle();
      spark.style.transition = "opacity 0.45s ease-out 0.12s";
      spark.style.opacity = "0";
    };
    running.current = requestAnimationFrame(step);
  }, []);

  /** Opens a product: the stage eases to its height, its line lights, and its light runs as `how` says. */
  const choose = useCallback(
    (id: Id, how: Light) => {
      if (id === selRef.current) {
        // The open product picked again: its light runs again, nothing else changes.
        if (how === "now") draw(true);
        if (how === "after-scroll") afterScroll(() => draw(true));
        return;
      }
      fromH.current = stageRef.current?.offsetHeight ?? null;
      light.current = how;
      setSel(id);
    },
    [draw],
  );

  // Taking the section over, and a product named in the address.
  useEffect(() => {
    setMode("tabs");
    const named = window.location.hash.slice(1);
    if (isId(named)) {
      holdAnchoring();
      setSel(named);
      setInstant(true);
      pending.current = { id: named, smooth: false };
    }
  }, []);

  // The stage follows the open product's height, and the line follows the pick.
  useLayoutEffect(() => {
    selRef.current = sel;
    const st = stageRef.current;
    const from = fromH.current;
    fromH.current = null;
    if (st && from != null) {
      heightAnim.current?.cancel();
      heightAnim.current = null;
      const to = st.offsetHeight;
      if (Math.abs(to - from) > 2 && !stillPreferred() && typeof st.animate === "function") {
        st.style.overflow = "clip";
        const a = st.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: STAGE_MS, easing: EASE });
        heightAnim.current = a;
        a.onfinish = () => {
          if (heightAnim.current !== a) return;
          heightAnim.current = null;
          st.style.removeProperty("overflow");
        };
      } else {
        st.style.removeProperty("overflow");
      }
    }
    const how = light.current;
    light.current = "none";
    draw(how === "now");
    if (how === "after-scroll") afterScroll(() => draw(true));
  }, [sel, draw]);

  // The lines are drawn once the ports are tabs, and again whenever what they join moves.
  useLayoutEffect(() => {
    if (!enhanced) return;
    draw(false);
    let raf = 0;
    const again = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(false));
    };
    const ro = new ResizeObserver(again);
    for (const el of [topRef.current, wireRef.current]) if (el) ro.observe(el);
    window.addEventListener("resize", again);
    document.fonts?.ready.then(again).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", again);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(running.current);
      running.current = 0;
    };
  }, [enhanced, draw]);

  useEffect(() => {
    if (!instant) return;
    const t = window.setTimeout(() => setInstant(false), 60);
    return () => window.clearTimeout(t);
  }, [instant]);

  // A jump lands with the port row just under the bar and the bus above it in view.
  useEffect(() => {
    const p = pending.current;
    if (!p || mode !== "tabs") return;
    pending.current = null;
    const land = () => {
      const wire = wireRef.current;
      if (!wire) return;
      const bar = document.querySelector<HTMLElement>(".bn-nav")?.offsetHeight ?? 64;
      const top = wire.getBoundingClientRect().top + window.scrollY - bar - 48;
      window.scrollTo({ top: Math.max(0, top), behavior: p.smooth && !stillPreferred() ? "smooth" : "instant" });
    };
    if (p.smooth) {
      land();
      return;
    }
    // A page opened on a product's address: the page above it is still settling (the story takes its held frame,
    // Reveal.tsx), so the jump is made again, at once, until the visitor scrolls, presses or types.
    let moved = false;
    const stop = () => {
      moved = true;
    };
    const moves = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    moves.forEach((m) => window.addEventListener(m, stop, { passive: true }));
    const raf = requestAnimationFrame(land);
    const later = [300, 1000].map((ms) => window.setTimeout(() => !moved && land(), ms));
    return () => {
      cancelAnimationFrame(raf);
      later.forEach((t) => window.clearTimeout(t));
      moves.forEach((m) => window.removeEventListener(m, stop));
    };
  }, [mode, sel, jump]);

  // In-page links to a product (the bar, the How line, the phone menu, and back and forward through them) open it here.
  useEffect(() => {
    if (mode !== "tabs") return;
    const go = (id: Id) => {
      holdAnchoring();
      pending.current = { id, smooth: true };
      choose(id, "after-scroll");
      setJump((n) => n + 1);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const id = a?.getAttribute("href")?.slice(1) ?? "";
      if (!isId(id)) return;
      e.preventDefault();
      go(id);
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    };
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (isId(id)) go(id);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, [mode, choose]);

  // Each working thing plays its one moment (the page laid down, the first answer streamed, the curve and its marks)
  // the first time it is open and in view, never while it is closed: the Connector's first exchange waits for its
  // product. Moments use app/landing-motion.css's states (data-mwait, data-on, data-arriving), as Reveal.tsx sets them
  // elsewhere. Without script, with reduced motion or without IntersectionObserver every one is simply finished.
  useEffect(() => {
    playOpen.current();
  }, [sel]);
  useEffect(() => {
    if (!enhanced) return;
    const timers: number[] = [];
    const settle = (el: HTMLElement) => {
      el.removeAttribute("data-mwait");
      el.setAttribute("data-on", "");
    };
    const play = (el: HTMLElement) => {
      if (el.hasAttribute("data-on")) return;
      el.removeAttribute("data-mwait");
      el.setAttribute("data-on", "");
      el.setAttribute("data-arriving", "");
      timers.push(window.setTimeout(() => el.removeAttribute("data-arriving"), ARRIVING_MS));
    };
    const els = IDS.map((id) => objs.current[id]).filter((el): el is HTMLDivElement => !!el);
    if (stillPreferred() || typeof IntersectionObserver === "undefined") {
      els.forEach(settle);
      return;
    }
    // A working thing already in view when the section is taken over is simply shown as it is.
    const inView = (stageRef.current?.getBoundingClientRect().top ?? Infinity) < window.innerHeight * 0.85;
    for (const id of IDS) {
      const el = objs.current[id];
      if (!el || el.hasAttribute("data-on")) continue;
      if (inView && id === selRef.current) settle(el);
      else el.setAttribute("data-mwait", "");
    }
    const maybe = () => {
      const id = selRef.current;
      const el = objs.current[id];
      if (el && enough.current[id]) play(el);
    };
    playOpen.current = maybe;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.id;
          if (!id || !isId(id)) continue;
          const tall = e.rootBounds ? e.intersectionRect.height >= e.rootBounds.height * 0.5 : false;
          const need = e.boundingClientRect.height > 560 ? 0.2 : 0.35;
          enough.current[id] = e.isIntersecting && (e.intersectionRatio >= need || tall);
        }
        maybe();
      },
      { threshold: [0, 0.1, 0.2, 0.25, 0.35, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      playOpen.current = () => {};
    };
  }, [enhanced]);

  // A port pressed low on the screen: its product opens under it, so the ports come up with the stage in view.
  function pick(id: Id) {
    choose(id, "now");
    const stage = stageRef.current;
    const wire = wireRef.current;
    if (!stage || !wire || stage.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    const bar = document.querySelector<HTMLElement>(".bn-nav")?.offsetHeight ?? 64;
    window.scrollTo({ top: wire.getBoundingClientRect().top + window.scrollY - bar - 16, behavior: stillPreferred() ? "instant" : "smooth" });
  }

  // The tablist: the arrows, Home and End move to a product and open it (roving tabindex).
  function onTabKey(e: React.KeyboardEvent) {
    const i = IDS.indexOf(sel);
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % IDS.length
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i + IDS.length - 1) % IDS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? IDS.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(IDS[to], "now");
    tabs.current[IDS[to]]?.focus();
  }

  const at = (i: number) => ({ "--i": i }) as React.CSSProperties;
  const port = (id: Id, name: string, verb: string, Icon: (typeof PRODUCTS)[number]["Icon"]) => (
    <>
      <Icon className="pf-ic" size={28} />
      <span className="pf-pn" id={`${uid}-name-${id}`}>
        {name}
      </span>
      <span className="pf-pv" id={`${uid}-verb-${id}`}>
        {verb}
      </span>
    </>
  );

  return (
    <section id="products" className="th-landing ps-sections bn-band bn-band-night bn-night pf" aria-labelledby="pf-h">
      <div className="pf-in">
        <div ref={allRef} className="pf-all">
          <div ref={topRef} className="pf-top">
            <div className="pf-say">
              <p className="bn-eb" data-rv="eb">
                Products
              </p>
              <h2 id="pf-h" className="pf-h" data-rv="">
                Market intelligence, four ways.{" "}
                <span className="ps-pay" data-rv="pay" style={at(2)}>
                  All backed by the same data.
                </span>
              </h2>
              <p className="pf-lede" data-rv="" style={at(1)}>
                Every listing we read goes into one database and through our own models. Pick the way it reaches you.
              </p>
            </div>
            <Core area={area} coreRef={coreRef} />
          </div>

          <div ref={wireRef} className="pf-wire">
            {enhanced ? (
              <div className="pf-ports" role="tablist" aria-label="Products" onKeyDown={onTabKey}>
                {PRODUCTS.map(({ id, name, verb, Icon }) => {
                  const on = sel === id;
                  return (
                    <button
                      key={id}
                      ref={(el) => {
                        tabs.current[id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`${uid}-tab-${id}`}
                      className="pf-port"
                      aria-selected={on}
                      aria-controls={`${uid}-panel-${id}`}
                      aria-labelledby={`${uid}-name-${id}`}
                      aria-describedby={`${uid}-verb-${id}`}
                      tabIndex={on ? 0 : -1}
                      onClick={() => pick(id)}
                    >
                      {port(id, name, verb, Icon)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <ul className="pf-ports" aria-label="Products">
                {PRODUCTS.map(({ id, name, verb, Icon }) => (
                  <li key={id}>
                    <a className="pf-port" href={`#${id}`}>
                      {port(id, name, verb, Icon)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            ref={stageRef}
            className="pf-stage"
            data-mode={mode}
            data-instant={instant ? "" : undefined}
            data-rv="frame"
            style={at(1)}
          >
            {PRODUCTS.map(({ id, name, who }) => {
              const open = enhanced && sel === id;
              const words = wordsFor(id, area);
              return (
                <div key={id} id={id} className="pf-item" data-item={id} data-name={name} data-open={open ? "" : undefined}>
                  {!enhanced && <h3 className="pf-h3">{name}</h3>}
                  <div
                    className="pf-panel"
                    id={`${uid}-panel-${id}`}
                    role={enhanced ? "tabpanel" : undefined}
                    aria-labelledby={enhanced ? `${uid}-tab-${id}` : undefined}
                  >
                    <div className="pf-words">
                      <p className="pf-claim">{words.claim}</p>
                      <div className="ps-lede">{words.body}</div>
                      <div className="ps-card-action">{words.action}</div>
                      <p className="pf-who">{who}</p>
                    </div>
                    <div
                      ref={(el) => {
                        objs.current[id] = el;
                      }}
                      className="pd-obj"
                      data-id={id}
                    >
                      {stageFor(id, area)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The lines from the core: decoration, drawn by the script from where things are laid out. */}
          {enhanced && (
            <svg ref={svgRef} className="pf-lines" aria-hidden="true" focusable="false">
              <defs>
                <radialGradient id={`${gid}-halo`}>
                  <stop offset="0" stopColor="#EDF3F9" stopOpacity="0.55" />
                  <stop offset="0.45" stopColor="#EDF3F9" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#EDF3F9" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path className="pf-base" />
              <path className="pf-lit pf-lit-a" />
              <path className="pf-lit pf-lit-b" />
              <path className="pf-rest" />
              <circle className="pf-origin" r="4" />
              <g className="pf-on">
                <circle r="14" fill={`url(#${gid}-halo)`} />
                <circle r={NODE_R} className="pf-on-dot" />
              </g>
              <g className="pf-spark">
                <circle r="16" fill={`url(#${gid}-halo)`} />
                <circle r="3.4" className="pf-spark-dot" />
              </g>
            </svg>
          )}
        </div>

        {/* The way to the team whatever is open (Custom solutions says it in its own button), and every solution. */}
        <div className="pf-foot" data-rv="">
          <p className="pf-ask" data-off={enhanced && sel === "custom" ? "" : undefined}>
            Not sure which one fits?{" "}
            <a href={`mailto:${BRAND.email}?subject=${encodeURIComponent(`A question for ${BRAND.name}`)}`} className="th-link">
              Email the team
            </a>
          </p>
          <a href="/solutions" className="pf-all-link">
            Explore all solutions
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
