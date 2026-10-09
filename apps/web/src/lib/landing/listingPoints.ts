import type { PointRow } from "@/lib/dashboard/types";

let asked: Promise<PointRow[]> | null = null;

/**
 * Every listing's position, fetched once for the page: the first screen's tour and the stage's map both draw
 * from it, and both get the same answer. A fetch that fails is forgotten, so the next caller tries again.
 */
export function listingPoints(): Promise<PointRow[]> {
  asked ??= fetch("/api/dashboard/points")
    .then((r) => {
      if (!r.ok) throw new Error(`points ${r.status}`);
      return r.json() as Promise<PointRow[]>;
    })
    .catch((err) => {
      asked = null;
      throw err;
    });
  return asked;
}
