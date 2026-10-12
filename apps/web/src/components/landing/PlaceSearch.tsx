"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { AreaInfo, AreaType } from "@/lib/dashboard/types";
import { int } from "@/lib/landing/areaLines";
import { PICK_EVENT, PICK_NAME_EVENT, type PickedPlace } from "@/lib/landing/compare";

// What a row says under a place's name, in a visitor's words: what it is where that helps, and its district.
const KIND: Partial<Record<AreaType, string>> = { district: "District", tourist_area: "Resort", quarter: "Quarter", parish: "Quarter" };
const under = (p: AreaInfo) =>
  [KIND[p.areaType], p.district && p.district !== p.nameEn && p.areaType !== "district" ? `${p.district} district` : null]
    .filter(Boolean)
    .join(", ");
const MOST = 6;

type Place = AreaInfo & { lat: number; lng: number };
/** Lower case, with accents off, so "λεμεσος" finds "Λεμεσός". */
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** How well a name answers what was typed: its start, the start of a word in it, or anywhere in it. */
function fit(name: string, q: string): number {
  const n = plain(name);
  if (!n) return 0;
  if (n.startsWith(q)) return 3;
  if (n.split(/[\s,-]+/).some((w) => w.startsWith(q))) return 2;
  return n.includes(q) ? 1 : 0;
}

/** A place in the list: how well it answers what was typed and, when only another spelling of it does, that spelling. */
interface Found {
  place: Place;
  rank: number;
  alias: string | null;
}

/**
 * How well a place answers what was typed, by its English name and then its Greek one. A place neither name finds
 * may still be found by another spelling ("Egkomi" for Engomi), and the row says which spelling it was. Typed in
 * full, that spelling is nearly a name: the place comes under the names that start with what was typed and over
 * those that only hold it ("Limassol" finds the town Lemesos). Typed in part, it counts for less than any name.
 */
function find(place: Place, q: string): Found {
  for (const name of [place.nameEn, place.nameEl ?? ""]) {
    const rank = fit(name, q);
    if (rank) return { place, rank, alias: null };
  }
  let best: Found = { place, rank: 0, alias: null };
  // A list of places kept from before other spellings were sent has none.
  for (const alias of place.aliases ?? []) {
    const rank = plain(alias) === q ? 2.5 : fit(alias, q) / 4;
    if (rank > best.rank) best = { place, rank, alias };
  }
  return best;
}

/**
 * The first screen's way in: the visitor types a town, resort or district and picks it. The place goes to the
 * stage below (PICK_EVENT), which draws an area round it, and the page moves down to it. The list of places is
 * the Playground's own; if it cannot be had, the box opens the Playground instead and says so.
 */
export default function PlaceSearch() {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/dashboard/areas", { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`areas ${r.status}`);
        return r.json();
      })
      .then((list: AreaInfo[]) =>
        setPlaces(
          list.filter((a): a is Place => a.areaType !== "country" && a.lat != null && a.lng != null && a.listingCount > 0),
        ),
      )
      .catch(() => !ac.signal.aborted && setFailed(true));
    return () => ac.abort();
  }, []);

  const typed = plain(q);
  const found = useMemo<Found[]>(() => {
    if (!places) return [];
    const scored: Found[] = typed
      ? places.map((p) => find(p, typed)).filter((f) => f.rank > 0)
      : places.map((place) => ({ place, rank: 0, alias: null }));
    return scored.sort((a, b) => b.rank - a.rank || b.place.listingCount - a.place.listingCount).slice(0, MOST);
  }, [places, typed]);
  const active = Math.min(at, Math.max(0, found.length - 1));

  const pick = (p: Place) => {
    const detail: PickedPlace = { areaId: p.areaId, name: p.nameEn, lat: p.lat, lng: p.lng, radiusKm: p.radiusKm, listingCount: p.listingCount };
    window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail }));
    setQ(p.nameEn);
    setOpen(false);
    input.current?.blur();
    document.getElementById("draw")?.scrollIntoView();
  };

  // The first screen's picture asks for its town by name (PICK_NAME_EVENT): it is picked as if it had been typed,
  // the town itself before a district of the same name. A name no place has may be another spelling of one
  // ("Limassol" is the town Lemesos). Without the list of places the Playground has its own search.
  const byName = useRef<(name: string) => void>(() => {});
  byName.current = (name: string) => {
    if (!places) {
      if (failed) window.location.assign("/dashboard");
      else document.getElementById("draw")?.scrollIntoView();
      return;
    }
    const want = plain(name);
    const townFirst = (a: Place, b: Place) => Number(a.areaType === "district") - Number(b.areaType === "district") || b.listingCount - a.listingCount;
    const match =
      places.filter((p) => plain(p.nameEn) === want).sort(townFirst)[0] ??
      places.filter((p) => (p.aliases ?? []).some((a) => plain(a) === want)).sort(townFirst)[0];
    if (match) pick(match);
    else document.getElementById("draw")?.scrollIntoView();
  };
  useEffect(() => {
    const on = (e: Event) => byName.current((e as CustomEvent<string>).detail);
    window.addEventListener(PICK_NAME_EVENT, on);
    return () => window.removeEventListener(PICK_NAME_EVENT, on);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Without the list of places there is nothing to pick from: the Playground has its own search.
    if (!places) return window.location.assign("/dashboard");
    if (found[active]) pick(found[active].place);
    else setOpen(true);
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (found.length) setAt((active + (e.key === "ArrowDown" ? 1 : found.length - 1)) % found.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const shown = open && places != null;
  return (
    <div className="lh-find">
      <form
        className="lh-box"
        role="search"
        onSubmit={submit}
        // The field is glass: where its rim catches the light follows a mouse along it, and goes back when the mouse leaves.
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--gx", `${Math.round(((e.clientX - r.left) / r.width) * 1000) / 10}%`);
        }}
        onPointerLeave={(e) => e.currentTarget.style.removeProperty("--gx")}
      >
        <Search size={20} strokeWidth={2.2} aria-hidden="true" />
        <label className="sr-only" htmlFor={`${listId}-q`}>
          A town, resort or district in Cyprus
        </label>
        <input
          ref={input}
          id={`${listId}-q`}
          type="text"
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown && found[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Your town, resort or district"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
            setOpen(true);
          }}
          // The field may hold a place already picked (typed, or asked for by the picture above): focus selects it, so
          // what is typed next replaces it rather than running on from it.
          onFocus={(e) => {
            e.currentTarget.select();
            setOpen(true);
          }}
          // A tap on a row lands after the blur: the list stays long enough to take it.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={key}
        />
        <button type="submit" className="th-go">
          <span>Show me</span>
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <ul id={listId} className="lh-list m-0 list-none" role="listbox" aria-label="Places" hidden={!shown}>
          {found.map(({ place: p, alias }, i) => (
            <li
              key={p.areaId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerEnter={() => setAt(i)}
              // The row is taken on the press, before the input's blur closes the list.
              onPointerDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
            >
              <span>
                <b>{p.nameEn}</b>
                {alias && <span> · {alias}</span>}
                {p.nameEl && <span lang="el"> {p.nameEl}</span>}
              </span>
              {under(p) && <small>{under(p)}</small>}
              <em>{int(p.listingCount)} short-&#8288;lets</em>
            </li>
          ))}
          {shown && found.length === 0 && (
            <li className="lh-none" role="option" aria-selected={false} aria-disabled="true">
              No place by that name. Try a town or a district, in English or Greek.
            </li>
          )}
        </ul>
      </form>
      {failed && <p className="lh-try m-0">The list of places can&apos;t be reached just now. The button opens the Playground.</p>}
    </div>
  );
}
