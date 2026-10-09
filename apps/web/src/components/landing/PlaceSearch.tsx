"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { AreaInfo, AreaType } from "@/lib/dashboard/types";
import { int } from "@/lib/landing/areaLines";
import { PICK_EVENT, type PickedPlace } from "@/lib/landing/compare";

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

/** How well a place answers what was typed: the start of its name, the start of a word in it, or anywhere in it. */
function rank(place: Place, q: string): number {
  for (const name of [place.nameEn, place.nameEl ?? ""]) {
    const n = plain(name);
    if (!n) continue;
    if (n.startsWith(q)) return 3;
    if (n.split(/[\s,-]+/).some((w) => w.startsWith(q))) return 2;
    if (n.includes(q)) return 1;
  }
  return 0;
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
  const found = useMemo(() => {
    if (!places) return [];
    const scored = typed
      ? places.map((p) => [p, rank(p, typed)] as const).filter(([, r]) => r > 0)
      : places.map((p) => [p, 0] as const);
    return scored
      .sort((a, b) => b[1] - a[1] || b[0].listingCount - a[0].listingCount)
      .slice(0, MOST)
      .map(([p]) => p);
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Without the list of places there is nothing to pick from: the Playground has its own search.
    if (!places) return window.location.assign("/dashboard");
    if (found[active]) pick(found[active]);
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
      <form className="lh-box" role="search" onSubmit={submit}>
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
          onFocus={() => setOpen(true)}
          // A tap on a row lands after the blur: the list stays long enough to take it.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={key}
        />
        <button type="submit" className="th-go">
          <span>Show me</span>
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <ul id={listId} className="lh-list m-0 list-none" role="listbox" aria-label="Places" hidden={!shown}>
          {found.map((p, i) => (
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
                {p.nameEl && <span lang="el"> {p.nameEl}</span>}
              </span>
              {under(p) && <small>{under(p)}</small>}
              <em>{int(p.listingCount)} short&#8209;lets</em>
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
