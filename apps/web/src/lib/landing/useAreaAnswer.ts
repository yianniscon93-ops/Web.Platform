"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { PolygonCoords } from "@/lib/dashboard/types";

/** How long after the area moves its figures are asked for, as in the hero, so a run of key presses asks once. */
const SETTLE_MS = 300;

/** True while the element is within `margin` of the viewport. Not latched: it goes false again when scrolled away. */
export function useNear(ref: RefObject<Element | null>, margin = "320px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}

export interface AreaAnswer<T> {
  /** The newest answer for this place. It may be for the area's previous shape: see `pending`. */
  data: T | null;
  /** `data` is for an earlier shape and the answer for this one is on its way. */
  pending: boolean;
  /** Nothing to show yet and an answer is on its way (or will be, once `enabled`). */
  loading: boolean;
  /** The ask for this shape failed; `data` is withheld rather than shown as if it were current. */
  failed: boolean;
}

interface Held<T> {
  data: T | null;
  /** The ask `data` answered. */
  key: string | null;
  place: string | null;
  /** The ask that failed, if the newest one did. */
  failedKey: string | null;
}

/**
 * One figure the hero does not already have, for the area as it stands:
 * POSTs `{ polygon, ...body }` to `path` once `enabled`, and again whenever
 * the polygon changes while enabled.
 *
 * Answers are kept by polygon, so a shape that comes back asks nothing. A
 * change of shape waits SETTLE_MS; an ask that is overtaken is aborted and
 * its answer dropped, so an older answer never replaces a newer one. A failed
 * or aborted answer is neither shown nor kept. While a new answer is on its
 * way the old one stays in `data`, flagged `pending`.
 *
 * `demoScoped` says whether the endpoint's demo fallback is filtered by the
 * polygon. Where it is not, a demo answer cannot change with the area, so it
 * is not asked for again.
 */
export function useAreaAnswer<T extends { source: "live" | "demo" }>({
  path,
  polygon,
  place,
  body,
  enabled,
  demoScoped,
}: {
  path: string;
  polygon: PolygonCoords;
  /** Which place the polygon belongs to: an answer for another place is never shown. */
  place: string;
  /** Extra fields for the request body. Must be stable in content; it is part of the key. */
  body?: Record<string, unknown>;
  enabled: boolean;
  demoScoped: boolean;
}): AreaAnswer<T> {
  const extra = body ? JSON.stringify(body) : "";
  const key = `${JSON.stringify(polygon)}|${extra}`;
  const [held, setHeld] = useState<Held<T>>({ data: null, key: null, place: null, failedKey: null });
  const heldRef = useRef(held);
  heldRef.current = held;
  const cache = useRef(new Map<string, T>());
  // Counts the asks, so an answer can tell whether it is still the newest.
  const asked = useRef(0);
  // False until an ask has gone out while enabled: the first one does not wait.
  const running = useRef(false);

  useEffect(() => {
    if (!enabled) {
      running.current = false;
      return;
    }
    const mine = ++asked.current;
    const now = heldRef.current;
    if (now.key === key && now.place === place && now.data) return;
    const had = cache.current.get(key);
    // An answer that is not for the drawn area holds for every shape of it.
    const fixed = now.data && now.place === place && now.data.source === "demo" && !demoScoped ? now.data : null;
    if (had || fixed) {
      running.current = true;
      setHeld({ data: (had ?? fixed)!, key, place, failedKey: null });
      return;
    }
    const ac = new AbortController();
    const current = () => !ac.signal.aborted && mine === asked.current;
    const timer = setTimeout(
      () => {
        fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ polygon, ...(body ?? {}) }),
          signal: ac.signal,
        })
          .then((r) => {
            if (!r.ok) throw new Error(`${path} ${r.status}`);
            return r.json() as Promise<T>;
          })
          .then((data) => {
            if (!current()) return;
            cache.current.set(key, data);
            setHeld({ data, key, place, failedKey: null });
          })
          .catch(() => {
            if (!current()) return;
            setHeld((h) => ({ ...h, failedKey: key }));
          });
      },
      running.current ? SETTLE_MS : 0
    );
    running.current = true;
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
    // `polygon` and `body` are in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, place, path, demoScoped]);

  const failed = held.failedKey === key;
  const data = held.place === place && !failed ? held.data : null;
  return {
    data,
    pending: data != null && held.key !== key,
    loading: data == null && !failed,
    failed,
  };
}
