import { int } from "@/lib/landing/areaLines";

/**
 * A true database count that may count up as its block arrives (Reveal.tsx; owner, 2026-10-17). The page carries
 * the true figure; the digits that count are hidden from screen readers, which are given the true figure beside
 * them, so nothing but the true number is ever read out. Tabular figures keep its width while it counts.
 */
export default function Count({ n }: { n: number }) {
  return (
    <>
      <span className="ct" data-count={Math.round(n)} aria-hidden="true">
        {int(n)}
      </span>
      <span className="sr-only">{int(n)}</span>
    </>
  );
}
