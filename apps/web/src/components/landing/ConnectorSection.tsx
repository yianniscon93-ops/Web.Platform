"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Check, Minus } from "lucide-react";
import type { SelectionStats } from "@/lib/dashboard/types";
import { BRAND } from "@/lib/brand";
import type { HeroArea } from "@/lib/landing/areaContext";
import { int, question } from "@/lib/landing/areaLines";
import {
  GREEK_UNREACHABLE,
  REVIEWS_REPLY,
  bedroomsReply,
  cutsReply,
  greekQuestion,
  greekReply,
  mapReply,
  summaryReply,
  trendReply,
  type Reply,
} from "@/lib/landing/sectionLines";
import { useAreaAnswer, useNear } from "@/lib/landing/useAreaAnswer";
import AreaMiniMap from "./AreaMiniMap";
import { READING, inside, stillPreferred } from "./SectionParts";

// What a visitor can ask, and which of the connector's abilities each one draws on. The sixth is the first
// again in Greek: the connector takes place names in both languages. The last is one the connector has no
// tool for, so its answer is that it cannot answer.
const QUESTIONS = [
  { id: "summary", draws: "area summary" },
  { id: "trend", draws: "trend by month" },
  { id: "bedrooms", draws: "area summary, two bedrooms and up" },
  { id: "cuts", draws: "price signals" },
  { id: "map", draws: "area map" },
  { id: "greek", draws: "area summary" },
  { id: "reviews", draws: "not covered" },
] as const;
export type QuestionId = (typeof QUESTIONS)[number]["id"];
const FIRST: QuestionId = "summary";
const langOf = (id: QuestionId) => (id === "greek" ? "el" : undefined);

/** The questions in the visitor's own voice. The first is the one the hero's Connector panel asks, in its words. */
function ask(id: QuestionId, area: HeroArea): string {
  if (id === "summary") return question(area.place.name, area.changed, area.place.frame != null);
  if (id === "trend") return "Which months fill up, and which go quiet?";
  if (id === "bedrooms") return "What do 2+ bedroom short-\u2060lets take a night here?";
  if (id === "cuts") return "Are sellers cutting prices here?";
  if (id === "greek") return greekQuestion(area.place, area.changed);
  if (id === "reviews") return "What do guests say in their reviews here?";
  return "Show me on the map.";
}

/** A question's chip: the few words that name it (the whole question is what is typed and sent). */
function chip(id: QuestionId): string {
  if (id === "summary") return "How are short-\u2060lets doing?";
  if (id === "trend") return "Which months fill up?";
  if (id === "bedrooms") return "2+ bedroom rates";
  if (id === "cuts") return "Are sellers cutting prices?";
  if (id === "map") return "Show me on the map";
  if (id === "greek") return "Ask in Greek";
  return "What do guests say?";
}

/** One line of what the connector did before it answered: done, or found nothing to do it with. */
type ToolStep = { text: string; none?: boolean };

/**
 * What the connector does for a question, as Claude shows a tool at work: it finds the area, then reads what the
 * question needs, each line ticked as it is done. The lines follow the connector's own tools (`draws`) and quote the
 * figures the answer rests on; the reviews question finds no tool and says so.
 */
function stepsFor(id: QuestionId, area: HeroArea, count: number | null, weeks: number): ToolStep[] {
  const place = id === "greek" ? area.place.inGreek || area.place.name : area.place.name;
  const find = { text: `Finding the area: ${place}` };
  const lets = count != null ? `${int(count)} short-\u2060lets` : "the short-\u2060lets";
  if (id === "summary" || id === "greek") return [find, { text: `Reading ${lets}` }, { text: "Reading occupancy and nightly rates" }];
  if (id === "trend") return [find, { text: weeks > 0 ? `Reading ${weeks} weeks of bookings` : "Reading the weeks of bookings" }];
  if (id === "bedrooms") return [find, { text: "Keeping 2+ bedroom short-\u2060lets" }, { text: "Reading their nightly rates" }];
  if (id === "cuts") return [find, { text: "Reading asking prices" }, { text: "Checking price changes" }];
  if (id === "map") return [find, { text: `Placing ${lets}` }, { text: "Drawing the map" }];
  return [{ text: "Looking for a tool that reads reviews" }, { text: "None in this connector", none: true }];
}
/** How long the connector "works" before an answer: a beat, then a line ticked every STEP_MS. */
const STEP_MS = 280;
const workTime = (steps: number) => 260 + steps * STEP_MS;

/** /stats takes the Playground's filters; `minBeds` is "this many bedrooms or more" (buildWhere in marketData.ts). */
const BEDROOMS_BODY = { filters: { minBeds: 2 } };

// An exchange being played: the question is typed into the composer (TYPE_MS a character, TYPE_MAX_MS at most),
// sent (it stands alone for ASKED_MS), and the connector works through its steps (workTime) before the answer.
const TYPE_MS = 30;
const TYPE_MAX_MS = 1200;
const ASKED_MS = 380;
const typeTime = (text: string) => Math.min(TYPE_MAX_MS, text.length * TYPE_MS);

/** What stands in an answer's place: the answer, a wait, or a plain "cannot answer". */
type Turn =
  | { state: "ready"; reply: Reply; demo: boolean; pending: boolean }
  | { state: "waiting" }
  | { state: "failed" };

const CANNOT = "I can\u2019t reach the listings just now, so I have no figure to give you.";

/**
 * An answer's words. For an exchange the visitor has just played they come in one after another, as a streamed
 * reply does in Claude (and in Raycast's and Vercel's AI demos): every word is in the page from the start, and only
 * its opacity waits its turn (landing-sections.css), so nothing is hidden from a reader, a screen reader or a page
 * whose script has stopped. With reduced motion the answer is simply there.
 */
function Streamed({ text, on }: { text: string; on: boolean }) {
  if (!on) return <>{text}</>;
  const words = text.split(/(\s+)/);
  let n = 0;
  return (
    <span className="ps-stream">
      {words.map((w, k) =>
        /^\s+$/.test(w) || w === "" ? (
          w
        ) : (
          <span key={k} style={{ "--w": n++ } as React.CSSProperties}>
            {w}
          </span>
        ),
      )}
    </span>
  );
}
/** How many words an answer streams, so what follows it can wait for it. */
const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** "Firm: it rests on 24 listings." with the level set apart from what it rests on. */
function Firmness({ line, lang }: { line: string; lang?: string }) {
  const at = line.indexOf(":");
  return (
    <p className="ps-firm" lang={lang}>
      <b>{line.slice(0, at + 1)}</b>
      {line.slice(at + 1)}
    </p>
  );
}

/**
 * The connector's card: questions a visitor can ask, and the conversation
 * they build. Choosing a question types it into the composer at the foot of
 * the conversation, sends it, and adds that exchange under the earlier ones
 * (a short wait, then an example answer written from today's figures for the
 * area on the hero's map); a question already asked goes back to its
 * exchange. The first exchange is there from the start, answered. Every
 * answer has the connector's own shape: what it found, how firm that is, and
 * the date it refers to where the data has one (the for-sale figures have
 * none). The last question is one it cannot answer, and it says so. The
 * composer only displays the chosen question: the list of questions is the
 * control.
 *
 * The Connector's working thing on the products' stage (ProductsSection,
 * 2026-10-18). It stays mounted while another product is shown: an exchange
 * that is playing when the visitor switches away runs on to its answer out of
 * sight, so coming back finds it answered. Its first exchange plays only the
 * first time its panel is open in view.
 */
export default function ConnectorChat({
  area,
  without,
}: {
  area: HeroArea;
  /**
   * Questions to leave out of the chips (optional; the landing passes none). The Solutions page leaves out
   * "bedrooms", which the real connector has no filter for (docs/SOLUTIONS.md).
   */
  without?: readonly QuestionId[];
}) {
  // The questions offered as chips. The first is always kept: it is the exchange already in place.
  const asks = without?.length ? QUESTIONS.filter((q) => q.id === FIRST || !without.includes(q.id)) : QUESTIONS;
  // The questions asked so far, oldest first, and the one last chosen.
  const [thread, setThread] = useState<QuestionId[]>([FIRST]);
  const [chosen, setChosen] = useState<QuestionId>(FIRST);
  // The exchange being played, and how far it has got: its question being typed into the composer, sent, or
  // being answered. Null once its answer may show.
  const [playing, setPlaying] = useState<{ id: QuestionId; stage: "composing" | "asked" | "typing" } | null>(null);
  // The exchange to bring into view: set by a choice, never by the area changing.
  const [goTo, setGoTo] = useState<{ id: QuestionId; n: number } | null>(null);
  // What assistive tech is told: one thing per choice, the answer.
  const [said, setSaid] = useState<{ text: string; lang?: string }>({ text: "" });
  const ids = useId();
  const objectRef = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  // The exchanges that arrived by being played: their bubbles animate in.
  const played = useRef(new Set<QuestionId>());
  // The choice whose answer has not been announced yet.
  const toSay = useRef<QuestionId | null>(null);
  const near = useNear(objectRef);
  // The weeks of bookings the trend question reads (the island's weekly series), for its step.
  const weeks = area.figures?.stats?.weekly.length ?? 0;

  // The one figure the hero does not have: /stats for the same polygon, filtered to two or more bedrooms.
  const bedrooms = useAreaAnswer<SelectionStats>({
    path: "/api/dashboard/stats",
    polygon: area.polygon,
    place: area.place.key,
    body: BEDROOMS_BODY,
    enabled: near && thread.includes("bedrooms"),
    demoScoped: true,
  });

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Plays the exchange for `id`: typed, sent, answered. */
  function play(id: QuestionId) {
    timers.current.forEach(clearTimeout);
    played.current.add(id);
    setPlaying({ id, stage: "composing" });
    const typed = typeTime(ask(id, area));
    const working = workTime(stepsFor(id, area, area.count, weeks).length);
    timers.current = [
      window.setTimeout(() => setPlaying({ id, stage: "asked" }), typed + 120),
      window.setTimeout(() => setPlaying({ id, stage: "typing" }), typed + 120 + ASKED_MS),
      window.setTimeout(() => setPlaying(null), typed + 120 + ASKED_MS + working),
    ];
  }

  // The first exchange is in place from the start, answered: the panel is never an empty conversation waiting for
  // its arrival (critique, 2026-10-14). Only a question the visitor chooses is typed, sent and answered.

  // The question being typed: written into the composer a few characters at a time. The composer is a
  // display (aria-hidden), so nothing here is announced.
  const composing = playing?.stage === "composing" ? playing.id : null;
  useEffect(() => {
    const el = composer.current;
    if (!composing || !el) return;
    const text = ask(composing, area);
    const total = typeTime(text);
    const t0 = performance.now();
    let raf = 0;
    const type = (now: number) => {
      const n = Math.min(text.length, Math.ceil(((now - t0) / total) * text.length));
      el.textContent = text.slice(0, n);
      if (n < text.length) raf = requestAnimationFrame(type);
    };
    raf = requestAnimationFrame(type);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = "";
    };
    // The text is fixed for the length of one typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composing]);

  function choose(id: QuestionId, focus = false) {
    if (focus) list.current?.querySelector<HTMLButtonElement>(`[data-q="${id}"]`)?.focus();
    setChosen(id);
    setGoTo((g) => ({ id, n: (g?.n ?? 0) + 1 }));
    toSay.current = id;
    setSaid({ text: "" });
    // Asked already: back to that exchange, which is not played again.
    if (thread.includes(id)) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThread((t) => [...t, id]);
    if (stillPreferred()) {
      setPlaying(null);
      return;
    }
    play(id);
  }

  /** Back to the first exchange alone. */
  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    played.current.clear();
    toSay.current = null;
    setThread([FIRST]);
    setChosen(FIRST);
    setPlaying(null);
    setGoTo(null);
    setSaid({ text: "" });
    // The control that was pressed is about to go: the keyboard moves to the question that is left.
    list.current?.querySelector<HTMLButtonElement>(`[data-q="${FIRST}"]`)?.focus({ preventScroll: true });
    log.current?.scrollTo({ top: 0 });
  }

  function onKey(e: React.KeyboardEvent) {
    const i = asks.findIndex((q) => q.id === chosen);
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (i + 1) % asks.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (i + asks.length - 1) % asks.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? asks.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(asks[to].id, true);
  }

  const { stats = null, invest = null } = area.figures ?? {};
  const count = area.count ?? stats?.listingCount ?? null;
  const waiting = area.status === "loading";

  /** The answer to a question as the page's figures now have it. Every exchange in the thread follows the area. */
  function turnFor(id: QuestionId): Turn {
    // Not a question about the area's figures: the same answer whatever the area, and never demo data.
    if (id === "reviews") return { state: "ready", reply: REVIEWS_REPLY, demo: false, pending: false };
    if (id === "map") {
      // The listings and their shades are from the same data as the area's figures, so the answer carries their date.
      return {
        state: "ready",
        reply: mapReply(area.name, count, area.dots != null, stats?.weekly),
        demo: stats?.source === "demo",
        pending: false,
      };
    }
    if (id === "bedrooms") {
      return bedrooms.data
        ? { state: "ready", reply: bedroomsReply(bedrooms.data, count), demo: bedrooms.data.source === "demo", pending: bedrooms.pending }
        : bedrooms.failed
          ? { state: "failed" }
          : { state: "waiting" };
    }
    if (id === "cuts") {
      return invest
        ? {
            state: "ready",
            reply: cutsReply(invest, inside(invest)),
            demo: invest.source === "demo",
            // An island-wide answer does not change when the area does.
            pending: area.pending && inside(invest),
          }
        : waiting
          ? { state: "waiting" }
          : { state: "failed" };
    }
    if (stats && count != null) {
      const reply = id === "summary" ? summaryReply(count, stats) : id === "greek" ? greekReply(count, stats) : trendReply(count, stats.weekly);
      return { state: "ready", reply, demo: stats.source === "demo", pending: area.pending };
    }
    return waiting || (stats && count == null) ? { state: "waiting" } : { state: "failed" };
  }
  // An exchange whose question is still being typed is not in the conversation yet.
  const turns = thread.filter((id) => id !== composing).map((id) => ({ id, turn: turnFor(id) }));
  const goToState = goTo ? turns.find((t) => t.id === goTo.id)?.turn.state : undefined;

  // Bring the chosen exchange into view inside the thread, which scrolls in its own frame at every width (the chips
  // and the composer under it stay where the visitor's thumb is), following the answer as it arrives.
  useEffect(() => {
    const box = log.current;
    if (!goTo || !box) return;
    const el = box.querySelector<HTMLElement>(`[data-x="${goTo.id}"]`);
    box.scrollTo({ top: el ? el.offsetTop - 12 : box.scrollHeight, behavior: stillPreferred() ? "auto" : "smooth" });
  }, [goTo, playing, goToState]);

  // One announcement per choice: the answer, once it is on show, and only while the section is in or near
  // the viewport. Nothing here speaks when the area changes: the hero announces that itself.
  useEffect(() => {
    const id = toSay.current;
    if (!id || !near || playing?.id === id) return;
    const turn = turns.find((t) => t.id === id)?.turn;
    if (!turn || turn.state === "waiting") return;
    toSay.current = null;
    const lang = langOf(id);
    setSaid({
      text:
        turn.state === "failed"
          ? lang
            ? GREEK_UNREACHABLE
            : CANNOT
          : [turn.reply.text, turn.reply.firm, turn.reply.asOf].filter(Boolean).join(" "),
      lang,
    });
  });

  return (
    // One navy card, as Claude itself is laid out: the thread, then the questions to try as chips, then the
    // composer they feed. Picking a chip types its question into the composer, sends it, shows the connector's
    // steps ticking, then streams the answer into the thread.
    <div ref={objectRef} className="bn-card bn-night ps-convo">
      <div className="ps-chat">
        <div className="ps-chat-head">
          {/* The connector is named as the hero's panel names it. */}
          <p>An example conversation in Claude, answered by {BRAND.name} Cyprus from the latest figures</p>
          {thread.length > 1 && (
            <button type="button" className="ps-chat-clear" onClick={clear}>
              Clear
            </button>
          )}
        </div>
        {/* Not a live region: a choice is announced once, below, and a change of area by the hero. */}
        <div ref={log} className="ps-chat-log" role="group" aria-label="Example conversation">
          {turns.map(({ id, turn }) => {
            const q = QUESTIONS.find((x) => x.id === id)!;
            const lang = langOf(id);
            const stage = playing?.id === id ? playing.stage : null;
            const lively = played.current.has(id) ? "" : undefined;
            // The first exchange is in place from the start; the first time its panel is open in view it plays once: the question,
            // the connector's steps ticking, the answer streaming in (landing-motion.css).
            const first = id === FIRST && lively == null;
            // While an exchange plays, the answer waits its turn; after that it waits only for figures.
            const typing = stage === "typing" || (stage == null && turn.state === "waiting");
            const answered = stage == null && turn.state !== "waiting";
            const steps = stepsFor(id, area, count, weeks);
            return (
              <div
                key={id}
                className="ps-exchange"
                data-x={id}
                data-first={first ? "" : undefined}
                aria-busy={typing || (turn.state === "ready" && turn.pending) || undefined}
                style={{ "--steps": steps.length } as React.CSSProperties}
              >
                <p className="ps-bubble ps-bubble-q" data-play={lively}>
                  <span className="sr-only">You asked: </span>
                  <span lang={lang}>{ask(id, area)}</span>
                </p>
                {/* What the connector did, as Claude shows a tool at work: each step ticked as it is done. */}
                {stage !== "asked" && (
                  <div className="ps-steps" data-play={lively} data-working={typing ? "" : undefined}>
                    <p className="ps-steps-h">
                      {BRAND.name} Cyprus · {q.draws}
                    </p>
                    <ol>
                      {steps.map((st, k) => (
                        <li key={st.text} data-none={st.none ? "" : undefined} style={{ "--s": k } as React.CSSProperties}>
                          {st.none ? (
                            <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                          )}
                          {st.text}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {typing && (
                  <p className="ps-bubble ps-bubble-a ps-typing" data-play={lively}>
                    <span className="sr-only">The connector is answering.</span>
                    <span className="ps-typing-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    {/* Without motion the wait is said in words. */}
                    <span className="ps-typing-words" aria-hidden="true">
                      {READING}
                    </span>
                  </p>
                )}
                {answered && (
                  <div
                    className="ps-bubble ps-bubble-a"
                    data-play={lively}
                    style={turn.state === "ready" ? ({ "--words": wordsIn(turn.reply.text) } as React.CSSProperties) : undefined}
                  >
                    {turn.state === "ready" ? (
                      <>
                        <p className="ps-reply" lang={lang} data-pending={turn.pending ? "" : undefined}>
                          <Streamed text={turn.reply.text} on={lively != null || first} />
                        </p>
                        {id === "map" && (
                          <p className="ps-reply-link">
                            <a href={area.playgroundHref} className="th-link">
                              Open it in the Playground
                            </a>
                            {/* A hand-drawn shape cannot be passed to the Playground yet (docs/LANDING.md). */}
                            {area.changed && <small>The Playground opens on {area.place.name}, not on your redrawn area.</small>}
                          </p>
                        )}
                        {turn.reply.firm && <Firmness line={turn.reply.firm} lang={lang} />}
                        {(turn.reply.asOf || turn.demo) && (
                          <p className="ps-meta">
                            {turn.reply.asOf && <span lang={lang}>{turn.reply.asOf}</span>}
                            {turn.demo && <span className="ps-tag">Sample data</span>}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="ps-reply" lang={lang}>
                        {lang ? GREEK_UNREACHABLE : CANNOT}
                      </p>
                    )}
                  </div>
                )}
                {/* The map is a message of its own: the picture is the bubble, not a picture inside one. */}
                {answered && id === "map" && (
                  <AreaMiniMap
                    place={area.place}
                    polygon={area.polygon}
                    name={area.name}
                    dots={area.dots}
                    lively={lively != null}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* The questions to try, as chips over the composer: the control. Each names its question in a few words;
            the whole question is what is typed and sent. */}
        <div className="ps-asks">
          <p id={`${ids}-ask`} className="ps-asks-h">
            Try a question
          </p>
          <div ref={list} className="ps-questions" role="radiogroup" aria-labelledby={`${ids}-ask`} onKeyDown={onKey}>
            {asks.map((q) => (
              <button
                key={q.id}
                type="button"
                role="radio"
                data-q={q.id}
                aria-checked={chosen === q.id}
                tabIndex={chosen === q.id ? 0 : -1}
                onClick={() => choose(q.id)}
              >
                {chip(q.id)}
              </button>
            ))}
          </div>
        </div>
        {/* The composer, at rest until a chip types its question into it and sends it. A display, not a field:
            the chips are the control. */}
        <div className="ps-composer" aria-hidden="true" data-on={composing ? "" : undefined}>
          <span className="ps-composer-rest">Ask {BRAND.name} Cyprus about a place</span>
          <span ref={composer} className="ps-composer-text" lang={composing ? langOf(composing) : undefined} />
          <i className="ps-composer-send">
            <ArrowUp size={16} strokeWidth={2.4} />
          </i>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" lang={said.lang}>
        {said.text}
      </p>
    </div>
  );
}
