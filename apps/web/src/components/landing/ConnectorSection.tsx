"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";
import type { SelectionStats } from "@/lib/dashboard/types";
import { BRAND } from "@/lib/brand";
import type { HeroArea } from "@/lib/landing/areaContext";
import { question } from "@/lib/landing/areaLines";
import type { DrawnArea } from "@/lib/landing/compare";
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
import { ConnectorIcon } from "./ProductIcons";
import { Card, READING, carryRequest, inside, stillPreferred, useArrival } from "./SectionParts";

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
type QuestionId = (typeof QUESTIONS)[number]["id"];
const FIRST: QuestionId = "summary";
const langOf = (id: QuestionId) => (id === "greek" ? "el" : undefined);

/** The questions in the visitor's own voice. The first is the one the hero's Connector panel asks, in its words. */
function ask(id: QuestionId, area: HeroArea): string {
  if (id === "summary") return question(area.place.name, area.changed);
  if (id === "trend") return "How has it moved over the year?";
  if (id === "bedrooms") return "What do places with two or more bedrooms take here?";
  if (id === "cuts") return "Are sellers cutting prices here?";
  if (id === "greek") return greekQuestion(area.place, area.changed);
  if (id === "reviews") return "What do guests say in their reviews here?";
  return "Show me on the map.";
}

/** /stats takes the Playground's filters; `minBeds` is "this many bedrooms or more" (buildWhere in marketData.ts). */
const BEDROOMS_BODY = { filters: { minBeds: 2 } };

// An exchange being played: the question is typed into the composer (TYPE_MS a character, TYPE_MAX_MS at most),
// sent (it stands alone for ASKED_MS), and the answer is "being written" for TYPING_MS.
const TYPE_MS = 30;
const TYPE_MAX_MS = 1200;
const ASKED_MS = 380;
const TYPING_MS = 900;
const typeTime = (text: string) => Math.min(TYPE_MAX_MS, text.length * TYPE_MS);

/** What stands in an answer's place: the answer, a wait, or a plain "cannot answer". */
type Turn =
  | { state: "ready"; reply: Reply; demo: boolean; pending: boolean }
  | { state: "waiting" }
  | { state: "failed" };

const CANNOT = "I can\u2019t reach the listings just now, so I have no figure to give you.";

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
 * exchange. On arrival the first question is asked this way, once. Every
 * answer has the connector's own shape: what it found, how firm that is, and
 * the date it refers to where the data has one (the for-sale figures have
 * none). The last question is one it cannot answer, and it says so. The
 * composer only displays the chosen question: the list of questions is the
 * control.
 */
export default function ConnectorSection({
  area,
  index,
  basemaps,
}: {
  area: HeroArea;
  index: number;
  /** The server-rendered street maps (AreaBasemap), one per place, for "show me on the map". */
  basemaps?: Partial<Record<DrawnArea["key"], React.ReactNode>>;
}) {
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
  const card = useRef<HTMLElement>(null);
  const { arrived, arriving } = useArrival(card);
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
    timers.current = [
      window.setTimeout(() => setPlaying({ id, stage: "asked" }), typed + 120),
      window.setTimeout(() => setPlaying({ id, stage: "typing" }), typed + 120 + ASKED_MS),
      window.setTimeout(() => setPlaying(null), typed + 120 + ASKED_MS + TYPING_MS),
    ];
  }

  // The card's arrival: the first question is asked, once, unless the visitor has already asked something.
  const greeted = useRef(false);
  useEffect(() => {
    if (!arriving || greeted.current) return;
    greeted.current = true;
    if (thread.length === 1 && !playing) play(FIRST);
    // Only the arrival starts it; what it reads is as of that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arriving]);

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
    greeted.current = true;
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

  /** Phones: from the conversation back up to the questions. */
  function another() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.current?.closest(".ps-card-lead")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    list.current?.querySelector<HTMLButtonElement>(`[data-q="${chosen}"]`)?.focus({ preventScroll: true });
  }

  function onKey(e: React.KeyboardEvent) {
    const i = QUESTIONS.findIndex((q) => q.id === chosen);
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (i + 1) % QUESTIONS.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (i + QUESTIONS.length - 1) % QUESTIONS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? QUESTIONS.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(QUESTIONS[to].id, true);
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

  // Bring the chosen exchange into view. Where the conversation scrolls inside its own frame (beside the
  // questions, from 1024px) only that frame moves, and it follows the answer as it arrives; where the page
  // is one column the page goes to the exchange once, when it is chosen.
  const wentTo = useRef(0);
  // Whether the page has gone to the exchange itself for this choice (and not only to the composer).
  const went = useRef(false);
  useEffect(() => {
    const box = log.current;
    if (!goTo || !box) return;
    const behavior = stillPreferred() ? "auto" : "smooth";
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const el = box.querySelector<HTMLElement>(`[data-x="${goTo.id}"]`);
    if (!el) {
      // Its question is still being typed: on one column, the composer it is typed into comes into view.
      if (!wide && wentTo.current !== goTo.n) composer.current?.scrollIntoView({ block: "center", behavior });
      wentTo.current = goTo.n;
      went.current = false;
      return;
    }
    if (wide) {
      box.scrollTo({ top: el.offsetTop - 12, behavior });
    } else if (wentTo.current !== goTo.n || !went.current) {
      el.scrollIntoView({ block: "start", behavior });
    }
    wentTo.current = goTo.n;
    went.current = true;
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
    <Card
      cardRef={card}
      id="connector"
      index={index}
      name="Connector"
      icon={<ConnectorIcon size={32} />}
      sentence={`The connector puts ${BRAND.name} inside Claude. It uses MCP, the open standard for giving an assistant tools, so you ask in plain words and it answers from the same data.`}
      arrived={arrived}
      arriving={arriving}
      aside={`Example answers, written from today\u2019s figures for ${area.changed ? "the area you drew" : "the area on the map"}.`}
      notes={[
        "Understands place names in Greek and English.",
        "Says how firm each answer is, and the date where the data has one.",
        "Tells you plainly when it cannot answer.",
      ]}
      action={
        <>
          <p className="ps-action-note">Access is set up by the team for now.</p>
          <a href="#access" className="ps-solid" onClick={() => carryRequest("Access to the Claude connector")}>
            Ask for access
            <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </a>
        </>
      }
      lead={
        <>
          <h3 id={`${ids}-ask`} className="ps-h3">
            What you can ask
          </h3>
          <div ref={list} className="ps-questions" role="radiogroup" aria-labelledby={`${ids}-ask`} onKeyDown={onKey}>
            {QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                role="radio"
                data-q={q.id}
                aria-checked={chosen === q.id}
                tabIndex={chosen === q.id ? 0 : -1}
                onClick={() => choose(q.id)}
              >
                <i aria-hidden="true" />
                <span>
                  <span lang={langOf(q.id)}>{ask(q.id, area)}</span>
                  <small>{q.draws}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      }
      object={
        <div ref={objectRef}>
          <div className="ps-chat">
            <div className="ps-chat-head">
              {/* The connector is named as the hero's panel names it. */}
              <p>A conversation in Claude with the {BRAND.name} connector, Noesis Cyprus</p>
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
                // While an exchange plays, the answer waits its turn; after that it waits only for figures.
                const typing = stage === "typing" || (stage == null && turn.state === "waiting");
                const answered = stage == null && turn.state !== "waiting";
                return (
                  <div
                    key={id}
                    className="ps-exchange"
                    data-x={id}
                    aria-busy={typing || (turn.state === "ready" && turn.pending) || undefined}
                  >
                    <p className="ps-bubble ps-bubble-q" data-play={lively}>
                      <span className="sr-only">You asked: </span>
                      <span lang={lang}>{ask(id, area)}</span>
                    </p>
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
                      <div className="ps-bubble ps-bubble-a" data-play={lively}>
                        <p className="ps-tool">
                          {BRAND.name} connector · {q.draws}
                        </p>
                        {turn.state === "ready" ? (
                          <>
                            <p className="ps-reply" lang={lang} data-pending={turn.pending ? "" : undefined}>
                              {turn.reply.text}
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
                                {turn.demo && <span className="ps-tag">Demo data</span>}
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
                        basemap={basemaps?.[area.place.key]}
                        lively={lively != null}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* The composer: where the chosen question is typed and sent. A display, not a field: the list is the control. */}
            <div className="ps-composer" aria-hidden="true" data-on={composing ? "" : undefined}>
              <i />
              <span ref={composer} className="ps-composer-text" lang={composing ? langOf(composing) : undefined} />
              <span className="ps-composer-idle">The question you choose is asked here</span>
            </div>
            {/* Where the questions are above the conversation, not beside it: the way back to them. */}
            <div className="ps-chat-foot">
              <button type="button" className="ps-textbtn" onClick={another}>
                Ask another question
                <ArrowUp size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite" lang={said.lang}>
            {said.text}
          </p>
        </div>
      }
    />
  );
}
